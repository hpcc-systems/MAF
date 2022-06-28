const { When, Cucumber, setDefaultTimeout }= require('@cucumber/cucumber')
const { performJSONObjectTransform, MAFWhen, filltemplate } = require('@ln-maf/core')
const { DynamoDBClient, ListTablesCommand, QueryCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb')
const assert = require('chai').assert
const runAWS = require('../awsL')
const fillTemplate = filltemplate

setDefaultTimeout(30 * 60 * 1000)

const DynamoDBClientConfig = {
  maxAttempts: 3
}
if (process.env.AWSENV === undefined || process.env.AWSENV === '' || process.env.AWSENV.toUpperCase() === 'FALSE') {
  DynamoDBClientConfig.endpoint = 'http://localhost:4566'
}
const dbClient = new DynamoDBClient(DynamoDBClientConfig)

/**
 * Returns true if the table exists on DynamoDB
 * @param {string} tableName The name of the table on DynamoDB
 * @returns {boolean} true if the table exists on DynamoDB
 */
async function tableExists (tableName) {
  let res = {};
  let tables = []
  do {
    if (res && res.LastEvaluatedTableName){
      res = await dbClient.send(new ListTablesCommand({}));
    } else {
      res = await dbClient.send(new ListTablesCommand({ExclusiveStartTableName: res.LastEvaluatedTableName}));
    }
    tables = tables.concat(res.TableNames)
  } while (res.LastEvaluatedTableName)
  return tables.includes(tableName)
}

/**
 * Cleans the Json item file received from Dynamodb into a readable format
 * @param {JSON} jsonItem A JSON item with contents from dynamoDB.
 * @returns {JSON} a cleaned JSON object
 */
function cleanDynamoQuery (jsonItem) {
  if (typeof jsonItem === 'string') {
    jsonItem = JSON.parse(jsonItem)
  }
  if (jsonItem.Item) {
    jsonItem = jsonItem.Item
  }
  if (Array.isArray(jsonItem)) {
    const array = []
    jsonItem.forEach((item) => {
      const res = {}
      Object.keys(item).forEach((i) => {
        Object.keys(item[i]).forEach((j) => {
          res[i] = item[i][j]
        })
      })
      array.push(res)
    })
    return array
  } else {
    const res = {}
    Object.keys(jsonItem).forEach((i) => {
      Object.keys(jsonItem[i]).forEach((j) => {
        res[i] = jsonItem[i][j]
      })
    })
    return res
  }
}

MAFWhen('{jsonObject} is cleaned', function (payload) {
  payload = JSON.stringify(performJSONObjectTransform.call(this, payload))
  const cleanedItem = cleanDynamoQuery(payload)
  return cleanedItem
})

/**
 * Converts a JSON object to AWS standard for uploading
 * Only works for Key values that are strings, numbers, boolean, and base64 encoded
 * base64 will be stored as binary in AWS
 * @param {JSON} jsonItem a JSON object
 */
function convertToDynamoItem (jsonItem) {
  if (typeof jsonItem === 'string') {
    jsonItem = JSON.parse(jsonItem)
  }
  const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
  Object.keys(jsonItem).forEach((key) => {
    let dynamoChar
    if (typeof jsonItem[key] === 'boolean') {
      dynamoChar = 'BOOL'
      jsonItem[key] = { [dynamoChar]: jsonItem[key] }
      return
    }
    if (!isNaN(jsonItem[key])) dynamoChar = 'N'
    else if (base64regex.test(jsonItem[key])) dynamoChar = 'B'
    else if (jsonItem[key].constructor === {}.constructor) dynamoChar = 'M'
    else dynamoChar = 'S'
    jsonItem[key] = { [dynamoChar]: String(jsonItem[key]) }
  })
  return jsonItem
}

MAFWhen('{jsonObject} is converted to dynamo', function (payload) {
  payload = JSON.stringify(performJSONObjectTransform.call(this, payload))
  const dynamoItem = convertToDynamoItem(payload)
  return dynamoItem
})

MAFWhen('table {string} exists on dynamo', async function (tableName) {
  tableName = fillTemplate(tableName, this.results)
  if (!await tableExists(tableName)) {
    throw new Error('The table ' + tableName + ' does not exist on dynamoDB')
  }
})

/**
 * Gets the JSON item from DynamoDB
 *
 * This function looks at the following variables to see if they exist, and apply them to the dynamo query
 * tableName - required
 * keyConditionExpression - required
 * filterExpression
 * expressionAttributeNames
 * expressionAttributeValues - Must be a JSON object
 *
 * AWS Documentation: https://docs.aws.amazon.com/cli/latest/reference/dynamodb/query.html
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 */
async function dynamoQuery (activeArgs, additionalArgs) {
  const dynamoQueryArgs = {}
  Object.assign(dynamoQueryArgs, this.results)
  Object.assign(dynamoQueryArgs, activeArgs)

  let lastEvaluatedKey
  let res = []
  do {
    let queryParameters = {}
    if (!dynamoQueryArgs.tableName) {
      throw new Error("The 'tableName' for dynamodb query is required")
    }
    queryParameters.TableName =  dynamoQueryArgs.tableName

    if (!dynamoQueryArgs.keyConditionExpression) {
      throw new Error("The 'keyConditionExpression' for dynamodb query is required")
    }
    queryParameters.KeyConditionExpression = dynamoQueryArgs.keyConditionExpression

    if (dynamoQueryArgs.filterExpression) {
      queryParameters.FilterExpression = dynamoQueryArgs.filterExpression
    }
    if (dynamoQueryArgs.projectionExpression) {
      queryParameters.ProjectionExpression = dynamoQueryArgs.projectionExpression
    }
    if (dynamoQueryArgs.indexName) {
      queryParameters.IndexName = dynamoQueryArgs.indexName
    }
    if (dynamoQueryArgs.expressionAttributeValues) {
      if (dynamoQueryArgs.expressionAttributeValues === 'string') {
        dynamoQueryArgs.expressionAttributeValues = JSON.parse(
          dynamoQueryArgs.expressionAttributeValues
        )
      }
      queryParameters.ExpressionAttributeValues = dynamoQueryArgs.expressionAttributeValues
    }
    if (dynamoQueryArgs.expressionAttributeNames) {
      queryParameters.ExpressionAttributeNames = dynamoQueryArgs.expressionAttributeNames
    }
    if (additionalArgs) {
      queryParameters = {...queryParameters,...additionalArgs}
    }
    if (lastEvaluatedKey) {
      queryParameters.ExclusiveStartKey = lastEvaluatedKey
    } else {
      this.attach(JSON.stringify(queryParameters))
    }
    const queryResults = await dbClient.send(new QueryCommand(queryParameters))
    res = res.concat(queryResults.Items)
    lastEvaluatedKey = queryResults.LastEvaluatedKey
  } while (lastEvaluatedKey)
  return res
}

/**
 * Extracts variables for dynamodb query and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the query
 */
 async function performDynamoDBQueryFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = []
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'tableName':
      case 'indexName':
      case 'projectionExpression':
      case 'filterExpression':
      case 'keyConditionExpression':
      case 'expressionAttributeNames':
        activeArgs[key] = payload[key]
        break
      case 'expressionAttributeValues':
        activeArgs[key] =
          typeof payload[key] === 'string'
            ? JSON.parse(payload[key])
            : payload[key]
        break
      default:
        additionalArgs.push('--' + key)
        additionalArgs.push(payload[key])
    }
  })
  return dynamoQuery.call(this, activeArgs, additionalArgs)
}

/**
 * Gets a query / item from a dynamoDB table
 */
 MAFWhen('dynamodb query from {jsonObject} is performed', async function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb query based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb query:', async function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(fillTemplate(docString, this.results))
  return performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
 MAFWhen('dynamodb query is performed', async function () {
  return dynamoQuery.call(this)
})

/**
 * Places an item on a dynamoDB table
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 * @return {JSON} The placed dynamodb item and its values
 */
async function putItem (activeArgs, additionalArgs) {
  const dynamoPutItemArgs = {}
  Object.assign(dynamoPutItemArgs, this.results)
  Object.assign(dynamoPutItemArgs, activeArgs)

  let queryParameters = {}
  if (!dynamoPutItemArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb query is required")
  }
  queryParameters.TableName =  dynamoPutItemArgs.tableName
  
  if (!dynamoPutItemArgs.item) {
    throw new Error("The 'item' for dynamodb put-item is required")
  }
  if (dynamoPutItemArgs.item === 'string') {
    dynamoPutItemArgs.item = JSON.parse(dynamoPutItemArgs.item)
  }
  queryParameters.Item =  dynamoPutItemArgs.item
  
  if (dynamoPutItemArgs.expressionAttributeValues) {
    if (dynamoPutItemArgs.expressionAttributeValues === 'string') {
      dynamoPutItemArgs.expressionAttributeValues = JSON.parse(
        dynamoPutItemArgs.expressionAttributeValues
      )
    }
    queryParameters.ExpressionAttributeValues = dynamoPutItemArgs.expressionAttributeValues
  }
  if (dynamoPutItemArgs.expressionAttributeNames) {
    queryParameters.ExpressionAttributeNames = dynamoPutItemArgs.expressionAttributeNames
  }
  queryParameters.ReturnValues = 'ALL_OLD'
  if (additionalArgs) {
    queryParameters = {...queryParameters,...additionalArgs}
  }
  return await dbClient.send(new PutItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb put-item and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the put-item
 */
async function performDynamoDBPutItemFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = []
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'tableName':
        activeArgs[key] = payload[key]
        break
      case 'item':
        activeArgs[key] =
          typeof payload[key] === 'string'
            ? JSON.parse(payload[key])
            : payload[key]
        break
      default:
        additionalArgs.push('--' + key)
        additionalArgs.push(payload[key])
    }
  })
  putItem.call(this, activeArgs, additionalArgs)
}

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb put-item from {jsonObject} is performed', function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb query based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb put-item:', function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(fillTemplate(docString, this.results))
  return performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb put-item is performed', function () {
  return putItem.call(this)
})

/**
 * Updates an item on a dynamoDB table
 *
 * This function looks at the following variables to see if they exist, and apply them to the dynamo query
 * tableName - required
 * key - required, Must be a JSON object
 * expressionAttributeNames
 * expressionAttributeValues - Must be a JSON object
 *
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 */
function updateItem (activeArgs, additionalArgs) {
  const dynamoArgs = {}
  Object.assign(dynamoArgs, this.results)
  Object.assign(dynamoArgs, activeArgs)

  const args = ['dynamodb', 'update-item']
  if (!dynamoArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb put-item is required")
  }
  args.push('--table-name', dynamoArgs.tableName)
  if (!dynamoArgs.key) {
    throw new Error("The 'key' for dynamodb put-item is required")
  }
  if (dynamoArgs.key === 'string') {
    dynamoArgs.key = JSON.parse(dynamoArgs.key)
  }
  args.push('--key', JSON.stringify(dynamoArgs.key))
  if (dynamoArgs.updateExpression) {
    args.push('--update-expression', dynamoArgs.updateExpression)
  }
  if (dynamoArgs.expressionAttributeNames) {
    args.push(
      '--expression-attribute-names',
      dynamoArgs.expressionAttributeNames
    )
  }
  if (dynamoArgs.expressionAttributeValues) {
    if (dynamoArgs.expressionAttributeValues === 'string') {
      dynamoArgs.expressionAttributeValues = JSON.parse(
        dynamoArgs.expressionAttributeValues
      )
    }
    args.push(
      '--expression-attribute-values',
      JSON.stringify(dynamoArgs.expressionAttributeValues)
    )
  }
  args.push('--return-values', 'ALL_NEW')
  if (additionalArgs) {
    args.push(...additionalArgs)
  }
  this.attach(`Query: ${args}`)
  this.results.lastRun = JSON.parse(runAWS(args).stdout)
  this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
}

/**
 * Extracts variables for dynamodb query and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the query
 */
function performDynamoDBUpdateFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = []
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'tableName':
      case 'expressionAttributeNames':
        activeArgs[key] = payload[key]
        break
      case 'expressionAttributeValues':
      case 'key':
        activeArgs[key] =
          typeof payload[key] === 'string'
            ? JSON.parse(payload[key])
            : payload[key]
        break
      default:
        additionalArgs.push('--' + key)
        additionalArgs.push(payload[key])
    }
  })
  updateItem.call(this, activeArgs, additionalArgs)
}

/**
 * Updates an item from a dynamoDB table
 */
When('dynamodb update-item from {jsonObject} is performed', function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  performDynamoDBUpdateFromJSON.call(this, payload)
})

/**
 * Updates a dynamodb item based on the provided docstring and variables already defined
 */
When('perform dynamodb update-item:', function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(fillTemplate(docString, this.results))
  performDynamoDBUpdateFromJSON.call(this, payload)
})

/**
 * Updates an item from a dynamoDB table
 */
When('dynamodb update-item is performed', function () {
  updateItem.call(this)
})

/**
 * Deletes item on a dynamoDB table
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 * @return {JSON} The deleted dynamodb item and its old values
 */
function deleteItem (activeArgs, additionalArgs) {
  const dynamoArgs = {}
  Object.assign(dynamoArgs, this.results)
  Object.assign(dynamoArgs, activeArgs)
  const args = ['dynamodb', 'delete-item']
  if (!dynamoArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb put-item is required")
  }
  args.push('--table-name', dynamoArgs.tableName)
  if (!dynamoArgs.key) {
    throw new Error("The 'key' for dynamodb put-item is required")
  }
  if (dynamoArgs.key === 'string') {
    dynamoArgs.key = JSON.parse(dynamoArgs.key)
  }
  args.push('--key', JSON.stringify(dynamoArgs.key))
  args.push('--return-values', 'ALL_OLD')
  if (additionalArgs) {
    args.push(...additionalArgs)
  }
  this.attach(`Query: ${args}`)
  this.results.lastRun = JSON.parse(
    runAWS(args).stdout.replace('\\r\\n', '\\n').trim()
  ).Attributes
  this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
}

/**
 * Extracts variables for dynamodb query and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the deletion
 */
function performDynamoDBDeleteFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = []
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'tableName':
        activeArgs[key] = payload[key]
        break
      case 'key':
        activeArgs[key] =
          typeof payload[key] === 'string'
            ? JSON.parse(payload[key])
            : payload[key]
        break
      default:
        additionalArgs.push('--' + key)
        additionalArgs.push(payload[key])
    }
  })
  deleteItem.call(this, activeArgs, additionalArgs)
}

/**
 * Deletes an item from a dynamoDB table
 */
When('dynamodb delete-item from {jsonObject} is performed', function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  performDynamoDBDeleteFromJSON.call(this, payload)
})

/**
 * Deletes a dynamodb item based on the provided docstring and variables already defined
 */
When('perform dynamodb delete-item:', function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(fillTemplate(docString, this.results))
  performDynamoDBDeleteFromJSON.call(this, payload)
})

/**
 * Deletes an item from a dynamoDB table
 */
When('dynamodb delete-item is performed', function () {
  deleteItem.call(this)
})
