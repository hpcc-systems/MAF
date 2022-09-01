const { setDefaultTimeout } = require('@cucumber/cucumber')
const fs = require('fs')
const { S3Client, ListBucketsCommand, CreateBucketCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getFilePath, MAFWhen, filltemplate, performJSONObjectTransform } = require('@ln-maf/core')

setDefaultTimeout(15 * 60 * 1000)

const S3ClientConfig = { maxAttempts: 3, forcePathStyle: true }
if (process.env.AWSENV === undefined || process.env.AWSENV === '' || process.env.AWSENV.toUpperCase() === 'FALSE') {
  S3ClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'
}
const s3Client = new S3Client(S3ClientConfig)

/**
 * Creates an S3 URL
 * @param {string} bucket the name of the bucket
 * @param {string} path The directory path of the S3 bucket
 */
function s3URL (bucket, path) {
  return 's3://' + bucket + '/' + path
}

/**
 * Returns true if the bucket exists on AWS S3. User must have s3:ListAllMyBuckets permission on AWS
 * @param {string} bucketName The name of the bucket
 * @returns {boolean} true if the bucket exists on S3
 */
async function bucketExists (bucketName) {
  const res = await s3Client.send(new ListBucketsCommand({}))
  return res.Buckets.some(element => element.Name === bucketName.trim())
}

MAFWhen('bucket {string} exists on S3', async function (bucketName) {
  bucketName = filltemplate(bucketName, this.results)
  if (!await bucketExists(bucketName)) {
    throw new Error('Bucket ' + bucketName + ' does not exist on S3')
  }
})

MAFWhen('bucket {string} is not on S3', async function (bucketName) {
  bucketName = filltemplate(bucketName, this.results)
  if (await bucketExists(bucketName)) {
    throw new Error('Bucket ' + bucketName + ' does exist on S3')
  }
})

MAFWhen('bucket {string} exists', async function (bucketName) {
  bucketName = filltemplate(bucketName, this.results)
  if (!await bucketExists(bucketName)) {
    throw new Error('Bucket ' + bucketName + ' does not exist on S3')
  }
})

/**
 * Gets the file names in the bucket and path. User must have READ access to the bucket
 * @param {String} bucketName The name of the bucket to search
 * @param {String} path The path of the bucket to search on
 * @param {boolean} all true if you want to get all files from the bucket
 * @returns {String[]} the files on the bucket and path
 */
async function listS3Files (bucketName, path, all = false) {
  let queryResults = {}
  let files = []
  do {
    const queryParameters = {
      Bucket: bucketName.trim()
    }
    if (!all) {
      queryParameters.Delimiter = '/'
    }
    if (path.length !== 0) {
      queryParameters.Prefix = path.trim()
    }
    if (queryResults.IsTruncated) {
      queryParameters.ContinuationToken = queryResults.NextContinuationToken
    }
    queryResults = await s3Client.send(new ListObjectsV2Command(queryParameters))
    if (queryResults.Contents) {
      files = files.concat(queryResults.Contents.map(element => element.Key))
    }
  } while (queryResults.IsTruncated)
  return files
}

MAFWhen('file list of bucket {string} on path {string} is retrieved', async function (bucketName, path) {
  bucketName = filltemplate(bucketName, this.results)
  path = filltemplate(path, this.results).replace(/\/{2,}/g, '/').replace(/([^/]{1,})$/, '$1/')
  return await listS3Files(bucketName, path)
})

MAFWhen('all files of bucket {string} is retrieved', async function (bucketName) {
  bucketName = filltemplate(bucketName, this.results)
  return await listS3Files(bucketName, '', true)
})

MAFWhen('file exists with name {string} at path {string} in bucket {string}', async function (key, path, bucketName) {
  key = filltemplate(key, this.results)
  bucketName = filltemplate(bucketName, this.results)
  path = filltemplate(path, this.results).replace(/\/{2,}/g, '/').replace(/([^/]{1,})$/, '$1/')
  const files = await listS3Files(bucketName, path)
  if (!files.includes(path + key)) {
    throw new Error('The file does not exist in ' + s3URL(bucketName, path))
  }
})

/**
 * Puts an object on s3 bucket User must have WRITE permissions on a bucket to add an object to it
 */
MAFWhen('{jsonObject} is uploaded to bucket {string} as key {string}', async function (file, bucketName, key) {
  file = performJSONObjectTransform.call(this.results, file)
  bucketName = filltemplate(bucketName, this.results)
  key = filltemplate(key, this.results).replace(/\/{2,}/g, '/')
  const queryParameters = {
    Bucket: bucketName.trim(),
    Body: file,
    Key: key
  }
  return await s3Client.send(new PutObjectCommand(queryParameters))
})

MAFWhen('file {string} is deleted from bucket {string} at path {string}', async function (key, bucketName, path) {
  key = filltemplate(key, this.results)
  bucketName = filltemplate(bucketName, this.results)
  path = filltemplate(path, this.results).replace(/\/{2,}/g, '/').replace(/([^/]{1,})$/, '$1/')
  const queryParameters = {
    Bucket: bucketName.trim(),
    Key: path + key
  }
  return await s3Client.send(new DeleteObjectCommand(queryParameters))
})

MAFWhen('file {string} from bucket {string} at path {string} is retrieved', async function (key, bucketName, path) {
  key = filltemplate(key, this.results)
  bucketName = filltemplate(bucketName, this.results)
  path = filltemplate(path, this.results).replace(/\/{2,}/g, '/').replace(/([^/]{1,})$/, '$1/')
  const queryParameters = {
    Bucket: bucketName.trim(),
    Key: path + key
  }
  const { Body } = await s3Client.send(new GetObjectCommand(queryParameters))
  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = []
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('error', reject)
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
  return await streamToString(Body)
})

/**
 * This will create a new bucket on S3
 */
MAFWhen('bucket {string} is created on S3', async function (bucketName) {
  bucketName = filltemplate(bucketName, this.results)
  if (!/(?!(^xn--|-s3alias$))^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucketName.trim())) {
    throw new Error('Invalid bucket name. See https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html for proper bucket naming rules')
  }
  return await s3Client.send(new CreateBucketCommand({ Bucket: bucketName.trim() }))
})

/**
 * This will create a text test file (For localstack testing)
 */
MAFWhen('test file {string} is created', async function (fileName) {
  fileName = filltemplate(fileName, this.results)
  const filePath = getFilePath(fileName, this)
  fs.writeFileSync(filePath, 'this is a test file')
})
