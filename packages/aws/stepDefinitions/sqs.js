const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, performJSONObjectTransform, filltemplate } = require('@ln-maf/core')
const { SQSClient, ListQueuesCommand, GetQueueAttributesCommand, SendMessageCommand, ReceiveMessageCommand } = require('@aws-sdk/client-sqs')

setDefaultTimeout(15 * 60 * 1000)

const sqsClientConfig = { maxAttempts: 3 }
if (process.env.AWSENV === undefined || process.env.AWSENV === '' || process.env.AWSENV.toUpperCase() === 'FALSE') {
  sqsClientConfig.endpoint = 'http://localhost:4566'
}
const sqsClient = new SQSClient(sqsClientConfig)

/**
 * Fetches the list of queues on AWS
 * @returns an array of queues
 */
async function listQueueURLs () {
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

MAFWhen('queue {string} exists on SQS', async function (queueName) {
  queueName = filltemplate(queueName, this.results)
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
MAFWhen('attributes of queue {string} are received', async function (queueName) {
  queueName = filltemplate(queueName, this.results)
  const queues = await listQueueURLs()
  const queueURL = queues.find(queueURL => queueURL.replace(/.*\/(.*)/, '$1').includes(queueName))
  const queryParameters = {
    AttributeNames: ['All'],
    QueueUrl: queueURL
  }
  const res = await sqsClient.send(new GetQueueAttributesCommand(queryParameters))
  return res.Attributes
})

/**
 * Gets the proper queue url from AWS from a provided queue name
 * @param {String} queueName The name of the queue
 * @returns The queue url found from AWS. Undefined if the queue could not be found.
 */
async function getURLfromQueueName (queueName) {
  const queues = await listQueueURLs()
  return queues.find(queueURL => queueURL.replace(/.*\/(.*)/, '$1').includes(queueName))
}

/**
 * Sends a message to a queue
 * @param {JSON|String} message The message to send
 * @param {String} queueName  The name of the queue to send the message to
 * @returns {JSON} SendMessageCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-sqs/interfaces/sendmessagecommandoutput.html)
 */
async function sendMessageToQueue (message, queueName) {
  const queueURL = await getURLfromQueueName(queueName)
  const queryParameters = {
    MessageBody: message,
    QueueUrl: queueURL
  }
  return await sqsClient.send(new SendMessageCommand(queryParameters))
}

MAFWhen('{jsonObject} is sent to queue {string}', async function (message, queue) {
  message = performJSONObjectTransform.call(this, message)
  queue = filltemplate(queue, this.results)
  return await sendMessageToQueue(message, queue)
})

/**
 * Dequeues / Receives a set number of messages from an SQS queue
 * @param {int} numOfMessages The number of messages to get from the queue. Default is 1
 * @param {string} queueName The name of the queue
 * @returns an array of messages from the queue
 */
async function dequeueMessagesFromQueue (queueName, numOfMessages = 1) {
  const queueURL = await getURLfromQueueName(queueName)
  const queryParameters = {
    MaxNumberOfMessages: numOfMessages,
    QueueUrl: queueURL
  }
  const res = await sqsClient.send(new ReceiveMessageCommand(queryParameters))
  return res.Messages ? res.Messages.map(message => message.Body) : []
}

MAFWhen('the next message is received from queue {string}', async function (queueName) {
  queueName = filltemplate(queueName, this.results)
  const res = await dequeueMessagesFromQueue(queueName)
  return res[0]
})

MAFWhen('{int} messages are received from queue {string}', async function (numOfMessages, queueName) {
  queueName = filltemplate(queueName, this.results)
  return await dequeueMessagesFromQueue(queueName, numOfMessages)
})
