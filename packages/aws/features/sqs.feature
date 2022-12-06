Feature: AWS: SQS Testing
    Tests the step functions for sqs
    Scenario: Queue Properties for testQueue
        Given queue "testQueue" exists on SQS
        When attributes of queue "testQueue" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Properties for testQueue2
        Given queue "testQueue2" exists on SQS
        When attributes of queue "testQueue2" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Test
        Given queue "testQueue" exists on SQS
        When "Hello there!" is written to file "./test/hello.txt"
        When file "./test/hello.txt" is sent to queue "testQueue"
        And the next message is received from queue "testQueue"
        Then item "lastRun" is equal to "Hello there!"

    Scenario: Queue Test - Multiple Messages
        Given queue "testQueue2" exists on SQS
        When "Alpha" is sent to queue "testQueue2"
        And "Beta" is sent to queue "testQueue2"
        And "Charlie" is sent to queue "testQueue2"
        And 3 messages are received from queue "testQueue2"
        Then item "lastRun" is equal to:
            """
            [
                "Alpha",
                "Beta",
                "Charlie"
            ]
            """
    Scenario: Test Purge Queue
        Given queue "testQueue2" exists on SQS
        And "123" is sent to queue "testQueue2"
        And "456" is sent to queue "testQueue2"
        And "789" is sent to queue "testQueue2"
        Then wait 1000 milliseconds
        And attributes of queue "testQueue2" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "3"
        When queue "testQueue2" is purged
        Then wait 1000 milliseconds
        And attributes of queue "testQueue2" are received
        And item "lastRun.ApproximateNumberOfMessages" is equal to "0"
