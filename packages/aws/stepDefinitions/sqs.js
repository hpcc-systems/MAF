const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, performJSONObjectTransform, fillTemplate } = require('@ln-maf/core')
const {
    SQSClient,
    ListQueuesCommand,
    GetQueueAttributesCommand,
    SendMessageCommand,
    ReceiveMessageCommand,
    PurgeQueueCommand
} = require('@aws-sdk/client-sqs')

// Set timeout to 15 minutes for long-running operations
setDefaultTimeout(15 * 60 * 1000)

// Configure SQS client with retry logic
const sqsClientConfig = { maxAttempts: 3 }

// Configure LocalStack endpoint if running in LocalStack environment
if (process.env.AWSENV && process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
    sqsClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME
        ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566`
        : 'http://localhost:4566'
    sqsClientConfig.region = 'us-east-1'
    sqsClientConfig.credentials = {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
}

const sqsClient = new SQSClient(sqsClientConfig)

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets the proper queue url from AWS from a provided queue name, if the queueName is not a URL
 * @param {String} queueName The name of the queue
 * @returns The queue url found from AWS. Undefined if the queue could not be found.
 */
async function getURLfromQueueName(queueName) {
    try {
        // If already a URL, return as-is
        if (/^https?:\/\//.test(queueName)) {
            return queueName
        }

        const queues = await listQueueURLs()
        const foundQueueURL = queues.find(queueURL =>
            queueURL.replace(/.*\/(.*)/, '$1').includes(queueName)
        )

        if (!foundQueueURL) {
            const availableQueues = queues.length > 0
                ? queues.map(q => q.replace(/.*\/(.*)/, '$1')).join(', ')
                : 'None'
            throw new Error(`The queue '${queueName}' could not be found. Available queues: ${availableQueues}`)
        }

        return foundQueueURL
    } catch (error) {
        throw new Error(`Failed to get URL for queue '${queueName}': ${error.message}`)
    }
}

/**
 * Sends a message to a queue using only the queue name
 * @param {JSON|String} message The message to send
 * @param {String} QueueName The name of the queue to send the message to
 * @param {Object} options Optional parameters like DelaySeconds, MessageAttributes, etc.
 * @returns {JSON} SendMessageCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/interfaces/sendmessagecommandoutput.html)
 */
async function sendMessageToQueue(message, QueueName, options = {}) {
    try {
        let QueueUrl

        // Convert queue name to URL if needed
        if (!/^https?:\/\//.test(QueueName)) {
            QueueUrl = await getURLfromQueueName(QueueName)
        } else {
            QueueUrl = QueueName
        }

        // Ensure message is a string
        if (typeof message !== 'string') {
            message = JSON.stringify(message)
        }

        const queryParameters = {
            MessageBody: message,
            QueueUrl,
            ...options
        }

        const result = await sqsClient.send(new SendMessageCommand(queryParameters))

        return result
    } catch (error) {
        throw new Error(`Failed to send message to queue '${QueueName}': ${error.message}`)
    }
}

/**
 * Fetches the list of queues on AWS with pagination support
 * @returns {Array} An array of queue URLs
 */
async function listQueueURLs() {
    try {
        let queues = []
        let res = {}

        do {
            const queryParameters = {}
            if (res.NextToken) {
                queryParameters.NextToken = res.NextToken
            }

            res = await sqsClient.send(new ListQueuesCommand(queryParameters))
            if (res.QueueUrls) {
                queues = queues.concat(res.QueueUrls)
            }
        } while (res.NextToken)

        return queues || []
    } catch (error) {
        throw new Error(`Failed to list queues: ${error.message}`)
    }
}

/**
 * Dequeues/receives multiple messages from an SQS queue
 * @param {String} QueueUrl The URL of the queue
 * @param {Number} MaxNumberOfMessages The number of messages to get from the queue. Default is 1
 * @param {Number} WaitTimeSeconds Long polling wait time. Default is 0
 * @returns {Array} An array of messages from the queue with full message details
 */
async function dequeueMessagesFromQueue(QueueUrl, MaxNumberOfMessages = 1, WaitTimeSeconds = 0) {
    try {
        const params = {
            MaxNumberOfMessages,
            QueueUrl,
            WaitTimeSeconds
        }
        const res = await sqsClient.send(new ReceiveMessageCommand(params))
        return res.Messages ? res.Messages.map(message => message.Body) : []
    } catch (error) {
        throw new Error(`Failed to receive messages from queue: ${error.message}`)
    }
}

/**
 * Gets the attributes of a queue
 * @param {String} queueName The name of the queue
 * @returns {Object} The attributes of the queue
 * @throws {Error} An error if the queue could not be found
 */
async function attributesOfQueue(queueName) {
    try {
        const QueueUrl = await getURLfromQueueName(queueName)
        const queryParameters = {
            AttributeNames: ['All'],
            QueueUrl
        }

        const res = await sqsClient.send(new GetQueueAttributesCommand(queryParameters))
        return res.Attributes
    } catch (error) {
        throw new Error(`Failed to get attributes for queue '${queueName}': ${error.message}`)
    }
}

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

MAFWhen('queue {string} exists on SQS', async function (queueName) {
    queueName = fillTemplate(queueName, this.results)
    return await getURLfromQueueName(queueName)
})

/**
 * Waits for a queue to have a specific number of messages by checking the ApproximateNumberOfMessages attribute
 * Checks every 5 seconds until the timeout is reached
 * @param {String} queueName The name of the queue
 * @param {Number} messageCount The number of messages to wait for
 * @param {Number} timeout The maximum time to wait for the queue to have the specified number of messages in seconds
 * @throws {Error} An error if the queue doesn't have the expected message count within the timeout
 */
async function waitUntilQueueHasCount(queueName, messageCount, timeout) {
    if (messageCount < 0) {
        throw new Error('Message count must be greater than or equal to 0')
    }
    if (timeout < 0) {
        throw new Error('Timeout must be greater than or equal to 0')
    }

    const startTime = Date.now()
    let queueAttributes

    do {
        queueAttributes = await attributesOfQueue(queueName)
        if (queueAttributes.ApproximateNumberOfMessages === messageCount.toString()) {
            return true
        }
        await new Promise(resolve => setTimeout(resolve, 5000))
    } while (Date.now() - startTime < timeout * 1000)

    throw new Error(
        `Queue ${queueName} did not have ${messageCount} messages within ${timeout} seconds. ` +
        `Current message count: ${queueAttributes.ApproximateNumberOfMessages}`
    )
}

MAFWhen('queue {string} is empty within {int} second(s)', async function (queueName, timeout) {
    queueName = fillTemplate(queueName, this.results)
    await waitUntilQueueHasCount(queueName, 0, timeout)
})

MAFWhen('queue {string} has {int} message(s) within {int} second(s)', async function (queueName, messageCount, timeout) {
    queueName = fillTemplate(queueName, this.results)
    await waitUntilQueueHasCount(queueName, messageCount, timeout)
})

/**
 * Gets all attributes for a SQS queue
 * To determine whether a queue is FIFO, you can check whether QueueName ends with the .fifo suffix.
 * @param {String} queueName The queue to get attributes from
 * @returns {Object} All queue attributes in JSON format
 */
MAFWhen('attributes of queue {string} are received', async function (QueueUrl) {
    QueueUrl = fillTemplate(QueueUrl, this.results)

    if (!/^https?:\/\//.test(QueueUrl)) {
        QueueUrl = await getURLfromQueueName(QueueUrl)
    }

    const queryParameters = {
        AttributeNames: ['All'],
        QueueUrl
    }

    const res = await sqsClient.send(new GetQueueAttributesCommand(queryParameters))
    return res.Attributes
})

MAFWhen('queue {string} is purged', async function (QueueUrl) {
    QueueUrl = fillTemplate(QueueUrl, this.results)

    if (!/^https?:\/\//.test(QueueUrl)) {
        QueueUrl = await getURLfromQueueName(QueueUrl)
    }

    return await sqsClient.send(new PurgeQueueCommand({ QueueUrl }))
})

// Message sending step definitions
MAFWhen('{jsonObject} is sent to queue {string}', async function (message, QueueUrl) {
    message = performJSONObjectTransform.call(this, message)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    return sendMessageToQueue(message, QueueUrl)
})

MAFWhen('{string} message is sent to queue {string}', async function (message, QueueUrl) {
    message = fillTemplate(message, this.results)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    QueueUrl = await getURLfromQueueName(QueueUrl)
    return sendMessageToQueue(message, QueueUrl)
})

// Message receiving step definitions
MAFWhen('the next message is received from queue {string}', async function (queueURL) {
    queueURL = fillTemplate(queueURL, this.results)
    queueURL = await getURLfromQueueName(queueURL)
    const res = await dequeueMessagesFromQueue(queueURL)
    return res[0]
})

MAFWhen('{int} messages are received from queue {string}', async function (numOfMessages, queueURL) {
    queueURL = fillTemplate(queueURL, this.results)
    queueURL = await getURLfromQueueName(queueURL)
    return await dequeueMessagesFromQueue(queueURL, numOfMessages)
})
