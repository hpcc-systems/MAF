const { Given, When, Then } = require('@cucumber/cucumber')
var fs = require('fs')
var assert = require('chai').assert
var runAWS = require('../awsL')
const { getFilePath, performJSONObjectTransform, MAFWhen, filltemplate } = require('@ln-maf/core')
const fillTemplate = filltemplate

/**
 * Returns the value of the variable if it exists in this.results.
 * @param {string} variable the variable to check
 * @returns {Object} the value of the variable if it exists in this.results. Returns the variable
 * itself if variable does not contain "${}"
 */
function getVal(variable, scenario) {
  if (!scenario.results) {
    scenario.results = {}
  }
  return fillTemplate(variable, scenario.results)
}

/**
 * Creates an S3 URL for aws-cli
 * @param {string} bucket the name of the bucket
 * @param {string} path The directory path of the S3 bucket 
 */
function s3URL(bucket, path) {
  return "s3://" + bucket + "/" + buildPath(path);
}

/**
 * Cleans the directory path for a bucket on S3
 * @param {string} path A directory path
 */
function buildPath(path) {
  if (!path) {
    return "";
  }
  return path + (path.charAt(path.length - 1) === "/" ? "" : "/")
}

/**
 * Returns true if the bucket exists on S3
 * @param {string} bucketName The name of the bucket
 * @returns {boolean} true if the bucket exists on S3
 */
function bucketExists(bucketName) {
  var res = runAWS("s3 ls")
  return res.stdout.split("\n").some(function (bucket) {
    var listedBucket = bucket.split(" ")[2];
    return listedBucket !== undefined && listedBucket.trim() === bucketName.toLowerCase().trim();
  });
}

Given('bucket {string} exists on S3', function (bucketName) {
  bucketName = getVal(bucketName, this)
  if (!bucketExists(bucketName)) {
    throw new Error("Bucket " + bucketName + " does not exist on S3")
  }
});

Given('bucket {string} is not on S3', function (bucketName) {
  bucketName = getVal(bucketName, this)
  if (bucketExists(bucketName)) {
    throw new Error("Bucket " + bucketName + " does exist on S3")
  }
});

Then('bucket {string} exists', function (bucketName) {
  bucketName = getVal(bucketName, this)
  assert(bucketExists(bucketName), "The bucket does not exist on S3")
});

function listS3Files(bucketName, path, json = false) {
  var fileList = path || path === '' ? runAWS(`s3 ls ${s3URL(bucketName, path)}`) : runAWS(`s3 ls ${bucketName} --recursive`)
  fileList = fileList.stdout.split('\n').filter(x => x.length > 0);
  if (fileList.length === 0) {
    return []
  }
  var fileRegex = /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(\d+)\s(.*)/
  if (json){
    return fileList.map(i => {
      var data = i.match(fileRegex)
      return {"name": data[3], "size": JSON.parse(data[2]), "date":data[1]}
    });
  } else {
    fileList  = fileList.filter(x => fileRegex.test(x))
    return fileList.map(i => i.match(new RegExp(fileRegex))[3])
  }
}

MAFWhen('file list of bucket {string} on path {string} is retrieved', function (bucketName, path) {
  bucketName = getVal(bucketName, this)
  path = getVal(path, this)
  return listS3Files.call(this, bucketName, path, false);
});

MAFWhen('file list of bucket {string} on path {string} is retrieved as json item', function (bucketName, path) {
  bucketName = getVal(bucketName, this)
  path = getVal(path, this)
  return listS3Files.call(this, bucketName, path, true);
});

MAFWhen('all files of bucket {string} is retrieved', function (bucketName) {
  bucketName = getVal(bucketName, this);
  return listS3Files.call(this, bucketName, null, false)
});

MAFWhen('all files of bucket {string} is retrieved as json item', function (bucketName) {
  bucketName = getVal(bucketName, this);
  return listS3Files.call(this, bucketName, null, true)
});

Then('file exists with name {string} at path {string} in bucket {string}', function (fileName, path, bucketName) {
  fileName = getVal(fileName, this)
  bucketName = getVal(bucketName, this)
  path = getVal(path, this)
  var res = runAWS(`s3 ls ${s3URL(bucketName, path)}${fileName}`)
  // Split res.stdout by lines, then get the last string on the line which should be the filename
  var exists = res.stdout.split("\n").some(line => line.split(" ").pop().trim() === fileName.trim())
  assert(exists, "The file does not exist in " + s3URL(bucketName, path))
});

When('file {string} is uploaded to bucket {string} at path {string}', function (file, bucket, path) {
  file = getVal(file, this);
  bucket = getVal(bucket, this);
  path = getVal(path, this)
  const filePath = getFilePath(file, this);
  if (!this.results) {
    this.results = {};
  }
  var res = runAWS(`s3 cp ${filePath} ${s3URL(bucket, path)}`)
  this.results.lastRun = res
});

When('file {string} is deleted from bucket {string} at path {string}', function (fileName, bucketName, path) {
  fileName = getVal(fileName, this);
  bucketName = getVal(bucketName, this);
  path = getVal(path, this)
  var res = runAWS(`s3 rm ${s3URL(bucketName, path)}${fileName}`)
  if (!this.results) {
    this.results = {};
  }
  this.results.lastRun = res
});

When('file {string} from bucket {string} at path {string} is retrieved', async function (fileName, bucketName, path) {
  fileName = getVal(fileName, this)
  bucketName = getVal(bucketName, this)
  path = getVal(path, this)
  var filePath = getFilePath(fileName, this)
  runAWS(['s3', 'cp', s3URL(bucketName, path) + fileName, filePath])
  var fileContents = fs.readFileSync(filePath, 'utf8');
  if (!this.results) {
    this.results = {};
  }
  this.results.lastRun = fileContents
  this.attach(JSON.stringify({ "lastRun": this.results.lastRun }, null, 2));
});

/**
 * Creates a new bucket on S3
 * @param {string} bucketName the name of the new bucket
 * @returns {Object} An object containing details of creating the new bucket
 */
function createBucket(bucketName) {
  var res = runAWS(`s3 mb s3://${bucketName}`)
  if (res.stdout.includes("BucketAlreadyExists")) {
    console.log("A bucket named " + bucketName + " already exists on S3")
  }
  return res;
}

/**
 * This step definition should only be used for testing
 * This will create a new bucket on S3
 */
Given('bucket {string} is created on S3', function (bucketName) {
  bucketName = getVal(bucketName, this)
  var res = createBucket(bucketName);
})

/**
 * This will create a test file for testing purposes.
 */
When('test file {string} is created', async function (fileName) {
  fileName = getVal(fileName, this)
  const filePath = getFilePath(fileName, this);
  fs.writeFileSync(filePath, 'this is a test file', function (err) {
    if (err) throw err;
    console.log('Created file ' + filePath);
  })
});