# AWS Cucumber Steps

This module provides scenarios where Gherkins/Cucumber is implemented for AWS.

[![npm package][npm-image]][npm-url] 
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

# Prerequisites
1. [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) - The amazon command line client

- [Windows](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-windows.html)
- [Mac](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-mac.html)
- [Linux](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html)

# Set up

1. Install [AWS-CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)


2. Install by running `npm i @ln-maf/aws`.

3. Add a step file with the following code in the features folder of the project:
```
require('@ln-maf/aws')
```

# Configurations

The awsL.js file will use the awl cli installed on the machine to run the aws queries. This can be point to a remote aws location, or point to a localstack configuration, depending on the environment variable `AWSENV`. If `AWSENV` is set to `TRUE`, then the configuration / credentials provided to aws cli will be used. If `AWSENV` is set to false or does not exist, then the maf framework will use the localstack configuration

To run the example feature files, start the localstack and run `./initLocalstack`, then run all features using `bash runAllFeatures.sh`. This is needed for running the feature files in the features directory.

You may also clear your localstack using `./cleanLocalStack.sh`, which should only delete test tables

# Step Definitions

This library implements some step definitions for aws and adheres to the global cucumber implementation for various internals.

Note [*{jsonObject}*](../validations/JSONObject.md) includes the steps `item {string}`, `it`, `{string}`, and `file {string}` to complete the step function

## AWS S3 Step Definitions

### `Given bucket {string} exists on S3`

Fails if a bucket with name {string} can not be found on the s3 server

### `Given bucket {string} is not on S3`

Fails if a bucket with name {string} can be found on the s3 server

### `Then bucket {string} exists`

Fails if a bucket with name {string} can not be found on the s3 server

### `When file {string} is uploaded to bucket {string} at path {string}`

Uploads a local file to the bucket. The file is place at the path provided within the bucket.

Example:

`When file "hello.txt" is uploaded to bucket "myBucket" at path "foo/bar/"`

The file hello.txt and its contents now exist on s3://myBucket/foo/bar; s3://myBucket/foo/bar/hello.txt is now created 

### `Then file exists with name {string} at path {string} in bucket {string}`

Checks to see if a file exists at the provided path in the bucket . Fails if it does not exist

### `When file {string} from bucket {string} at path {string} is retrieved`

Gets the contents of the file s3://[bucket]/[path]/[file] and sends it content value to `${lastRun}`

### `When file list of bucket {string} on path {string} is retrieved`

Gets the list of files in the s3 bucket (s3://[bucket]/[path]). The file content list is stored to `${lastRun}`.
Note: the order of the files returned may not follow a particular order.

Example:
```
When file list of bucket "testbucket" on path "folder1/folder2/" is retrieved
Then it is equal to "test1.txt,test2.txt"
```

### `When file list of bucket {string} on path {string} is retrieved as json item`

Gets the list of files in the s3 bucket (s3://[bucket]/[path]) as an array of JSON objects. The file content list is stored to `${lastRun}`.
The JSON objects contain the *name*, *date*, and *size* are stored as a json object

Example:
```
When file list of bucket "testBucket3" on path "foobar" is retrieved as json item
Then lastRun is equal to:
"""
[
  {
    "name" : "test3.txt",
    "size" : 19,
    "date" : "2021-02-01 15:38:50"
  }
]
"""
```

### `When all files of bucket {string} is retrieved`

Gets a list of all files on the bucket as an array.

### `When all files of bucket {string} is retrieved as json item`

Gets a list of all files on the bucket as an array of JSONs. Follows the same json format as `When file list of bucket {string} on path {string} is retrieved as json item`

### `When file {string} is deleted from bucket {string} at path {string}`

Deletes a file from an s3 bucket.
This **will** still pass if the file did not already exist in the bucket.

Example:
```
When file list of bucket "testbucket" on path "folder1/folder2/" is retrieved
Then it is equal to:
"""
[
  "test1.txt",
  "test2.txt"
]

"""
When file "test1.txt" is deleted from bucket "testbucket" at path "folder1/folder2/"
When file list of bucket "testbucket" on path "folder1/folder2/" is retrieved
Then it is equal to:
"""
[
  "test2.txt"
]
"""
```

## Lambda Step Definitions (NOT TESTED)

### `When a user supplies {jsonObject} to endpoint {string}`
JSON Object includes the steps "item {string}", "it", {string}, {string}, file {string}" to retrieve a JSON object that is then used for processing on lambda.

## AWS DynamoDB Step Definitions

### `Given table {string} exists on dynamo`

Checks that the table exists in dynamodb. Fails if it does not exist in AWS

**Warning**: You can add your own custom options to dynamo query / put-item / update-item / delete-item stepDefinitions, but they are not supported. You may add them at your own risk
For example:
```
When perform dynamodb query:
"""
{
  "page-size":123
}
"""
```
This will add `--page-size 123` to the following dynamodb querys that take a jsonObject, but not all options are tested

### `When perform dynamodb query: {docString}`
### `When dynamodb query from {jsonObject} is performed`
### `When dynamodb query is performed`

Receives an Array of JSON items from dynamodb using defined variables, and stores the query results to `${lastRun}`. This is similar to [Query](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/query.html) in AWS CLI

This stepFunction looks at the following items to see if they exist, and pre-applies them to the dynamo query
 * tableName - required
 * indexName
 * keyConditionExpression - required
 * filterExpression
 * projectionExpression
 * expressionAttributeNames
 * expressionAttributeValues - Must be a JSON object

For Example:

The following item is on the dynamoDB table:
{"label":"_Alpha","some_number":86,"some_word":"Apple"}
```
When set "keyConditionExpression" to "label = :a"
And set "tableName" to "testTable"
And set "expressionAttributeValues" to:
"""
{
  ":a": {
    "S": "_Alpha"
  }
}
"""
When dynamodb query is performed
Then it is equal to 
"""
[
    {
      "some_word": {
        "S": "Apple"
      },
      "label": {
        "S": "_Alpha"
      },
      "some_number": {
        "N": "86"
      }
    }
]
"""
```

### `When perform dynamodb put-item: {docString}`
### `When dynamodb put-item from {jsonObject} is performed`
### `When dynamodb put-item is performed`
Places an item to the dynamodb table. The {jsonObject} should contain the item key information and attributes in DynamoDB JSON format as used by the aws cli. This is similar to [Put-Item](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/put-item.html) in AWS CLI

This stepFunction looks at the following items to see if they exist, and pre-applies them to the dynamo query
 * tableName - required
 * item - required, Must be a JSON object

Example:
```
When set "item" to:
"""
{
  "label": {
    "S":"_Alpha"
  },
  "some_number": {
    "N":"86"
  },
  "some_word": {
    "S":"Apple"
  }
}
"""
And set "tableName" to "testTable"
When dynamodb put-item is performed
```

### `When perform dynamodb update-item: {docString}`
### `When dynamodb update-item from {jsonObject} is performed`
### `When dynamodb update-item is performed`
Updates an item on a dynamodb table. It will also set `lastRun` as the item updated, only containing its new attributes. The {jsonObject} should contain the item key information in DynamoDB JSON format as used by the aws cli. This is similar to [Update-Item](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/update-item.html) in AWS CLI

This stepFunction looks at the following items to see if they exist, and pre-applies them to the dynamo query
 * tableName - required
 * key - required, Must be a JSON object
 * updateExpression
 * expressionAttributeNames
 * expressionAttributeValues - Must be a JSON object

Example:
```
And set "updateExpression" to "SET some_word = :a"
And set "expressionAttributeValues" to:
"""
{
  ":a": {
    "S": "Orange"
  }
}
"""
And set "itemToUpdate" to:
"""
{
  "label": {
    "S": "_Alpha"
  }
}
"""
And dynamodb updates item "itemToUpdate" on table "testtable"
```

### `When perform dynamodb delete-item: {docString}`
### `When dynamodb delete-item from {jsonObject} is performed`
### `When dynamodb delete-item is performed`
Deletes an item on a dynamodb table. The {jsonObject} should contain the item key information in DynamoDB JSON format as used by the aws cli. Fails if the item can't be removed, or is not found. This is similar to [Delete-Item](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/delete-item.html) in AWS CLI

This stepFunction looks at the following items to see if they exist, and pre-applies them to the dynamo query
 * tableName - required
 * item - required, Must be a JSON object

Example:
```
Given table "testtable" exists on dynamo
When set "myItem" to:
"""
{
  "label":"_Alpha"
}
"""
When "myItem" is converted to dynamo
And set "myKey" to it
And perform dynamodb delete-item:
"""
{
  "tableName":"testtable",
  "key": ${myKey}
}
"""
And it is cleaned
And it is equal to:
"""
{
  "some_word": "Orange",
  "label": "_Alpha",
  "some_number": "86"
}
"""
Examples:
  | item             |
  |{"label":"_Alpha"}|
```

### `When {jsonObject} is cleaned`
This cleans the JSON object that came from a dynamoDB query. It will extract "S", "N", "B" and other dynamodb keys to its parent key. The cleaned JSON will be set to `lastRun`

Example:

```
When set "itemToClean" to:
"""
{
  "label": {
    "S":"_Alpha"
  },
  "some_number": {
    "N":"86"
  },
  "some_word": {
    "S":"Apple"
  }
}
"""
And item "itemToClean" is cleaned
Then it is equal to:
"""
{
  "label": "_Alpha",
  "some_number": "86",
  "some_word":"Apple"
}
"""
```

### `When {jsonObject} is converted to dynamo`
This converts a JSON object into a dynamoDB JSON item, ready for a dynamoDB query / update. The conversion will be stored in `lastRun`
Please note that this will not work with JSON values that have arrays, and base64 strings will be stored as binary in AWS.

Example:
```
When set "data" to
"""
{
  "some_number": "13375",
  "some_word": "Grapes",
  "str_bool": "true",
  "some_bool": true
}
"""
When item "data" is converted to dynamo
Then it is equal to
"""
{
  "some_number": {
    "N": "13375",
  },
  "some_word": {
    "S": "Grapes",
  },  
  "str_bool": {
    "S": "true",
  },
  "some_bool": {
    "BOOL": true
  }
}
"""
```

## AWS SQS Step Definitions

### `Given queue {string} exists on SQS`
Checks that the named queue exists on AWS. Fails if it does not exist

### `When attributes of queue {string} are received`
Gets the attributes of the queue provided and stores the attributes to `lastRun`

The following attributes are received from the queue:
* VisibilityTimeout
* DelaySeconds
* ReceiveMessageWaitTimeSeconds
* ApproximateNumberOfMessages
* ApproximateNumberOfMessagesNotVisible
* ApproximateNumberOfMessagesDelayed
* CreatedTimestamp
* LastModifiedTimestamp
* QueueArn

For example, on an SQS queue named "testQueue" that has one message in its queue:
```
When attributes of queue "testQueue" are received
Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"
```

### `When {jsonObject} is sent to queue {string}`
Sends a new message to the SQS queue provided. `lastRun` will contain the message id and message

### `When the next message is received from queue {string}`
Receives the message in the SQS queue and stores the value in `lastRun`

### `When {int} messages are received from queue {string}`
Receives the next {int} messages in the SQS queue and stores the values in an array in `lastRun`

Example:
```
When message "Alpha" is sent to queue "testQueue2"
And message "Beta" is sent to queue "testQueue2"
And message "Charlie" is sent to queue "testQueue2"
And 3 messages are received from queue "testQueue2"
Then it is equal to:`
"""
[
  "Alpha",
  "Beta",
  "Charlie"
]
"""
```

[npm-image]:https://img.shields.io/npm/v/@ln-maf/aws.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/aws
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Faws
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Faws