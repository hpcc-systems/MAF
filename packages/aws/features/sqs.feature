Feature: AWS: SQS Testing
    Tests the step functions for sqs
    Scenario: Queue Properties for testQueueAlpha
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        And wait 500 milliseconds
        When attributes of queue "testQueueAlpha" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Properties for testQueueBeta
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And wait 500 milliseconds
        When attributes of queue "testQueueBeta" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Test
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        And "Hello there!" is written to file "./test/hello.txt"
        When file "./test/hello.txt" is sent to queue "testQueueAlpha"
        Then wait 500 milliseconds
        And the next message is received from queue "testQueueAlpha"
        And item "lastRun" is equal to "Hello there!"

    Scenario: Queue Test - Multiple Messages
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        When "Alpha" is sent to queue "testQueueBeta"
        And "Beta" is sent to queue "testQueueBeta"
        And "Charlie" is sent to queue "testQueueBeta"
        Then wait 500 milliseconds
        And 3 messages are received from queue "testQueueBeta"
        And item "lastRun" is equal to:
            """
            [
                "Alpha",
                "Beta",
                "Charlie"
            ]
            """
            
    Scenario: Test Purge Queue
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And "123" is sent to queue "testQueueBeta"
        And "456" is sent to queue "testQueueBeta"
        And "789" is sent to queue "testQueueBeta"
        And wait 500 milliseconds
        And attributes of queue "testQueueBeta" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "3"
        When queue "testQueueBeta" is purged
        Then wait 500 milliseconds
        And attributes of queue "testQueueBeta" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Test Purge Queue - Wait for Message Count
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And "qwe" is sent to queue "testQueueBeta"
        And "asd" is sent to queue "testQueueBeta"
        And "zxc" is sent to queue "testQueueBeta"
        Then queue "testQueueBeta" has 3 messages within 15 seconds
        When queue "testQueueBeta" is purged
        Then queue "testQueueBeta" has 0 messages within 15 seconds

    Scenario: Test Direct Queue URL Operations
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        And set "queueUrl" to "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/testQueueAlpha"
        When "Direct URL test message" is sent to queue "${queueUrl}"
        Then wait 500 milliseconds
        When the next message is received from queue "${queueUrl}"
        Then it is equal to "Direct URL test message"

    Scenario: Test Deprecated Queue URL Step Definitions
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And set "betaQueueUrl" to "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/testQueueBeta"
        When "Deprecated URL test" is sent to queue url "${betaQueueUrl}"
        And '{"message": "JSON test", "id": 123}' is sent to queue url "${betaQueueUrl}"
        Then wait 500 milliseconds
        When 2 messages are received from queue "testQueueBeta"
        Then "${lastRun[0]}" is equal to "Deprecated URL test"
        And set "message2" to "${lastRun[1].replace(/\\\"/g, '"')}"
        And item "message2" is equal to '{"message": "JSON test", "id": 123}'

    Scenario: Test String Message Step Definition
        Given queue "testQueueAlpha" exists on SQS
        When "String message test" message is sent to queue "testQueueAlpha"
        Then wait 500 milliseconds
        When the next message is received from queue "testQueueAlpha"
        Then it is equal to "String message test"

    Scenario: Test String Message to Queue URL (Deprecated)
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And set "queueUrl" to "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/testQueueBeta"
        When "Deprecated string message" message is sent to queue url "${queueUrl}"
        Then wait 500 milliseconds
        When the next message is received from queue "testQueueBeta"
        Then it is equal to "Deprecated string message"

    Scenario: Test Queue Empty Check
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        Then queue "testQueueAlpha" is empty within 10 seconds

    Scenario: Test JSON Object Message Sending
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        When '{"type": "notification", "data": {"user": "john", "action": "login"}}' is sent to queue "testQueueBeta"
        Then wait 500 milliseconds
        When the next message is received from queue "testQueueBeta"
        Then set "lastMessage" to "${lastRun.replace(/\\\"/g, '"')}"
        And item "lastMessage" is equal to '{"type": "notification", "data": {"user": "john", "action": "login"}}'

    Scenario: Test Message Count Verification
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        And "Message 1" is sent to queue "testQueueAlpha"
        And "Message 2" is sent to queue "testQueueAlpha"
        Then queue "testQueueAlpha" has 2 messages within 15 seconds

    Scenario: Test Multiple Message Operations with Template Variables
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And set "queueName" to "testQueueBeta"
        And set "msg1" to "Template message 1"
        And set "msg2" to "Template message 2"
        When "${msg1}" is sent to queue "${queueName}"
        And "${msg2}" is sent to queue "${queueName}"
        Then wait 500 milliseconds
        When 2 messages are received from queue "${queueName}"
        Then item "lastRun" contains "Template message 1"
        And item "lastRun" contains "Template message 2"

    Scenario: Test Queue Operations with File Content
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        And "This is a file content message for SQS testing" is written to file "./test/sqs-test.txt"
        When file "./test/sqs-test.txt" is sent to queue "testQueueAlpha"
        Then wait 500 milliseconds
        When the next message is received from queue "testQueueAlpha"
        Then it is equal to "This is a file content message for SQS testing"

    Scenario: Test Large Message Operations
        Given queue "testQueueBeta" exists on SQS
        When queue "testQueueBeta" is purged
        And "Batch message 1" is sent to queue "testQueueBeta"
        And "Batch message 2" is sent to queue "testQueueBeta"
        And "Batch message 3" is sent to queue "testQueueBeta"
        And "Batch message 4" is sent to queue "testQueueBeta"
        And "Batch message 5" is sent to queue "testQueueBeta"
        Then queue "testQueueBeta" has 5 messages within 15 seconds
        When 5 messages are received from queue "testQueueBeta"
        Then item "lastRun" contains "Batch message 1"
        And item "lastRun" contains "Batch message 5"

    Scenario: Test Queue Attributes with Different States
        Given queue "testQueueAlpha" exists on SQS
        When queue "testQueueAlpha" is purged
        And attributes of queue "testQueueAlpha" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"
        When "Test message for attributes" is sent to queue "testQueueAlpha"
        And wait 500 milliseconds
        And attributes of queue "testQueueAlpha" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "1"
