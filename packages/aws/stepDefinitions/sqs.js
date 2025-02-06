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
 * Gets the proper queue url from AWS from a provided queue name, if the queueName is not a URL
 * @param {String} queueName The name of the queue
 * @returns The queue url found from AWS. Undefined if the queue could not be found.
 */
async function getURLfromQueueName (queueName) {
  if (/^https?:\/\//.test(queueName)) {
    return queueName
  }
  const queues = await listQueueURLs()
  const foundQueueURL = queues.find(queueURL => queueURL.replace(/.*\/(.*)/, '$1').includes(queueName))
  if (!foundQueueURL) {
    throw new Error("The queue '" + queueName + "' could not be found")
  }
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
async function dequeueMessagesFromQueue (QueueUrl, MaxNumberOfMessages = 1) {
  const res = await sqsClient.send(new ReceiveMessageCommand({ MaxNumberOfMessages, QueueUrl }))
  return res.Messages ? res.Messages.map(message => message.Body) : []
}

/**
 * Gets the attributes of a queue
 * @param {String} queueName The name of the queue
 * @returns The attributes of the queue
 * @throws An error if the queue could not be found
 */
async function attributesOfQueue (queueName) {
  const QueueUrl = await getURLfromQueueName(queueName)
  const queryParameters = {
    AttributeNames: ['All'],
    QueueUrl
  }
  const res = await sqsClient.send(new GetQueueAttributesCommand(queryParameters))
  return res.Attributes
}

MAFWhen('queue {string} exists on SQS', async function (queueName) {
  queueName = fillTemplate(queueName, this.results)
  return await getURLfromQueueName(queueName)
})

/**
 * Waits for a queue to have a specific number of messages by checking the ApproximateNumberOfMessages attribute. Checks every 5 seconds.
 * @param {String} queueName The name of the queue
 * @param {int} messageCount The number of messages to wait for
 * @param {int} timeout The maximum time to wait for the queue to have the specified number of messages in seconds
 * @throws An error if the queue is not empty within the timeout
 */
async function waitUntilQueueHasCount (queueName, messageCount, timeout) {
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
  throw new Error('Queue ' + queueName + ' did not have ' + messageCount + ' messages within ' + timeout + ' seconds. Current message count: ' + queueAttributes.ApproximateNumberOfMessages)
}

MAFWhen('queue {string} is empty within {int} second(s)', async function (queueName, timeout) {
  queueName = filltemplate(queueName, this.results)
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

// Duplicate step definition - Will Deprecate
MAFWhen('{jsonObject} is sent to queue url {string}', async function (message, QueueUrl) {
    message = performJSONObjectTransform.call(this, message)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    return await sqsClient.send(new SendMessageCommand({ MessageBody: message, QueueUrl }))
})

MAFWhen('{string} message is sent to queue {string}', async function (message, QueueUrl) {
    message = fillTemplate(message, this.results)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    QueueUrl = await getURLfromQueueName(QueueUrl)
    return await sqsClient.send(new SendMessageCommand({ MessageBody: message, QueueUrl }))
})

// Duplicate step definition - Will Deprecate
MAFWhen('{string} message is sent to queue url {string}', async function (message, QueueUrl) {
    message = fillTemplate(message, this.results)
    QueueUrl = fillTemplate(QueueUrl, this.results)
    QueueUrl = await getURLfromQueueName(QueueUrl)
    return await sqsClient.send(new SendMessageCommand({ MessageBody: message, QueueUrl }))
})

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
