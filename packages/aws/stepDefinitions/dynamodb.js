const Cucumber = require('@cucumber/cucumber')
const Given = Cucumber.Given
const When = Cucumber.When
const assert = require('chai').assert
const runAWS = require('../awsL')
const { performJSONObjectTransform, MAFWhen, filltemplate } = require('@ln-maf/core')
const fillTemplate = filltemplate

/**
 * Returns true if the table exists on DynamoDB
 * @param {string} tableName The name of the table on DynamoDB
 * @returns {boolean} true if the table exists on DynamoDB
 */
function tableExists (tableName) {
  const res = runAWS('dynamodb list-tables')
  const listOfTables = JSON.parse(res.stdout).TableNames
  return listOfTables.includes(tableName)
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
  if (!this.results) {
    this.results = {}
  }
  return dynamoItem
})

Given('table {string} exists on dynamo', function (tableName) {
  if (!this.results) {
    this.results = {}
  }
  tableName = fillTemplate(tableName, this.results)
  assert(tableExists(tableName), 'The table ' + tableName + ' does not exist on dynamoDB'
  )
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
function dynamoQuery (activeArgs, additionalArgs) {
  const dynamoArgs = {}
  Object.assign(dynamoArgs, this.results)
  Object.assign(dynamoArgs, activeArgs)

  const args = ['dynamodb', 'query']
  if (!dynamoArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb query is required")
  }
  args.push('--table-name', dynamoArgs.tableName)
  if (!dynamoArgs.keyConditionExpression) {
    throw new Error(
      "The 'keyConditionExpression' for dynamodb query is required"
    )
  }
  args.push('--key-condition-expression', dynamoArgs.keyConditionExpression)

  if (dynamoArgs.filterExpression) {
    args.push('--filter-expression', dynamoArgs.filterExpression)
  }
  if (dynamoArgs.projectionExpression) {
    args.push('--projection-expression', dynamoArgs.projectionExpression)
  }
  if (dynamoArgs.indexName) {
    args.push('--index-name', dynamoArgs.indexName)
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
  if (dynamoArgs.expressionAttributeNames) {
    args.push(
      '--expression-attribute-names',
      dynamoArgs.expressionAttributeNames
    )
  }
  if (additionalArgs) {
    args.push(...additionalArgs)
  }
  this.attach(`Query: ${args}`)
  this.results.lastRun = JSON.parse(runAWS(args).stdout).Items
  this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
}

/**
 * Extracts variables for dynamodb query and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the query
 */
function performDynamoDBQueryFromJSON (payload) {
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
  dynamoQuery.call(this, activeArgs, additionalArgs)
}

/**
 * Gets a query / item from a dynamoDB table
 */
When('dynamodb query from {jsonObject} is performed', function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb query based on the provided docstring and variables already defined
 */
When('perform dynamodb query:', function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(fillTemplate(docString, this.results))
  performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
When('dynamodb query is performed', function () {
  dynamoQuery.call(this)
})

/**
 * Places an item on a dynamoDB table
 * @param {Array} additionalArgs pairs of strings that will be added to the aws cli
 * @return {JSON} The placed dynamodb item and its values
 */
function putItem (activeArgs, additionalArgs) {
  const dynamoArgs = {}
  Object.assign(dynamoArgs, this.results)
  Object.assign(dynamoArgs, activeArgs)

  const args = ['dynamodb', 'put-item']
  if (!dynamoArgs.tableName) {
    throw new Error("The 'tableName' for dynamodb put-item is required")
  }
  args.push('--table-name', dynamoArgs.tableName)
  if (!dynamoArgs.item) {
    throw new Error("The 'item' for dynamodb put-item is required")
  }
  if (dynamoArgs.item === 'string') {
    dynamoArgs.item = JSON.parse(dynamoArgs.item)
  }
  args.push('--item', JSON.stringify(dynamoArgs.item))
  args.push('--return-values', 'ALL_OLD')
  if (additionalArgs) {
    args.push(...additionalArgs)
  }
  this.attach(`Query: ${args}`)
  this.results.lastRun = JSON.parse(runAWS(args).stdout.toString())
  this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
}

/**
 * Extracts variables for dynamodb put-item and preforms the aws command
 * @param {JSON} payload an object containing keys / values for the put-item
 */
function performDynamoDBPutItemFromJSON (payload) {
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
When('dynamodb put-item from {jsonObject} is performed', function (payload) {
  payload = performJSONObjectTransform.call(this, payload)
  performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb query based on the provided docstring and variables already defined
 */
When('perform dynamodb put-item:', function (docString) {
  if (!this.results) {
    this.results = {}
  }
  const payload = JSON.parse(fillTemplate(docString, this.results))
  performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
When('dynamodb put-item is performed', function () {
  putItem.call(this)
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
