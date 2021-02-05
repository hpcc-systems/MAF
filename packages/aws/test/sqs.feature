Feature: SQS
    Tests the step functions for sqs
    Scenario: Queue Properties
        Given queue "testQueue" exists on SQS
        When attributes of queue "testQueue" are received
        Then item "lastRun.ApproximateNumberOfMessages" is equal to "0"

    Scenario: Queue Test
        Given queue "testQueue" exists on SQS
        When set "file" to "hello.txt"
        And set "tQ" to "testQueue"
        When "Hello there!" is written to file "${file}"
        When file "${file}" is sent to queue "${tQ}"
        And the next message is received from queue "testQueue"
        Then item "lastRun" is equal to "Hello there!"

    Scenario: Queue Test - Multiple Messages
        Given queue "testQueue" exists on SQS
        When message "Alpha" is sent to queue "testQueue2"
        And message "Beta" is sent to queue "testQueue2"
        And message "Charlie" is sent to queue "testQueue2"
        And 3 messages are received from queue "testQueue2"
        Then item "lastRun" is equal to:
            """
            [
                "Alpha",
                "Beta",
                "Charlie"
            ]
            """
