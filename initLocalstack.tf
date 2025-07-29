provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    dynamodb       = "http://localhost:4566"
    s3             = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    logs           = "http://localhost:4566"
    ssm            = "http://localhost:4566"
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

# CloudWatch Log Groups for testing
resource "aws_cloudwatch_log_group" "test_log_group" {
  name              = "test-log-group"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "application_logs" {
  name              = "application-logs"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "system_logs" {
  name              = "system-logs"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "error_logs" {
  name              = "error-logs"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "performance_logs" {
  name              = "performance-logs"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "high_volume_logs" {
  name              = "high-volume-logs"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "batch_processing_logs" {
  name              = "batch-processing-logs"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "test_api_logs" {
  name              = "test-api-logs"
  retention_in_days = 7
}

# CloudWatch Log Streams for testing
resource "aws_cloudwatch_log_stream" "test_log_stream" {
  name           = "test-log-stream"
  log_group_name = aws_cloudwatch_log_group.test_log_group.name
}

resource "aws_cloudwatch_log_stream" "application_stream" {
  name           = "application-stream"
  log_group_name = aws_cloudwatch_log_group.application_logs.name
}

resource "aws_cloudwatch_log_stream" "system_stream" {
  name           = "system-stream"
  log_group_name = aws_cloudwatch_log_group.system_logs.name
}

# SSM Parameters for testing
resource "aws_ssm_parameter" "test_param1" {
  name  = "/test/param1"
  type  = "String"
  value = "test-value-1"
}

resource "aws_ssm_parameter" "test_param2" {
  name  = "/test/param2"
  type  = "String"
  value = "test-value-2"
}

resource "aws_ssm_parameter" "string_param" {
  name  = "/test/string-param"
  type  = "String"
  value = "simple-string-value"
}

resource "aws_ssm_parameter" "json_param" {
  name  = "/test/json-param"
  type  = "String"
  value = "{\"key\":\"value\",\"num\":123}"
}

resource "aws_ssm_parameter" "multiline_param" {
  name  = "/test/multiline-param"
  type  = "String"
  value = "line1\\nline2\\nline3"
}

resource "aws_ssm_parameter" "database_host" {
  name  = "/app/database/host"
  type  = "String"
  value = "localhost"
}

resource "aws_ssm_parameter" "database_port" {
  name  = "/app/database/port"
  type  = "String"
  value = "5432"
}

resource "aws_ssm_parameter" "database_name" {
  name  = "/app/database/name"
  type  = "String"
  value = "testdb"
}

resource "aws_ssm_parameter" "result_param" {
  name  = "/test/result-param"
  type  = "String"
  value = "dynamic-value"
}

resource "aws_ssm_parameter" "prod_database_connection" {
  name  = "/prod/database/connection-string"
  type  = "String"
  value = "postgresql://localhost:5432/proddb"
}

resource "aws_ssm_parameter" "dev_api_endpoint" {
  name  = "/dev/api/endpoint"
  type  = "String"
  value = "http://localhost:3000/api"
}

resource "aws_ssm_parameter" "feature_flag" {
  name  = "/test/feature-flags/new-ui"
  type  = "String"
  value = "true"
}

resource "aws_ssm_parameter" "staging_database_password" {
  name  = "/staging/database/password"
  type  = "SecureString"
  value = "staging-password-123"
}

resource "aws_ssm_parameter" "app_name" {
  name  = "/config/app-name"
  type  = "String"
  value = "test-application"
}

resource "aws_ssm_parameter" "app_version" {
  name  = "/config/version"
  type  = "String"
  value = "1.0.0"
}

resource "aws_ssm_parameter" "app_environment" {
  name  = "/config/environment"
  type  = "String"
  value = "development"
}

# Microservices parameters
resource "aws_ssm_parameter" "user_service_db_host" {
  name  = "/microservices/user-service/database/host"
  type  = "String"
  value = "localhost"
}

resource "aws_ssm_parameter" "user_service_db_port" {
  name  = "/microservices/user-service/database/port"
  type  = "String"
  value = "5432"
}

resource "aws_ssm_parameter" "order_service_queue_url" {
  name  = "/microservices/order-service/queue/url"
  type  = "String"
  value = "sqs://localhost:4566/queue/orders"
}

resource "aws_ssm_parameter" "payment_service_api_key" {
  name  = "/microservices/payment-service/api/key"
  type  = "SecureString"
  value = "payment-api-key-123"
}
