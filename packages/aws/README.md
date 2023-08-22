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
# Dev Testing Steps

- Run `docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack:0.14.4` to spin up a localstack environment.
- Run `terraform apply -auto-approve` to prepare the localstack environment.
- Be sure environment variable `AWSENV` is set to false or does not exist
- Run individual tests, or run all tests using `npm t`

# Configurations

The AWS SDK V3 is used for communication to AWS / Localstack.
You need to provide credentials to AWS so that only your account and its resources are accessed by the SDK. For more information about obtaining your account credentials, see [Loading credentials in Node.js from the shared credentials file from AWS Documentation.](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-shared.html)
This can be point to a remote aws location, or point to a localstack configuration depending on the environment variable `AWSENV`. If `AWSENV` is set to `TRUE`, then the default configuration / credentials provided will be used. If `AWSENV` is set to false or does not exist, then the AWS MAF framework will use the default localstack configuration endpoint `http://localhost:4566`, or `http://${LOCALSTACK_HOSTNAME}:4566` if env variable `LOCALSTACK_HOSTNAME` is defined

To run the example feature files, start the localstack and run the terraform script by running `terraform apply -auto-approve` to run initLocalstack.tf, then run `npm t`. `initLocalstack.tf` is needed for running the feature files in the features directory as this will set up the localstack environment for dev testing.

# Step Definitions

This library implements some step definitions for aws and adheres to the global cucumber implementation for various internals.

Note [_{jsonObject}_](../validations/JSONObject.md) includes the steps `item {string}`, `it`, `{string}`, and `file {string}` to complete the step function

## AWS S3 Step Definitions

### `Given bucket {string} exists on S3`

Fails if a bucket with name {string} can not be found on the s3 server

### `Given bucket {string} is not on S3`

Fails if a bucket with name {string} can be found on the s3 server

### `Then bucket {string} exists`

Fails if a bucket with name {string} can not be found on the s3 server

### `When file list of bucket {string} on path {string} is retrieved`

Gets the list of files in the s3 bucket (s3://[bucket]/[path]). The file content list is stored to `${lastRun}`.
Note: the order of the files returned may not follow a particular order.

Example:

```
When file list of bucket "testbucket" on path "folder1/folder2/" is retrieved
Then it is equal to "[test1.txt,test2.txt]"
```

### `When all files of bucket {string} is retrieved`

Gets a list of all files on the bucket as an array.

### `Then file exists with name {string} at path {string} in bucket {string}`

Checks to see if a file exists at the provided path in the bucket . Fails if it does not exist

### `When {jsonObject} is uploaded to bucket {string} as key {string}`

Uploads a local file to the bucket. The file is placed at the path provided within the bucket.

Example:

`When file "hello.txt" is uploaded to bucket "myBucket" as key "foo/bar/hello"`

The file hello.txt and its contents now exist at s3://myBucket/foo/bar/hello

### `When gz file {string} is uploaded to bucket {string} as key {string}`
### `When gz file {string} is uploaded to bucket {string} as key {string} with sha256 check`
Uploads gz files to the s3 bucket. This is necessary for gz / compressed files as there is an encoding issue when using jsonObject with gzips.
The gzip must be a local file and should not be in memory. the stepDefinition with sha256 will fail if the file uploaded is not matching the original gzip file.

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

### `When file {string} from bucket {string} at path {string} is retrieved`

Gets the contents of the file s3://[bucket]/[path]/[file] and sends it content value to `${lastRun}`

## Lambda Step Definitions (NOT TESTED)

### `When a user supplies {jsonObject} to function {string}`

Invokes a lambda function On AWS. {jsonObject} is the payload and {string} is the function name

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

- tableName - required
- indexName
- keyConditionExpression - required
- filterExpression
- projectionExpression
- expressionAttributeNames
- expressionAttributeValues - Must be a JSON object

For Example:

The following item is on the dynamoDB table:
{"label":"\_Alpha","some_number":86,"some_word":"Apple"}

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

- tableName - required
- item - required, Must be a JSON object

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

- tableName - required
- key - required, Must be a JSON object
- updateExpression
- expressionAttributeNames
- expressionAttributeValues - Must be a JSON object

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

- tableName - required
- item - required, Must be a JSON object

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

- VisibilityTimeout
- DelaySeconds
- ReceiveMessageWaitTimeSeconds
- ApproximateNumberOfMessages
- ApproximateNumberOfMessagesNotVisible
- ApproximateNumberOfMessagesDelayed
- CreatedTimestamp
- LastModifiedTimestamp
- QueueArn

For example, on an SQS queue named "testQueue" that has one message in its queue:

```
When attributes of queue "testQueue" are received
Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"
```

### `Given queue {string} exists on SQS`

Is true if the queue can be found on AWS. The string can be the url, or the queue name.
If a queue name is used, a regex search will be done to find the queue.

### `When attributes of queue {string} are received`

Gets all attributes for a SQS queue to `lastRun`. The string can be the url, or the queue name.
If a queue name is used, a regex search will be done to find the queue.

### `When {jsonObject} is sent to queue {string}`

Sends a new message to the SQS queue provided. `lastRun` will contain the message id and message

### `When the next message is received from queue {string}`

Receives / Dequeues the message in the SQS queue and stores the value in `lastRun`

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

### `When queue {string} is purged`

Removes all messages from the sqs queue. The string can be the url, or the queue name.
If a queue name is used, a regex search will be done to find the queue.

## AWS ECS Step Definitions

### `When at least one task is running for service {string} in cluster {string}`

### `When ecs taskDefinition {string} exists`
### `When ecs taskDefinition {string} does not exist`

Checks if the task definition exists on ecs

### `When ecs cluster {string} exists`
### `When ecs cluster {string} does not exist`

Checks if the cluster exists on ecs

### `When ecs run-task from {jsonObject} is performed`

### `When perform ecs run-task:`

### `When ecs run-task is performed`

Runs a task on ecs

This stepFunction looks at the following items to see if they exist, and pre-applies them to the ecs command:

- taskDefinition - required
- cluster - required, must be a JSON object
- networkConfiguration - optional, must be a JSON object.
  - subnets - required if using networkConfiguration
  - securityGroups - required if using networkConfiguration
  - assignPublicIp - optional. 'DISABLED' by default
- enableECSManagedTags - optional. set as true or false. 
- launchType - optional. 'FARGATE' by default

Example:

```
When perform ecs run-task:
"""
{
    "taskDefinition": "batch-rrfe-selective:4",
    "cluster": "telematics-us-qa-batch-ecs-cluster",
    "networkConfiguration": {
        "subnets": ["subnet-0c00d7b410e44e056","subnet-014af5a4f682f0d3f","subnet-0e3f8254dd77bc0cd","subnet-0c8bf0db90a9d8c45"],
        "securityGroups": ["sg-0d07fc820ce3cf266"]
    },
    "enableECSManagedTags": true
}
"""
```

## AWS Cloudwatch Logs Step Definitions

### `When cloudwatch logs from log group {string} from {int} minutes ago to now are retrieved
Gets the cloudwatch logs from a specific log group and time frame

[npm-image]:https://img.shields.io/npm/v/@ln-maf/aws.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/aws
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Faws
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Faws
