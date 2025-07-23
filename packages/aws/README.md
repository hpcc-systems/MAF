
# AWS Cucumber Steps

This module provides Cucumber step definitions for AWS services, making it easy to write Gherkin scenarios that interact with AWS resources.

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https:**Note:** This is a duplicate of the above step and will be deprecated. Use `{jsonObject} is sent to queue {string}` instead.

Sends a JSON object message to the SQS queue using the full queue URL. `${lastRun}` will contain the message ID and message.

- `When {string} message is sent to queue {string}`thub.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

---

## Quick Start

1. Install the AWS module:

   ```bash
   npm i @ln-maf/aws
   ```

2. In your project's `features` folder, create a step file and add:

   ```js
   require('@ln-maf/aws')
   ```

---

## AWS Credentials & Configuration

This module uses AWS SDK V3. You must provide AWS credentials so only your account and resources are accessed. See [AWS docs](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-shared.html) for details. You can use real AWS or localstack.

To run example features:

1. Start localstack
2. Run the terraform script: `terraform apply -auto-approve` (sets up localstack)
3. Run tests: `npm t`

---

## Step Definitions Overview

This module provides step definitions for AWS services. You can use them in your Gherkin feature files to interact with S3, Lambda, DynamoDB, SQS, ECS, and CloudWatch.

For advanced usage, see [_{jsonObject}_](../validations/JSONObject.md) for details on using items, files, and template variables in steps.

### Example Usage

Here's a simple example of using multiple AWS services together:

```Feature
Feature: AWS Integration Example
  Scenario: Process data through AWS services
    # Upload a file to S3
    When file "data.json" is uploaded to bucket "my-bucket" as key "input/data.json"
    
    # Send a message to SQS to trigger processing
    When "process-file" message is sent to queue "processing-queue"
    
    # Check that processing completed by verifying DynamoDB record
    When set "tableName" to "ProcessingResults"
    When set "keyConditionExpression" to "filename = :name"
    When set "expressionAttributeValues" to:
    """
    {
      ":name": {
        "S": "data.json"
      }
    }
    """
    When dynamodb query is performed
    Then item "lastRun" has a length of 1
```

---

### S3 Step Definitions

**Bucket Operations:**

- `When bucket {string} exists on S3`

Verifies that a bucket with the given name exists on S3. Fails if the bucket cannot be found.

- `When bucket {string} is not on S3`

Verifies that a bucket with the given name does NOT exist on S3. Fails if the bucket is found.

- `When bucket {string} exists`

Alias for `bucket {string} exists on S3`. Verifies that a bucket exists.

**File Listing and Checking:**

- `When file list of bucket {string} on path {string} is retrieved`

Gets the list of files in the S3 bucket at the specified path (s3://[bucket]/[path]). The file list is stored in `${lastRun}`.
Note: The order of files returned may not follow a specific order.

Example:

```Feature
When file list of bucket "testbucket" on path "folder1/folder2/" is retrieved
Then it is equal to "[test1.txt,test2.txt]"
```

- `When all files of bucket {string} is retrieved`

Gets a list of all files in the bucket as an array. The file list is stored in `${lastRun}`.

- `When file exists with name {string} at path {string} in bucket {string}`

Checks if a file exists at the specified path in the bucket. Fails if the file does not exist.

**File Upload and Download:**

- `When file {string} is uploaded to bucket {string} as key {string}`

Uploads a local file to the specified bucket. The file is placed at the path provided within the bucket. The local file path is relative to the project root.

Example:

```Feature
When file "hello.txt" is uploaded to bucket "myBucket" as key "foo/bar/hello"
```

The file hello.txt and its contents now exist at s3://myBucket/foo/bar/hello

- `When file {string} from bucket {string} at path {string} is retrieved`

Gets the contents of the file from S3 at s3://[bucket]/[path]/[file] and stores it in `${lastRun}`. The file contents are returned as a string.

- `When S3 file {string} from bucket {string} at path {string} is written to file {string}`

Downloads a file from S3 and writes it to a local file path.

**File Deletion:**

- `When file {string} is deleted from bucket {string} at path {string}`

Deletes a file from an S3 bucket. This step will still pass if the file did not already exist in the bucket.

Example:

```Feature
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

### Lambda Step Definitions

- `When a user supplies {jsonObject} to endpoint {string}`

Invokes a Lambda function on AWS. The {jsonObject} is the payload and {string} is the function name. The response payload is stored in `${lastRun}`. The response object includes the status code, execution logs, and the function's return value.

### DynamoDB Step Definitions

**Table Validation:**

- `When table {string} exists on dynamo`

Checks that the table exists in DynamoDB. Fails if it does not exist.

**Data Conversion Utilities:**

- `When {jsonObject} is cleaned`

Cleans a JSON object that came from a DynamoDB query. It extracts "S", "N", "B" and other DynamoDB type keys to their parent key. The cleaned JSON is stored in `${lastRun}`.

- `When {jsonObject} is converted to dynamo`

Converts a JSON object into a DynamoDB JSON item format, ready for DynamoDB operations. The conversion is stored in `${lastRun}`.
Note: This will not work with JSON values that have arrays, and base64 strings will be stored as binary in AWS.

**Query Operations:**

- `When perform dynamodb query: {docString}`
- `When dynamodb query from {jsonObject} is performed`
- `When dynamodb query is performed`

Receives an array of JSON items from DynamoDB using defined variables, and stores the query results in `${lastRun}`. Similar to [Query](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/query.html) in AWS CLI.

Required variables:

- `tableName` (required)
- `keyConditionExpression` (required)

Optional variables:

- `indexName`
- `filterExpression`
- `projectionExpression`
- `expressionAttributeNames`
- `expressionAttributeValues` (must be a JSON object)

**Put Item Operations:**

- `When perform dynamodb put-item: {docString}`
- `When dynamodb put-item from {jsonObject} is performed`
- `When dynamodb put-item is performed`

Places an item in the DynamoDB table. Similar to [Put-Item](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/put-item.html) in AWS CLI.

Required variables:

- `tableName` (required)
- `item` (required, must be a JSON object in DynamoDB format)**Update Item Operations:**

- `When perform dynamodb update-item: {docString}`
- `When dynamodb update-item from {jsonObject} is performed`
- `When dynamodb update-item is performed`

Updates an item in a DynamoDB table. Sets `${lastRun}` to the updated item with only new attributes. Similar to [Update-Item](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/update-item.html) in AWS CLI.

Required variables:

- `tableName` (required)
- `key` (required, must be a JSON object)

Optional variables:

- `updateExpression`
- `expressionAttributeNames`
- `expressionAttributeValues` (must be a JSON object)

**Delete Item Operations:**

- `When perform dynamodb delete-item: {docString}`
- `When dynamodb delete-item from {jsonObject} is performed`
- `When dynamodb delete-item is performed`

Deletes an item from a DynamoDB table. Fails if the item cannot be removed or is not found. Similar to [Delete-Item](https://docs.aws.amazon.com/cli/latest/reference/dynamodb/delete-item.html) in AWS CLI.

Required variables:

- `tableName` (required)
- `key` (required, must be a JSON object)

### SQS Step Definitions

**Queue Validation:**

- `When queue {string} exists on SQS`

Verifies that the queue can be found on AWS. The string can be the URL or the queue name.
If a queue name is used, a regex search will be done to find the queue.

**Queue State Checks:**

- `When queue {string} is empty within {int} second(s)`

Checks if the queue is empty within the specified time. The string can be the URL or the queue name.

- `When queue {string} has {int} message(s) within {int} second(s)`

Checks if the queue has the specified number of messages within the specified time. The string can be the URL or the queue name.

**Queue Management:**

- `When attributes of queue {string} are received`

Gets all attributes for an SQS queue and stores them in `${lastRun}`. The string can be the URL or the queue name.

Attributes included: VisibilityTimeout, DelaySeconds, ReceiveMessageWaitTimeSeconds, ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible, ApproximateNumberOfMessagesDelayed, CreatedTimestamp, LastModifiedTimestamp, QueueArn.

- `When queue {string} is purged`

Removes all messages from the SQS queue. The string can be the URL or the queue name.

**Message Operations:**

- `When {jsonObject} is sent to queue {string}`
- `When {string} message is sent to queue {string}`

Sends a message to the SQS queue. If the queue name does not begin with https://, it will search for the first queue that matches the provided name. `${lastRun}` will contain the message ID and message.

- `When the next message is received from queue {string}`

Receives/dequeues the next message in the SQS queue and stores the value in `${lastRun}`.

- `When {int} messages are received from queue {string}`

Receives the next {int} messages in the SQS queue and stores the values in an array in `${lastRun}`.

Example:

```Feature
When "Alpha" message is sent to queue "testQueue2"
When "Beta" message is sent to queue "testQueue2"
When "Charlie" message is sent to queue "testQueue2"
When 3 messages are received from queue "testQueue2"
Then it is equal to:
"""
[
  "Alpha",
  "Beta", 
  "Charlie"
]
"""
```

### ECS Step Definitions

**Task Definition Management:**

- `When ecs taskDefinition {string} exists`
- `When ecs taskDefinition {string} does not exist`

Checks if the task definition exists on ECS.

**Cluster Management:**

- `When ecs clusters from AWS are retrieved`

Retrieves all ECS clusters and stores them in `${lastRun}`.

- `When ecs cluster {string} exists`
- `When ecs cluster {string} does not exist`

Checks if the cluster exists on ECS.

- `When get ARN of ecs cluster {string}`

Gets the ARN of the specified ECS cluster and stores it in `${lastRun}`.

- `When information from ecs cluster {string} is retrieved`

Retrieves detailed information about the ECS cluster and stores it in `${lastRun}`.

**Service Operations:**

- `When at least one task is running for service {string} in cluster {string}`

Checks if the service in an AWS cluster has at least one task running on ECS. Returns the number of running tasks to `${lastRun}`.

- `When image name for service {string} in cluster {string} is retrieved`

Retrieves the task definition image name/version of the running service in the cluster and sets it to `${lastRun}`. Fails if the service is not running or if there are no tasks running.

**Task Execution:**

- `When ecs run-task from {jsonObject} is performed`
- `When perform ecs run-task: {docString}`
- `When ecs run-task is performed`

Runs a task on ECS.

Required variables:

- `taskDefinition` (required)
- `cluster` (required)

Optional variables:

- `networkConfiguration` (must be a JSON object)
  - `subnets` (required if using networkConfiguration)
  - `securityGroups` (required if using networkConfiguration)
  - `assignPublicIp` (optional, 'DISABLED' by default)
- `enableECSManagedTags` (optional, set as true or false)
- `launchType` (optional, 'FARGATE' by default)

### CloudWatch and SSM Step Definitions

**CloudWatch Logs:**

- `When cloudwatch logs from log group {string} from {int} minutes ago to now are retrieved`

Gets the CloudWatch logs from a specific log group and time frame, storing them in `${lastRun}`.

**SSM Parameter Store:**

- `When parameter {string} value is retrieved from the parameter store`

Retrieves a parameter value from AWS Systems Manager Parameter Store. Automatically attempts to parse JSON strings. The value is stored in `${lastRun}`.

---

## Local AWS Testing (Localstack)

You can test AWS features locally using [localstack](https://github.com/localstack/localstack). This simulates AWS services on your machine.

Start localstack with Docker:

```bash
docker run -d --name localstack -p 4566:4566 -v /var/run/docker.sock:/var/run/docker.sock localstack/localstack:4.6.0
```

**What the command does:**

- `-d`: Detached mode (runs in background)
- `--name localstack`: Names the container "localstack"
- `-p 4566:4566`: Maps port 4566 from container to host
- `-v /var/run/docker.sock:/var/run/docker.sock`: Mounts Docker socket for Lambda support
- `localstack/localstack:4.6.0`: Uses localstack version 4.6.0

To initialize AWS services in localstack, run:

```bash
terraform destroy -auto-approve && terraform apply -auto-approve
```

Set the environment variable `AWSENV=LOCALSTACK` to use localstack instead of real AWS.

[npm-image]:https://img.shields.io/npm/v/@ln-maf/aws.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/aws
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Faws
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Faws
