Feature: AWS: Lambda Testing
  Tests the step functions for AWS Lambda

  Scenario: Basic Lambda Function Invocation with Simple Payload
    Given set "payload" to:
      """
      {
        "name": "John",
        "age": 30
      }
      """
    When a user supplies "payload" to endpoint "test-lambda-function"
    Then item "lastRun.StatusCode" is equal to "200"
