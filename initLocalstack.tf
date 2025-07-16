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
