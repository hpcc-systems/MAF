const { setDefaultTimeout } = require('@cucumber/cucumber')
const { performJSONObjectTransform, MAFWhen, filltemplate } = require('@ln-maf/core')
const { DynamoDBClient, ListTablesCommand, QueryCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb')

setDefaultTimeout(15 * 60 * 1000)

const DynamoDBClientConfig = {
  maxAttempts: 3
}
if (process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
  DynamoDBClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME ? `http://${process.env.LOCALSTACK_HOSTNAME}:4566` : 'http://localhost:4566'
}
const dbClient = new DynamoDBClient(DynamoDBClientConfig)

/**
 * Returns true if the table exists on DynamoDB
 * @param {string} tableName The name of the table on DynamoDB
 * @returns {boolean} true if the table exists on DynamoDB
 */
async function tableExists (tableName) {
  let res = {}
  let tables = []
  do {
    if (res.LastEvaluatedTableName) {
      res = await dbClient.send(new ListTablesCommand({ ExclusiveStartTableName: res.LastEvaluatedTableName }))
    } else {
      res = await dbClient.send(new ListTablesCommand({}))
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
  tableName = filltemplate(tableName, this.results)
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
 * @param {JSON} activeArgs supported arguments for the AWS QueryCommand
 * @param {JSON} additionalArgs unsupported pairs of other attributes for AWS QueryCommand
 * @return {String[]} Items from AWS
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
    queryParameters.TableName = dynamoQueryArgs.tableName

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
    if (dynamoQueryArgs.scanIndexForward) {
      queryParameters.ScanIndexForward = dynamoQueryArgs.scanIndexForward
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
      queryParameters = { ...queryParameters, ...additionalArgs }
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
  const additionalArgs = {}
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'tableName':
      case 'indexName':
      case 'projectionExpression':
      case 'scanIndexForward':
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
        additionalArgs[key] = payload[key]
    }
  })
  return dynamoQuery.call(this, activeArgs, additionalArgs)
}

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb query from {jsonObject} is performed', async function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return await performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb query based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb query:', async function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(filltemplate(docString, this.results))
  return await performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb query is performed', async function () {
  return await dynamoQuery.call(this)
})

/**
 * Places an item on a dynamoDB table
 * @param {JSON} activeArgs supported arguments for the AWS PutItemCommand
 * @param {JSON} additionalArgs unsupported pairs of other attributes for AWS PutItemCommand
 * @return {String[]} PutItemCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandoutput.html)
 */
async function putItem (activeArgs, additionalArgs) {
  const dynamoPutItemArgs = {}
  Object.assign(dynamoPutItemArgs, this.results)
  Object.assign(dynamoPutItemArgs, activeArgs)

  let queryParameters = {}
  if (!dynamoPutItemArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb query is required")
  }
  queryParameters.TableName = dynamoPutItemArgs.tableName

  if (!dynamoPutItemArgs.item) {
    throw new Error("The 'item' for dynamodb put-item is required")
  }
  if (dynamoPutItemArgs.item === 'string') {
    dynamoPutItemArgs.item = JSON.parse(dynamoPutItemArgs.item)
  }
  queryParameters.Item = dynamoPutItemArgs.item

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
    queryParameters = { ...queryParameters, ...additionalArgs }
  }
  this.attach(JSON.stringify(queryParameters))
  return await dbClient.send(new PutItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb put-item and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the put-item
 */
async function performDynamoDBPutItemFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = {}
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
        additionalArgs[key] = payload[key]
    }
  })
  return await putItem.call(this, activeArgs, additionalArgs)
}

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb put-item from {jsonObject} is performed', async function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return await performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb query based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb put-item:', async function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(filltemplate(docString, this.results))
  return await performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb put-item is performed', async function () {
  return await putItem.call(this)
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
 * @param {JSON} activeArgs supported arguments for the AWS UpdateItemCommand
 * @param {JSON} additionalArgs unsupported pairs of other attributes for AWS UpdateItemCommand
 * @return {String[]} UpdateItemCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/updateitemcommandoutput.html)
 */
async function updateItem (activeArgs, additionalArgs) {
  const dynamoUpdateItemArgs = {}
  Object.assign(dynamoUpdateItemArgs, this.results)
  Object.assign(dynamoUpdateItemArgs, activeArgs)

  let queryParameters = {}
  if (!dynamoUpdateItemArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb query is required")
  }
  queryParameters.TableName = dynamoUpdateItemArgs.tableName

  if (!dynamoUpdateItemArgs.key) {
    throw new Error("The 'item' for dynamodb put-item is required")
  }
  if (dynamoUpdateItemArgs.key === 'string') {
    dynamoUpdateItemArgs.key = JSON.parse(dynamoUpdateItemArgs.key)
  }
  queryParameters.Key = dynamoUpdateItemArgs.key

  if (dynamoUpdateItemArgs.expressionAttributeValues) {
    if (dynamoUpdateItemArgs.expressionAttributeValues === 'string') {
      dynamoUpdateItemArgs.expressionAttributeValues = JSON.parse(
        dynamoUpdateItemArgs.expressionAttributeValues
      )
    }
    queryParameters.ExpressionAttributeValues = dynamoUpdateItemArgs.expressionAttributeValues
  }
  if (dynamoUpdateItemArgs.expressionAttributeNames) {
    queryParameters.ExpressionAttributeNames = dynamoUpdateItemArgs.expressionAttributeNames
  }
  if (dynamoUpdateItemArgs.updateExpression) {
    queryParameters.UpdateExpression = dynamoUpdateItemArgs.updateExpression
  }
  queryParameters.ReturnValues = 'ALL_NEW'
  if (additionalArgs) {
    queryParameters = { ...queryParameters, ...additionalArgs }
  }
  this.attach(JSON.stringify(queryParameters))
  return await dbClient.send(new UpdateItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb query and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the query
 */
async function performDynamoDBUpdateFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = {}
  Object.keys(payload).forEach((key) => {
    switch (key) {
      case 'tableName':
      case 'expressionAttributeNames':
      case 'updateExpression':
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
        additionalArgs[key] = payload[key]
    }
  })
  return await updateItem.call(this, activeArgs, additionalArgs)
}

/**
 * Updates an item from a dynamoDB table
 */
MAFWhen('dynamodb update-item from {jsonObject} is performed', async function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return await performDynamoDBUpdateFromJSON.call(this, payload)
})

/**
 * Updates a dynamodb item based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb update-item:', async function (docString) {
  const payload = JSON.parse(filltemplate(docString, this.results))
  return await performDynamoDBUpdateFromJSON.call(this, payload)
})

/**
 * Updates an item from a dynamoDB table
 */
MAFWhen('dynamodb update-item is performed', async function () {
  return await updateItem.call(this)
})

/**
 * Deletes item on a dynamoDB table
 * @param {JSON} activeArgs supported arguments for the AWS DeleteItemCommand
 * @param {JSON} additionalArgs unsupported pairs of other attributes for AWS DeleteItemCommand
 * @return {String[]} DeleteItemCommandOutput (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/deleteitemcommandoutput.html)
 */
async function deleteItem (activeArgs, additionalArgs) {
  const dynamoDeleteItemArgs = {}
  Object.assign(dynamoDeleteItemArgs, this.results)
  Object.assign(dynamoDeleteItemArgs, activeArgs)

  let queryParameters = {}
  if (!dynamoDeleteItemArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb query is required")
  }
  queryParameters.TableName = dynamoDeleteItemArgs.tableName

  if (!dynamoDeleteItemArgs.key) {
    throw new Error("The 'item' for dynamodb put-item is required")
  }
  if (dynamoDeleteItemArgs.key === 'string') {
    dynamoDeleteItemArgs.key = JSON.parse(dynamoDeleteItemArgs.key)
  }
  queryParameters.Key = dynamoDeleteItemArgs.key

  if (dynamoDeleteItemArgs.expressionAttributeValues) {
    if (dynamoDeleteItemArgs.expressionAttributeValues === 'string') {
      dynamoDeleteItemArgs.expressionAttributeValues = JSON.parse(
        dynamoDeleteItemArgs.expressionAttributeValues
      )
    }
    queryParameters.ExpressionAttributeValues = dynamoDeleteItemArgs.expressionAttributeValues
  }
  if (dynamoDeleteItemArgs.expressionAttributeNames) {
    queryParameters.ExpressionAttributeNames = dynamoDeleteItemArgs.expressionAttributeNames
  }
  if (dynamoDeleteItemArgs.updateExpression) {
    queryParameters.UpdateExpression = dynamoDeleteItemArgs.updateExpression
  }
  queryParameters.ReturnValues = 'ALL_OLD'
  if (additionalArgs) {
    queryParameters = { ...queryParameters, ...additionalArgs }
  }
  this.attach(JSON.stringify(queryParameters))
  return await dbClient.send(new DeleteItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb query and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the deletion
 */
async function performDynamoDBDeleteFromJSON (payload) {
  const activeArgs = {}
  const additionalArgs = {}
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
        additionalArgs[key] = payload[key]
    }
  })
  return deleteItem.call(this, activeArgs, additionalArgs)
}

/**
 * Deletes an item from a dynamoDB table
 */
MAFWhen('dynamodb delete-item from {jsonObject} is performed', async function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  return await performDynamoDBDeleteFromJSON.call(this, payload)
})

/**
 * Deletes a dynamodb item based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb delete-item:', async function (docString) {
  const payload = JSON.parse(filltemplate(docString, this.results))
  return await performDynamoDBDeleteFromJSON.call(this, payload)
})

/**
 * Deletes an item from a dynamoDB table
 */
MAFWhen('dynamodb delete-item is performed', async function () {
  return await deleteItem.call(this)
})
