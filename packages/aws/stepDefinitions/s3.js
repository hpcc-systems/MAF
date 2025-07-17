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
 * @param {string} path - The path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(path) {
    if (!path || typeof path !== 'string') return ''
    return path.replace(/\/{2,}/g, PATH_DELIMITER).replace(/([^/]{1,})$/, '$1/')
}

/**
 * Validates bucket name format and security
 * @param {string} bucketName - The bucket name to validate
 * @throws {Error} If bucket name is invalid or insecure
 */
function validateBucketName(bucketName) {
    if (!bucketName || typeof bucketName !== 'string' || !bucketName.trim()) {
        throw new Error('Bucket name cannot be empty')
    }

    // AWS S3 bucket name validation rules
    const bucketNameRegex = /^[a-z0-9.-]{3,63}$/
    if (!bucketNameRegex.test(bucketName.trim())) {
        throw new Error('Invalid bucket name format')
    }

    // Prevent potential injection attacks
    if (bucketName.includes('..') || bucketName.includes('//')) {
        throw new Error('Bucket name contains invalid characters')
    }
}

/**
 * Validates and sanitizes S3 key
 * @param {string} key - The S3 key to validate
 * @returns {string} Sanitized key
 * @throws {Error} If key is invalid
 */
function validateAndSanitizeKey(key) {
    if (!key || typeof key !== 'string') {
        throw new Error('S3 key cannot be empty')
    }

    // Remove any path traversal attempts
    const sanitized = key.replace(/\.\./g, '').replace(/\/+/g, '/').replace(/^\//, '')

    if (sanitized.length === 0) {
        throw new Error('Invalid S3 key')
    }

    return sanitized
}

/**
 * Validates file path for security
 * @param {string} filePath - The file path to validate
 * @throws {Error} If path is potentially dangerous
 */
function validateFilePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('File path cannot be empty')
    }

    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
        throw new Error('File path contains invalid characters')
    }

    // Ensure it's within allowed directories (adjust as needed)
    const allowedPrefixes = ['./test/', './tmp/', '/tmp/']
    const isAllowed = allowedPrefixes.some(prefix => filePath.startsWith(prefix))
    if (!isAllowed && !process.env.ALLOW_ALL_PATHS) {
        throw new Error('File path not in allowed directory')
    }
}

/**
 * Handles AWS SDK errors with more descriptive messages (without exposing sensitive info)
 * @param {Error} error - The original error
 * @param {string} operation - The operation that failed
 * @throws {Error} Enhanced error with context
 */
function handleS3Error(error, operation) {
    // Log full error for debugging but don't expose to user
    console.error(`S3 ${operation} error:`, error)

    // Return generic error message to prevent information disclosure
    if (process.env.NODE_ENV === 'development' || process.env.AWSENV === 'LOCALSTACK') {
        throw new Error(`S3 ${operation} failed: ${error.message}`)
    } else {
        throw new Error(`S3 ${operation} failed`)
    }
}

/**
 * Creates an S3 URL
 * @param {string} bucket - The name of the bucket
 * @param {string} path - The directory path of the S3 bucket
 * @returns {string} The S3 URL
 */
function s3URL(bucket, path) {
    return `s3://${bucket}/${path}`
}

// ================================
// CORE S3 OPERATIONS
// ================================

/**
 * Returns true if the bucket exists on AWS S3. User must have s3:ListAllMyBuckets permission on AWS
 * @param {string} bucketName - The name of the bucket
 * @returns {Promise<boolean>} true if the bucket exists on S3
 * @throws {Error} If AWS operation fails
*/
async function bucketExists(bucketName) {
    try {
        validateBucketName(bucketName)
        const res = await s3Client.send(new ListBucketsCommand({}))
        return res.Buckets && res.Buckets.some(bucket => bucket.Name === bucketName.trim())
    } catch (error) {
        handleS3Error(error, 'bucket existence check')
    }
}

/**
 * Gets the file names in the bucket and path. User must have READ access to the bucket
 * @param {string} bucketName - The name of the bucket to search
 * @param {string} path - The path of the bucket to search on
 * @param {boolean} all - true if you want to get all files from the bucket
 * @returns {Promise<string[]>} the files on the bucket and path
 * @throws {Error} If AWS operation fails
*/
async function listS3Files(bucketName, path, all = false) {
    try {
        validateBucketName(bucketName)
        let queryResults = {}
        let files = []
        let itemCount = 0
        const MAX_ITEMS = 10000 // Prevent excessive memory usage

        do {
            const queryParameters = {
                Bucket: bucketName.trim()
            }
            if (!all) {
                queryParameters.Delimiter = PATH_DELIMITER
            }
            if (path && path.length > 0) {
                queryParameters.Prefix = path.trim()
            }
            if (queryResults.IsTruncated) {
                queryParameters.ContinuationToken = queryResults.NextContinuationToken
            }
            queryResults = await s3Client.send(new ListObjectsV2Command(queryParameters))
            if (queryResults.Contents) {
                const newFiles = queryResults.Contents.map(element => element.Key)
                files = files.concat(newFiles)
                itemCount += newFiles.length

                // Prevent excessive memory usage
                if (itemCount > MAX_ITEMS) {
                    console.warn(`S3 list operation limited to ${MAX_ITEMS} items`)
                    break
                }
            }
        } while (queryResults.IsTruncated)
        return files
    } catch (error) {
        handleS3Error(error, 'list files operation')
    }
}

/**
     * Uploads a file to S3 bucket using streams for memory efficiency
     * @param {object} context - The Cucumber World context
     * @param {string} file - The file path to upload
     * @param {string} bucketName - The name of the bucket
     * @param {string} key - The S3 key (path + filename)
     * @returns {Promise<Object>} AWS S3 response
    */
async function uploadFileToS3(context, file, bucketName, key) {
    file = fillTemplate(file, context.results)
    bucketName = fillTemplate(bucketName, context.results)
    key = fillTemplate(key, context.results).replace(/\/{2,}/g, PATH_DELIMITER)

    validateBucketName(bucketName)
    key = validateAndSanitizeKey(key)

    const filePath = getFilePath(file, context)
    validateFilePath(filePath)

    if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist')
    }

    // Check file size
    const stats = fs.statSync(filePath)
    if (stats.size > MAX_UPLOAD_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${MAX_UPLOAD_SIZE} bytes`)
    }

    // Use createReadStream for memory-efficient streaming
    const Body = fs.createReadStream(filePath)
    const queryParameters = {
        Bucket: bucketName.trim(),
        Body,
        Key: key
    }
    return await s3Client.send(new PutObjectCommand(queryParameters))
}

/**
 * Downloads a file from S3 and writes it to a local file
 * @param {object} context - The Cucumber World context (for fillTemplate/getFilePath)
 * @param {string} key - The filename to retrieve from S3
 * @param {string} bucketName - The name of the S3 bucket
 * @param {string} path - The path within the bucket
 * @param {string} localFilePath - The local file path to write to
 * @returns {Promise<void>} Resolves when the file is written
*/
async function downloadS3FileToLocal(context, key, bucketName, path, localFilePath) {
    key = fillTemplate(key, context.results)
    bucketName = fillTemplate(bucketName, context.results)
    path = normalizePath(fillTemplate(path, context.results))
    localFilePath = fillTemplate(localFilePath, context.results)
    const resolvedLocalFilePath = getFilePath(localFilePath, context)

    validateBucketName(bucketName)
    key = validateAndSanitizeKey(path + key)
    validateFilePath(resolvedLocalFilePath)

    const queryParameters = {
        Bucket: bucketName.trim(),
        Key: key
    }

    const { Body } = await s3Client.send(new GetObjectCommand(queryParameters))
    // Use stream pipeline for file writing
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
 * @param {object} context - The Cucumber World context (for fillTemplate)
 * @param {string} key - The filename to retrieve from S3
 * @param {string} bucketName - The name of the S3 bucket
 * @param {string} path - The path within the bucket
 * @returns {Promise<string>} File content as string
*/
async function downloadS3FileToMemory(context, key, bucketName, path) {
    key = fillTemplate(key, context.results)
    bucketName = fillTemplate(bucketName, context.results)
    path = normalizePath(fillTemplate(path, context.results))

    validateBucketName(bucketName)
    key = validateAndSanitizeKey(path + key)

    const queryParameters = {
        Bucket: bucketName.trim(),
        Key: key
    }

    const { Body } = await s3Client.send(new GetObjectCommand(queryParameters))
    // Convert stream to string with size limit
    const chunks = []
    let totalSize = 0

    return new Promise((resolve, reject) => {
        Body.on('data', (chunk) => {
            totalSize += chunk.length
            if (totalSize > MAX_FILE_SIZE) {
                reject(new Error('File too large for memory download'))
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
    bucketName = fillTemplate(bucketName, this.results)
    path = normalizePath(fillTemplate(path, this.results))
    return await listS3Files(bucketName, path)
})

MAFWhen('all files of bucket {string} is retrieved', async function (bucketName) {
    bucketName = fillTemplate(bucketName, this.results)
    return await listS3Files(bucketName, '', true)
})

MAFWhen('file exists with name {string} at path {string} in bucket {string}', async function (key, path, bucketName) {
    key = fillTemplate(key, this.results)
    bucketName = fillTemplate(bucketName, this.results)
    path = normalizePath(fillTemplate(path, this.results))

    validateBucketName(bucketName)
    const fullKey = validateAndSanitizeKey(path + key)

    const files = await listS3Files(bucketName, path)
    if (!files.includes(fullKey)) {
        throw new Error(`File '${key}' does not exist in ${s3URL(bucketName, path)}`)
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
    try {
        return await uploadFileToS3(this, file, bucketName, key)
    } catch (error) {
        handleS3Error(error, 'file upload')
    }
})

MAFWhen('file {string} from bucket {string} at path {string} is written to {string}', async function (key, bucketName, path, localFilePath) {
    try {
        await downloadS3FileToLocal(this, key, bucketName, path, localFilePath)
    } catch (error) {
        handleS3Error(error, 'file retrieval')
    }
})

/**
 * Deprecated: Use `file {string} from bucket {string} at path {string} is written to {string}` instead
 * @deprecated
*/
MAFWhen('gz file {string} from bucket {string} at path {string} is written to {string}', async function (key, bucketName, path, localFilePath) {
    try {
        await downloadS3FileToLocal(this, key, bucketName, path, localFilePath)
    } catch (error) {
        handleS3Error(error, 'file retrieval')
    }
})

MAFWhen('file {string} from bucket {string} at path {string} is retrieved', async function (key, bucketName, path) {
    try {
        return await downloadS3FileToMemory(this, key, bucketName, path)
    } catch (error) {
        handleS3Error(error, 'file retrieval')
    }
})

/**
 * Deletes a file from S3 bucket
 * @param {string} key - The filename to delete
 * @param {string} bucketName - The name of the bucket
 * @param {string} path - The path within the bucket
 * @returns {Promise<Object>} AWS S3 response
 */
MAFWhen('file {string} is deleted from bucket {string} at path {string}', async function (key, bucketName, path) {
    try {
        key = fillTemplate(key, this.results)
        bucketName = fillTemplate(bucketName, this.results)
        path = normalizePath(fillTemplate(path, this.results))

        validateBucketName(bucketName)
        const fullKey = validateAndSanitizeKey(path + key)

        const queryParameters = {
            Bucket: bucketName.trim(),
            Key: fullKey
        }

        return await s3Client.send(new DeleteObjectCommand(queryParameters))
    } catch (error) {
        handleS3Error(error, 'file deletion')
    }
})
