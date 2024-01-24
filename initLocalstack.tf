provider "aws" {
  region                      = "us-east-1"
  access_key                  = "1234"
  secret_key                  = "xyz"
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

resource "aws_s3_bucket" "testBucket" {
  bucket = "test-bucket"
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

resource "aws_sqs_queue" "testQueue1" {
  name = "testQueue"
}

resource "aws_sqs_queue" "testQueue2" {
  name = "testQueue2"
}
