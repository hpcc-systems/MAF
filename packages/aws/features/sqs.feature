Feature: AWS: SQS Testing
    Tests the step functions for sqs
    Scenario: Queue Properties for testQueueAlpha
        Given queue "testQueueAlpha" exists on SQS
        When attributes of queue "testQueueAlpha" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Properties for testQueueBeta
        Given queue "testQueueBeta" exists on SQS
        When attributes of queue "testQueueBeta" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Test
        Given queue "testQueueAlpha" exists on SQS
        And "Hello there!" is written to file "./test/hello.txt"
        When file "./test/hello.txt" is sent to queue "testQueueAlpha"
        Then wait 5000 milliseconds
        And the next message is received from queue "testQueueAlpha"
        And item "lastRun" is equal to "Hello there!"

    Scenario: Queue Test - Multiple Messages
        Given queue "testQueueBeta" exists on SQS
        When "Alpha" is sent to queue "testQueueBeta"
        And "Beta" is sent to queue "testQueueBeta"
        And "Charlie" is sent to queue "testQueueBeta"
        Then wait 5000 milliseconds
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
        And "123" is sent to queue "testQueueBeta"
        And "456" is sent to queue "testQueueBeta"
        And "789" is sent to queue "testQueueBeta"
        And wait 1000 milliseconds
        And attributes of queue "testQueueBeta" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "3"
        When queue "testQueueBeta" is purged
        Then wait 1000 milliseconds
        And attributes of queue "testQueueBeta" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Test Purge Queue - Wait for Empty Queue
        Given queue "testQueueBeta" exists on SQS
        And "qwe" is sent to queue "testQueueBeta"
        And "asd" is sent to queue "testQueueBeta"
        And "zxc" is sent to queue "testQueueBeta"
        And wait 1000 milliseconds
        And attributes of queue "testQueueBeta" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "3"
        When queue "testQueueBeta" is purged
        Then queue "testQueueBeta" is empty within 10000 seconds
