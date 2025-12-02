const { setDefaultTimeout } = require('@cucumber/cucumber')
const fs = require('fs')
const { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getFilePath, MAFWhen, fillTemplate } = require('@ln-maf/core')

// Constants
const DEFAULT_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const LOCALSTACK_PORT = 4566
const PATH_DELIMITER = '/'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB limit for memory operations
const MAX_UPLOAD_SIZE = 4 * 1024 * 1024 * 1024 // 4GB limit for file uploads

setDefaultTimeout(DEFAULT_TIMEOUT)

// S3 Client Configuration
const S3ClientConfig = { maxAttempts: 3, forcePathStyle: true }
if (process.env.AWSENV && process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
    S3ClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:${LOCALSTACK_PORT}` : `http://localhost:${LOCALSTACK_PORT}`
    S3ClientConfig.region = 'us-east-1'
    S3ClientConfig.credentials = {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
}
const s3Client = new S3Client(S3ClientConfig)

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Normalizes S3 path by removing duplicate slashes and ensuring trailing slash
 */
function normalizePath(path) {
    if (!path || typeof path !== 'string') return ''
    return path.replace(/\/{2,}/g, PATH_DELIMITER).replace(/([^/]{1,})$/, '$1/')
}

/**
 * Validates bucket name format and security
 */
function validateBucketName(bucketName) {
    if (!bucketName || typeof bucketName !== 'string') {
        throw new Error(`Bucket name cannot be empty or null`)
    }
    const bucketNameRegex = /^[a-z0-9.-]{3,63}$/
    if (!bucketNameRegex.test(bucketName.trim()) || bucketName.includes('..') || bucketName.includes('//')) {
        throw new Error(`Invalid bucket name format: ${bucketName}`)
    }
}

/**
 * Validates and sanitizes S3 key
 */
function validateAndSanitizeKey(key) {
    if (!key || typeof key !== 'string') {
        throw new Error(`S3 key cannot be empty or null`)
    }
    const sanitized = key.replace(/\.\./g, '').replace(/\/+/g, '/').replace(/^\//, '')
    if (sanitized.length === 0) {
        throw new Error(`Invalid S3 key after sanitization: ${key}`)
    }
    return sanitized
}

/**
 * Validates file path for security
 */
function validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error(`File path cannot be empty or null. Received: ${filePath}`)
    }
    if (filePath.includes('..') || filePath.includes('~')) {
        throw new Error(`File path contains invalid characters: ${filePath}`)
    }
}

/**
 * Process template values for S3 operations
 */
function processTemplates(context, bucketName, key = '', path = '', localFilePath = '') {
    return {
        bucketName: fillTemplate(bucketName, context.results),
        key: fillTemplate(key, context.results),
        path: normalizePath(fillTemplate(path, context.results)),
        localFilePath: fillTemplate(localFilePath, context.results)
    }
}

/**
 * Creates an S3 URL
 */
function s3URL(bucket, path) {
    return `s3://${bucket}/${path}`
}

// ================================
// CORE S3 OPERATIONS
// ================================

/**
 * Returns true if the bucket exists on AWS S3
 */
async function bucketExists(bucketName) {
    validateBucketName(bucketName)
    const res = await s3Client.send(new ListBucketsCommand({}))
    return res.Buckets && res.Buckets.some(bucket => bucket.Name === bucketName.trim())
}

/**
 * Gets the file names in the bucket and path
 */
async function listS3Files(bucketName, path, all = false) {
    validateBucketName(bucketName)
    let queryResults = {}
    let files = []
    let itemCount = 0
    const MAX_ITEMS = 10000

    do {
        const queryParameters = { Bucket: bucketName.trim() }
        if (!all) queryParameters.Delimiter = PATH_DELIMITER
        if (path && path.length > 0) queryParameters.Prefix = path.trim()
        if (queryResults.IsTruncated) queryParameters.ContinuationToken = queryResults.NextContinuationToken
        
        queryResults = await s3Client.send(new ListObjectsV2Command(queryParameters))
        if (queryResults.Contents) {
            const newFiles = queryResults.Contents.map(element => element.Key)
            files = files.concat(newFiles)
            itemCount += newFiles.length

            if (itemCount > MAX_ITEMS) {
                console.warn(`S3 list operation limited to ${MAX_ITEMS} items`)
                break
            }
        }
    } while (queryResults.IsTruncated)
    return files
}

/**
 * Uploads a file to S3 bucket using streams
 */
async function uploadFileToS3(context, file, bucketName, key) {
    const templates = processTemplates(context, bucketName, key, '', file)
    key = templates.key.replace(/\/{2,}/g, PATH_DELIMITER)
    
    validateBucketName(templates.bucketName)
    key = validateAndSanitizeKey(key)
    
    const filePath = getFilePath(templates.localFilePath, context)
    validateFilePath(filePath)
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`)
    }
    
    const stats = fs.statSync(filePath)
    if (stats.size > MAX_UPLOAD_SIZE) {
        throw new Error(`File size (${stats.size} bytes) exceeds maximum allowed size of ${MAX_UPLOAD_SIZE} bytes`)
    }
    
    const Body = fs.createReadStream(filePath)
    const queryParameters = {
        Bucket: templates.bucketName.trim(),
        Body,
        Key: key
    }
    return await s3Client.send(new PutObjectCommand(queryParameters))
}

/**
 * Downloads a file from S3 and writes it to a local file
 */
async function downloadS3FileToLocal(context, key, bucketName, path, localFilePath) {
    const templates = processTemplates(context, bucketName, key, path, localFilePath)
    const resolvedLocalFilePath = getFilePath(templates.localFilePath, context)

    validateBucketName(templates.bucketName)
    const fullKey = validateAndSanitizeKey(templates.path + templates.key)
    validateFilePath(resolvedLocalFilePath)

    const queryParameters = {
        Bucket: templates.bucketName.trim(),
        Key: fullKey
    }
    const { Body } = await s3Client.send(new GetObjectCommand(queryParameters))
    const writeStream = fs.createWriteStream(resolvedLocalFilePath)
    return new Promise((resolve, reject) => {
        Body.pipe(writeStream)
        Body.on('error', reject)
        writeStream.on('error', reject)
        writeStream.on('finish', resolve)
    })
}

/**
 * Downloads a file from S3 and returns its content as a string
 */
async function downloadS3FileToMemory(context, key, bucketName, path) {
    const templates = processTemplates(context, bucketName, key, path)
    
    validateBucketName(templates.bucketName)
    const fullKey = validateAndSanitizeKey(templates.path + templates.key)

    const queryParameters = {
        Bucket: templates.bucketName.trim(),
        Key: fullKey
    }

    const { Body } = await s3Client.send(new GetObjectCommand(queryParameters))
    const chunks = []
    let totalSize = 0

    return new Promise((resolve, reject) => {
        Body.on('data', (chunk) => {
            totalSize += chunk.length
            if (totalSize > MAX_FILE_SIZE) {
                reject(new Error(`File size (${totalSize} bytes) exceeds maximum allowed size for memory download (${MAX_FILE_SIZE} bytes)`))
                return
            }
            chunks.push(chunk)
        })
        Body.on('error', reject)
        Body.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

// ================================
// CUCUMBER STEP DEFINITIONS
// ================================

MAFWhen('file list of bucket {string} on path {string} is retrieved', async function (bucketName, path) {
    const templates = processTemplates(this, bucketName, '', path)
    return await listS3Files(templates.bucketName, templates.path)
})

MAFWhen('all files of bucket {string} is retrieved', async function (bucketName) {
    bucketName = fillTemplate(bucketName, this.results)
    return await listS3Files(bucketName, '', true)
})

MAFWhen('file exists with name {string} at path {string} in bucket {string}', async function (key, path, bucketName) {
    const templates = processTemplates(this, bucketName, key, path)
    validateBucketName(templates.bucketName)
    const fullKey = validateAndSanitizeKey(templates.path + templates.key)

    const files = await listS3Files(templates.bucketName, templates.path)
    if (!files.includes(fullKey)) {
        throw new Error(`File '${templates.key}' does not exist in ${s3URL(templates.bucketName, templates.path)}. Available files: ${files.length > 0 ? files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : '') : 'none'}`)
    }
})

MAFWhen('bucket {string} exists on S3', async function (bucketName) {
    bucketName = fillTemplate(bucketName, this.results)
    if (!await bucketExists(bucketName)) {
        throw new Error(`Bucket '${bucketName}' does not exist on S3`)
    }
})

MAFWhen('bucket {string} is not on S3', async function (bucketName) {
    bucketName = fillTemplate(bucketName, this.results)
    if (await bucketExists(bucketName)) {
        throw new Error(`Bucket '${bucketName}' exists on S3 but should not`)
    }
})

MAFWhen('bucket {string} exists', async function (bucketName) {
    bucketName = fillTemplate(bucketName, this.results)
    if (!await bucketExists(bucketName)) {
        throw new Error(`Bucket '${bucketName}' does not exist on S3`)
    }
})

MAFWhen('file {string} is uploaded to bucket {string} as key {string}', async function (file, bucketName, key) {
    return await uploadFileToS3(this, file, bucketName, key)
})

MAFWhen('S3 file {string} from bucket {string} at path {string} is written to file {string}', async function (key, bucketName, path, localFilePath) {
    await downloadS3FileToLocal(this, key, bucketName, path, localFilePath)
})

MAFWhen('file {string} from bucket {string} at path {string} is retrieved', async function (key, bucketName, path) {
    return await downloadS3FileToMemory(this, key, bucketName, path)
})

MAFWhen('file {string} is deleted from bucket {string} at path {string}', async function (key, bucketName, path) {
    const templates = processTemplates(this, bucketName, key, path)
    validateBucketName(templates.bucketName)
    const fullKey = validateAndSanitizeKey(templates.path + templates.key)

    const queryParameters = {
        Bucket: templates.bucketName.trim(),
        Key: fullKey
    }
    return await s3Client.send(new DeleteObjectCommand(queryParameters))
})
