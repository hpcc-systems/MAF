provider "aws" {

  profile                     = "default"
  region                      = "us-east-1"
  access_key                  = "1234"
  secret_key                  = "xyz"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_force_path_style         = true

  endpoints {
    dynamodb = "http://localhost:4569"
    s3       = "http://localhost:4572"
    sqs       = "http://localhost:4576"
  }
}

resource "aws_s3_bucket" "test-bucket" {
  bucket = "testScriptbucket"

}

resource "aws_dynamodb_table" "test-table" {
  name           = "testtable"
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  hash_key       = "label"
  range_key      = "other"
  attribute {
    name = "label"
    type = "S"
  }

  attribute {
    name = "other"
    type = "S"
  }
}

