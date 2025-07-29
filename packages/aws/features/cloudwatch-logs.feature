Feature: AWS: CloudWatch Logs and SSM Parameter Store

    Scenario: Retrieve parameter value from parameter store
        When parameter "/test/param1" value is retrieved from the parameter store
        Then item "lastRun" is equal to "test-value-1"

    Scenario: Retrieve parameter with template substitution
        Given set "paramName" to "/test/param2"
        When parameter "${paramName}" value is retrieved from the parameter store
        Then it is equal to "test-value-2"

    Scenario: Retrieve parameter type string
        When parameter "/test/string-param" value is retrieved from the parameter store
        Then it is equal to 'simple-string-value'

    Scenario Outline: Retrieve parameter type json
        When parameter "/test/json-param" value is retrieved from the parameter store
        Then set "jsonValue" to it
        And item "jsonValue" is equal to:
            """
            {
                "key": "value",
                "num": 123
            }
            """
        And item "jsonValue.key" is equal to "value"
        And item "jsonValue.num" is equal to 123

    Scenario Outline: Retrieve parameter type multiline
        When parameter "/test/multiline-param" value is retrieved from the parameter store
        Then it is equal to "line1\nline2\nline3"

    Scenario Outline: Retrieve logs from different time ranges
        When cloudwatch logs from log group "test-log-group" from <minutes> minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"

        Examples:
            | minutes |
            | 1       |
            | 5       |
            | 10      |
            | 30      |
            | 60      |

    Scenario: Test parameter store with hierarchical parameters
        When parameter "/app/database/host" value is retrieved from the parameter store
        Then it is equal to "localhost"
        When parameter "/app/database/port" value is retrieved from the parameter store
        Then it is equal to "5432"
        When parameter "/app/database/name" value is retrieved from the parameter store
        Then it is equal to "testdb"

    Scenario: Test parameter retrieval with results template substitution
        When parameter "/test/result-param" value is retrieved from the parameter store
        And set "retrievedValue" to it
        When parameter "/test/param1" value is retrieved from the parameter store
        Then it is equal to "test-value-1"
        And "${retrievedValue}" is equal to "dynamic-value"

    Scenario: Test CloudWatch logs query with different log groups
        When cloudwatch logs from log group "application-logs" from 30 minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"
        When cloudwatch logs from log group "system-logs" from 30 minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"
        When cloudwatch logs from log group "error-logs" from 30 minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"

    Scenario: Test parameter store with different parameter paths
        When parameter "/prod/database/connection-string" value is retrieved from the parameter store
        Then it contains "localhost"
        When parameter "/dev/api/endpoint" value is retrieved from the parameter store
        Then it contains "http://localhost"
        When parameter "/test/feature-flags/new-ui" value is retrieved from the parameter store
        Then it is equal to "true"

    Scenario: Test CloudWatch logs retrieval with template variables
        Given set "environment" to "test"
        And set "service" to "api"
        When cloudwatch logs from log group "${environment}-${service}-logs" from 10 minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"

    Scenario: Test parameter store retrieval with template variables
        Given set "environment" to "staging"
        And set "component" to "database"
        When parameter "/${environment}/${component}/password" value is retrieved from the parameter store
        Then it contains "password"

    Scenario: Test multiple parameter retrievals in sequence
        When parameter "/config/app-name" value is retrieved from the parameter store
        And set "appName" to it
        When parameter "/config/version" value is retrieved from the parameter store
        And set "version" to it
        When parameter "/config/environment" value is retrieved from the parameter store
        And set "env" to it
        Then "${appName}" contains "test"
        And "${version}" contains "1.0"
        And "${env}" is equal to "development"

    Scenario: Test CloudWatch logs with various time windows
        When cloudwatch logs from log group "performance-logs" from 2 minutes ago to now are retrieved
        And set "recentLogs" to it
        When cloudwatch logs from log group "performance-logs" from 120 minutes ago to now are retrieved
        And set "allLogs" to it
        Then item "recentLogs" is equal to "[]"
        And item "allLogs" is equal to "[]"

    Scenario: Test CloudWatch logs with edge case time ranges
        When cloudwatch logs from log group "test-log-group" from 0 minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"
        When cloudwatch logs from log group "test-log-group" from 1440 minutes ago to now are retrieved
        Then item "lastRun" is equal to "[]"

    Scenario: Test complex parameter hierarchies
        When parameter "/microservices/user-service/database/host" value is retrieved from the parameter store
        Then it contains "localhost"
        When parameter "/microservices/user-service/database/port" value is retrieved from the parameter store
        Then it is equal to "5432"
        When parameter "/microservices/order-service/queue/url" value is retrieved from the parameter store
        Then it contains "sqs"
        When parameter "/microservices/payment-service/api/key" value is retrieved from the parameter store
        Then it contains "key"
