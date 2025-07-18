provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    dynamodb = "http://localhost:4566"
    s3       = "http://localhost:4566"
    sqs      = "http://localhost:4566"
    lambda   = "http://localhost:4566"
  }
}

resource "aws_s3_bucket" "testBucket1" {
  bucket        = "test-bucket1"
  force_destroy = true
}

resource "aws_s3_bucket" "testBucket2" {
  bucket        = "test-bucket2"
  force_destroy = true
}

resource "aws_s3_bucket" "testBucket3" {
  bucket        = "test-bucket3"
  force_destroy = true
}

resource "aws_s3_bucket" "testBucket4" {
  bucket        = "test-bucket4"
  force_destroy = true
}

resource "aws_dynamodb_table" "test-table" {
  name           = "testtable"
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "label"
  attribute {
    name = "label"
    type = "S"
  }
}

resource "aws_sqs_queue" "testQueueAlpha" {
  name = "testQueueAlpha"
}

resource "aws_sqs_queue" "testQueueBeta" {
  name = "testQueueBeta"
}

# Lambda functions for testing - using a dummy role ARN for LocalStack
resource "aws_lambda_function" "test_lambda_function" {
  filename         = "packages/aws/lambda-functions/lambda-function.zip"
  function_name    = "test-lambda-function"
  role            = "arn:aws:iam::000000000000:role/lambda-role"
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  source_code_hash = filebase64sha256("packages/aws/lambda-functions/lambda-function.zip")
}
