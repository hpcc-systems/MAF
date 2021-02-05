const { Given, When, Then } = require('@cucumber/cucumber')
var fs = require('fs')
var assert = require('chai').assert
var runAWS = require('../awsL')
const { performJSONObjectTransform, getFilePath, filltemplate } = require('@ln-maf/core')
fillTemplate = filltemplate

/**
 * Returns the value of the variable if it exists in this.results.
 * @param {string} variable the variable to check
 * @returns {Object} the value of the variable if it exists in this.results. Returns the variable
 * itself if variable does not contain "${}"
 */
function getVal(variable, scenario) {
  if (!scenario.results) {
    scenario.results = {}
  }
  return fillTemplate(variable, scenario.results)
}

/**
 * Fetches the list of queue on AWS
 * @returns {Array} an array of queues
 */
function getQueues() {
  const res = runAWS("sqs list-queues")
  return JSON.parse(res.stdout).QueueUrls
}

Given('queue {string} exists on SQS', function (queueName) {
  queueName = getVal(queueName, this);
  var queues = getQueues()
  assert.isTrue(queues.some(queue => queue.includes(queueName)), "The queue '" + queueName + "' could not be found")
})

/**
 * Sends a message to a queue
 * @param {string} message The message to send
 * @param {string} queueName  The name of the queue to send the message to
 * @returns {JSON} The MDS checksum and the id of the message
 * 
 */
function sendMessageToQueue(message, queueName) {
  const queueURL = getQueues().find(queue => queue.includes(queueName))
  if(typeof message==="object") {
      message=JSON.stringify(message)
  }
  const args = ["sqs", "send-message",
    "--queue-url", queueURL,
    "--message-body", message]
  this.attach(JSON.stringify({request: args}, null, 2))
  return JSON.parse(runAWS(args).stdout)
}

When('{jsonObject} is sent to queue {string}', function(message, queue) {
  message=performJSONObjectTransform.call(this, message)
  queue = getVal(queue, this);
  bddSendMessageToQueue.call(this, message, queue)
})
var bddSendMessageToQueue=function(message, queue) {
  var res = sendMessageToQueue.call(this, message, queue)
  if (!this.results) {
    this.results = {};
  }
  this.results.lastRun = res
  this.attach(JSON.stringify({ "lastRun": (this.results.lastRun) }, null, 2));
}
// Deprecated.  Prefer `When {jsonObject} is sent to queue {string}`
When('message {string} is sent to queue {string}', function (message, queue) {
  message = getVal(message, this);
  queue = getVal(queue, this);
  bddSendMessageToQueue.call(this, message, queue)
})

/**
 * Receives a set number of messages from an SQS queue
 * @param {int} numOfMessages The number of messages to get from the queue. Default is 1
 * @param {string} queueName The name of the queue
 */
function dequeueMessagesFromQueue(queueName, numOfMessages = 1) {
  const queueURL = getQueues().find(queue => queue.includes(queueName))
  const args = ["sqs", "receive-message",
    "--queue-url", queueURL,
    "--max-number-of-messages", numOfMessages]
  const res = runAWS(args)
  return JSON.parse(res.stdout).Messages
}

When('the next message is received from queue {string}', function (queueName) {
  queueName = getVal(queueName, this);
  var res = dequeueMessagesFromQueue(queueName)
  if (!this.results) {
    this.results = {};
  }
  this.results.lastRun = res[0].Body
  this.attach(JSON.stringify({ "lastRun": (this.results.lastRun) }, null, 2));
})

When('{int} messages are received from queue {string}', function (numOfMessages, queueName) {
  queueName = getVal(queueName, this);
  var res = dequeueMessagesFromQueue(queueName, numOfMessages)
  if (!this.results) {
    this.results = {};
  }
  this.results.lastRun = res.map(message => message.Body)
  this.attach(JSON.stringify({ "lastRun": (this.results.lastRun) }, null, 2));
})

function getQueueAttributes(queueName) {
  const queueURL = getQueues().find(queue => queue.includes(queueName))
  const args = ["sqs", "get-queue-attributes",
    "--queue-url", queueURL,
    "--attribute-names", "All"]
    const res = runAWS(args)
    return JSON.parse(res.stdout).Attributes
}

When('attributes of queue {string} are received', function (queueName) {
  queueName = getVal(queueName, this);
  var res = getQueueAttributes(queueName)
  if (!this.results) {
    this.results = {};
  }
  this.results.lastRun = res
  this.attach(JSON.stringify({ "lastRun": (this.results.lastRun) }, null, 2));
})
