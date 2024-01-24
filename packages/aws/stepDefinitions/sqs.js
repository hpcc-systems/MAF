const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, performJSONObjectTransform, fillTemplate } = require('@ln-maf/core')
const { SQSClient, ListQueuesCommand, GetQueueAttributesCommand, SendMessageCommand, ReceiveMessageCommand, PurgeQueueCommand } = require('@aws-sdk/client-sqs')

setDefaultTimeout(15 * 60 * 1000)

const sqsClientConfig = { maxAttempts: 3 }
if (process.env.AWSENV && process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
    sqsClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'
}
const sqsClient = new SQSClient(sqsClientConfig)

/**
 * Gets the proper queue url from AWS from a provided queue name
 * @param {String} queueName The name of the queue
 * @returns The queue url found from AWS. Undefined if the queue could not be found.
 */
async function getURLfromQueueName(queueName) {
    const queues = await listQueueURLs()
    const foundQueueURL = queues.find(queueURL => queueURL.replace(/.*\/(.*)/, '$1').includes(queueName))
    console.log('using queue ' + foundQueueURL)
    return foundQueueURL
}

/**
 * Sends a message to a queue using only the queue name
 * @param {JSON|String} message The message to send
 * @param {String} QueueName  The name of the queue to send the message to
 * @returns {JSON} SendMessageCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/interfaces/sendmessagecommandoutput.html)
 */
async function sendMessageToQueue(message, QueueName) {
    let QueueUrl
    if (!/^https?:\/\//.test(QueueName)) {
        QueueUrl = await getURLfromQueueName(QueueName)
    } else {
        QueueUrl = QueueName
    }
    const queryParameters = { MessageBody: message, QueueUrl }
    return await sqsClient.send(new SendMessageCommand(queryParameters))
}

/**
 * Fetches the list of queues on AWS
 * @returns an array of queues
 */
async function listQueueURLs() {
    let queues = []
    let res = {}
    do {
        const queryParameters = {}
        if (res.NextToken) {
            queryParameters.NextToken = res.NextToken
        }
        res = await sqsClient.send(new ListQueuesCommand(queryParameters))
        queues = queues.concat(res.QueueUrls)
    } while (res.NextToken)
    return queues
}

/**
 * Dequeues / Receives a set number of messages from an SQS queue
 * @param {int} numOfMessages The number of messages to get from the queue. Default is 1
 * @param {string} queueURL The name of the queue
 * @returns an array of messages from the queue
 */
async function dequeueMessagesFromQueue(queueURL, numOfMessages = 1) {
    const queryParameters = {
        MaxNumberOfMessages: numOfMessages,
        QueueUrl: queueURL
    }
    const res = await sqsClient.send(new ReceiveMessageCommand(queryParameters))
    return res.Messages ? res.Messages.map(message => message.Body) : []
}

MAFWhen('queue {string} exists on SQS', async function (queueName) {
    queueName = fillTemplate(queueName, this.results)
    const queueURLs = await listQueueURLs()
    if (!queueURLs.some(queueURL => queueURL.replace(/.*\/(.*)/, '$1').includes(queueName))) {
        throw new Error("The queue '" + queueName + "' could not be found")
    }
})

/**
 * Gets all attributes for a SQS queue
 * To determine whether a queue is FIFO, you can check whether QueueName ends with the .fifo suffix.
 * @param {String} queueName The queue to get attributes from
 * @returns all queue attributes in JSON format
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

MAFWhen('{jsonObject} is sent to queue {string}', async function (message, queue) {
    message = performJSONObjectTransform.call(this, message)
    queue = fillTemplate(queue, this.results)
    return sendMessageToQueue(message, queue)
})

MAFWhen('{jsonObject} is sent to queue url {string}', async function (message, QueueUrl) {
    message = performJSONObjectTransform.call(this, message)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    return await sqsClient.send(new SendMessageCommand({ MessageBody: message, QueueUrl }))
})

MAFWhen('{string} message is sent to queue {string}', async function (message, queue) {
    message = fillTemplate(message, this.results)
    queue = fillTemplate(queue, this.results)
    return sendMessageToQueue(message, queue)
})

MAFWhen('{string} message is sent to queue url {string}', async function (message, QueueUrl) {
    message = fillTemplate(message, this.results)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    return await sqsClient.send(new SendMessageCommand({ MessageBody: message, QueueUrl }))
})

MAFWhen('the next message is received from queue {string}', async function (queueURL) {
    queueURL = fillTemplate(queueURL, this.results)
    const res = await dequeueMessagesFromQueue(queueURL)
    return res[0]
})

MAFWhen('{int} messages are received from queue {string}', async function (numOfMessages, queueURL) {
    queueURL = fillTemplate(queueURL, this.results)
    return await dequeueMessagesFromQueue(queueURL, numOfMessages)
})
