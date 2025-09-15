const { setDefaultTimeout } = require('@cucumber/cucumber')
const { performJSONObjectTransform, MAFWhen, fillTemplate } = require('@ln-maf/core')
const {
    DynamoDBClient,
    ListTablesCommand,
    QueryCommand,
    PutItemCommand,
    UpdateItemCommand,
    DeleteItemCommand
} = require('@aws-sdk/client-dynamodb')

// Constants
const TIMEOUT_MINUTES = 15
const LOCALSTACK_PORT = 4566
const BASE64_REGEX = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

// DynamoDB attribute types
const DYNAMO_TYPES = {
    STRING: 'S',
    NUMBER: 'N',
    BOOLEAN: 'BOOL',
    BINARY: 'B',
    MAP: 'M'
}

// Return value options
const RETURN_VALUES = {
    ALL_OLD: 'ALL_OLD',
    ALL_NEW: 'ALL_NEW'
}

// Set timeout to 15 minutes for long-running operations
setDefaultTimeout(TIMEOUT_MINUTES * 60 * 1000)

const DynamoDBClientConfig = { maxAttempts: 3 }

// Configure LocalStack endpoint if running in LocalStack environment
if (process.env.AWSENV && process.env.AWSENV.toUpperCase() === 'LOCALSTACK') {
    DynamoDBClientConfig.endpoint = process.env.LOCALSTACK_HOSTNAME
        ? `http://${process.env.LOCALSTACK_HOSTNAME}:${LOCALSTACK_PORT}`
        : 'http://localhost:4566'
    DynamoDBClientConfig.region = 'us-east-1'
    DynamoDBClientConfig.credentials = {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
}

const dbClient = new DynamoDBClient(DynamoDBClientConfig)

/**
 * Returns true if the table exists on DynamoDB
 * @param {string} tableName The name of the table on DynamoDB
 * @returns {Promise<boolean>} Promise that resolves to true if the table exists
 * @throws {Error} If tableName is not provided or is invalid
 */
async function tableExists(tableName) {
    if (!tableName || typeof tableName !== 'string') {
        throw new Error('Table name must be a non-empty string')
    }

    let res = {}
    let tables = []

    do {
        const command = res.LastEvaluatedTableName
            ? new ListTablesCommand({ ExclusiveStartTableName: res.LastEvaluatedTableName })
            : new ListTablesCommand({})

        res = await dbClient.send(command)
        tables = tables.concat(res.TableNames || [])
    } while (res.LastEvaluatedTableName)

    return tables.includes(tableName)
}

/**
 * Cleans the JSON item received from DynamoDB into a readable format
 * @param {string|Object} jsonItem A JSON item with contents from DynamoDB
 * @returns {Object|Array} A cleaned JSON object or array
 * @throws {Error} If jsonItem is invalid JSON string
 */
function cleanDynamoQuery(jsonItem) {
    if (typeof jsonItem === 'string') {
        try {
            jsonItem = JSON.parse(jsonItem)
        } catch (error) {
            throw new Error(`Invalid JSON string provided: ${error.message}`)
        }
    }

    // Handle DynamoDB response format with Item property
    if (jsonItem && jsonItem.Item) {
        jsonItem = jsonItem.Item
    }

    // Process array of items
    if (Array.isArray(jsonItem)) {
        return jsonItem.map(item => cleanSingleDynamoItem(item))
    }

    // Process single item
    return cleanSingleDynamoItem(jsonItem)
}

/**
 * Cleans a single DynamoDB item by extracting values from type descriptors
 * @param {Object} item Single DynamoDB item
 * @returns {Object} Cleaned item with extracted values
 */
function cleanSingleDynamoItem(item) {
    if (!item || typeof item !== 'object') {
        return item
    }

    const cleanedItem = {}
    Object.keys(item).forEach((key) => {
        const attributeValue = item[key]
        if (attributeValue && typeof attributeValue === 'object') {
            // Extract the actual value from DynamoDB type descriptor
            const typeKeys = Object.keys(attributeValue)
            if (typeKeys.length > 0) {
                cleanedItem[key] = attributeValue[typeKeys[0]]
            }
        } else {
            cleanedItem[key] = attributeValue
        }
    })

    return cleanedItem
}

MAFWhen('{jsonObject} is cleaned', function (payload) {
    payload = JSON.stringify(performJSONObjectTransform.call(this, payload))
    const cleanedItem = cleanDynamoQuery(payload)
    return cleanedItem
})

/**
 * Converts a JSON object to AWS DynamoDB format for uploading
 * Supports strings, numbers, booleans, and base64 encoded binary data
 * @param {string|Object} jsonItem A JSON object to convert
 * @returns {Object} DynamoDB formatted item
 * @throws {Error} If jsonItem is invalid JSON string
 */
function convertToDynamoItem(jsonItem) {
    if (typeof jsonItem === 'string') {
        try {
            jsonItem = JSON.parse(jsonItem)
        } catch (error) {
            throw new Error(`Invalid JSON string provided: ${error.message}`)
        }
    }

    if (!jsonItem || typeof jsonItem !== 'object') {
        throw new Error('Input must be a valid object')
    }

    const convertedItem = {}

    Object.keys(jsonItem).forEach((key) => {
        const value = jsonItem[key]
        const dynamoAttribute = convertValueToDynamoType(value)
        convertedItem[key] = dynamoAttribute
    })

    return convertedItem
}

/**
 * Converts a single value to DynamoDB attribute format
 * @param {*} value The value to convert
 * @returns {Object} DynamoDB attribute object
 */
function convertValueToDynamoType(value) {
    // Handle boolean values
    if (typeof value === 'boolean') {
        return { [DYNAMO_TYPES.BOOLEAN]: value }
    }

    // Handle number values (including string numbers)
    if (typeof value === 'number' || !isNaN(value)) {
        return { [DYNAMO_TYPES.NUMBER]: String(value) }
    }

    // Handle string values
    if (typeof value === 'string') {
        // Check if it's base64 encoded
        if (BASE64_REGEX.test(value)) {
            return { [DYNAMO_TYPES.BINARY]: value }
        }
        return { [DYNAMO_TYPES.STRING]: value }
    }

    // Handle objects (Map type)
    if (value && typeof value === 'object' && value.constructor === {}.constructor) {
        return { [DYNAMO_TYPES.MAP]: String(value) }
    }

    // Default to string for other types
    return { [DYNAMO_TYPES.STRING]: String(value) }
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
 * Gets JSON items from DynamoDB using query operation
 *
 * Required parameters:
 * - tableName: The name of the DynamoDB table
 * - keyConditionExpression: The key condition for the query
 *
 * Optional parameters:
 * - filterExpression: Additional filter for the query
 * - expressionAttributeNames: Attribute name placeholders
 * - expressionAttributeValues: Attribute value placeholders
 * - projectionExpression: Attributes to retrieve
 * - scanIndexForward: Sort order for results
 * - indexName: Global secondary index name
 * - limit: Maximum number of items to return
 *
 * @param {Object} activeArgs Supported arguments for the AWS QueryCommand
 * @param {Object} additionalArgs Additional arguments for AWS QueryCommand
 * @returns {Promise<Array>} Array of items from AWS DynamoDB
 * @throws {Error} If required parameters are missing
 */
async function dynamoQuery(activeArgs = {}, additionalArgs = {}) {
    const dynamoQueryArgs = {}

    // Merge context results with provided arguments
    if (this.results) {
        Object.assign(dynamoQueryArgs, this.results)
    }
    Object.assign(dynamoQueryArgs, activeArgs)

    // Validate required parameters
    if (!dynamoQueryArgs.tableName) {
        throw new Error("Required parameter 'tableName' is missing for DynamoDB query")
    }

    if (!dynamoQueryArgs.keyConditionExpression) {
        throw new Error("Required parameter 'keyConditionExpression' is missing for DynamoDB query")
    }

    let lastEvaluatedKey
    let allResults = []
    const userLimit = dynamoQueryArgs.limit ? parseInt(dynamoQueryArgs.limit, 10) : null

    do {
        const queryParameters = buildQueryParameters(dynamoQueryArgs, additionalArgs, lastEvaluatedKey)
        
        // If we have a user-specified limit, adjust the DynamoDB Limit parameter
        // to avoid fetching more items than needed
        if (userLimit !== null) {
            const remainingItems = userLimit - allResults.length
            if (remainingItems <= 0) {
                break
            }
            // Set DynamoDB's Limit to the minimum of what's remaining and what's requested
            queryParameters.Limit = queryParameters.Limit ? Math.min(remainingItems, queryParameters.Limit) : remainingItems
        }

        // Log parameters on first iteration only
        if (!lastEvaluatedKey) {
            this.attach(JSON.stringify(queryParameters))
        }

        const queryResults = await dbClient.send(new QueryCommand(queryParameters))
        const newItems = queryResults.Items || []
        
        // If we have a user limit, only add items up to that limit
        if (userLimit !== null) {
            const itemsToAdd = newItems.slice(0, userLimit - allResults.length)
            allResults = allResults.concat(itemsToAdd)
            
            // Stop if we've reached the user-specified limit
            if (allResults.length >= userLimit) {
                break
            }
        } else {
            allResults = allResults.concat(newItems)
        }
        
        lastEvaluatedKey = queryResults.LastEvaluatedKey
    } while (lastEvaluatedKey)

    return allResults
}

/**
 * Builds query parameters object for DynamoDB QueryCommand
 * @param {Object} queryArgs Query arguments from context and inputs
 * @param {Object} additionalArgs Additional arguments to merge
 * @param {Object} lastEvaluatedKey Pagination key for continued queries
 * @returns {Object} Complete query parameters object
 */
function buildQueryParameters(queryArgs, additionalArgs, lastEvaluatedKey) {
    const queryParameters = {
        TableName: queryArgs.tableName,
        KeyConditionExpression: queryArgs.keyConditionExpression
    }

    // Add optional parameters if they exist
    const optionalParams = [
        'filterExpression',
        'projectionExpression',
        'scanIndexForward',
        'indexName',
        'limit'
    ]

    optionalParams.forEach(param => {
        if (queryArgs[param] !== undefined) {
            queryParameters[toPascalCase(param)] = queryArgs[param]
        }
    })

    // Handle expression attribute values
    if (queryArgs.expressionAttributeValues) {
        queryParameters.ExpressionAttributeValues = typeof queryArgs.expressionAttributeValues === 'string'
            ? JSON.parse(queryArgs.expressionAttributeValues)
            : queryArgs.expressionAttributeValues
    }

    // Handle expression attribute names
    if (queryArgs.expressionAttributeNames) {
        queryParameters.ExpressionAttributeNames = queryArgs.expressionAttributeNames
    }

    // Add pagination key if continuing query
    if (lastEvaluatedKey) {
        queryParameters.ExclusiveStartKey = lastEvaluatedKey
    }

    // Merge any additional arguments
    if (additionalArgs && Object.keys(additionalArgs).length > 0) {
        Object.assign(queryParameters, additionalArgs)
    }

    return queryParameters
}

/**
 * Converts camelCase to PascalCase for AWS parameter names
 * @param {string} str String to convert
 * @returns {string} PascalCase string
 */
function toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Extracts variables for dynamodb query and performs the aws command
 * @param {JSON} payload an object containing keys / values for the query
 */
async function performDynamoDBQueryFromJSON(payload) {
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
        case 'limit':
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
    const payload = JSON.parse(fillTemplate(docString, this.results))
    return await performDynamoDBQueryFromJSON.call(this, payload)
})

/**
 * Gets a query / item from a dynamoDB table
 */
MAFWhen('dynamodb query is performed', async function () {
    return await dynamoQuery.call(this)
})

/**
 * Places an item in a DynamoDB table
 *
 * Required parameters:
 * - tableName: The name of the DynamoDB table
 * - item: The item to insert (as DynamoDB formatted object)
 *
 * Optional parameters:
 * - expressionAttributeNames: Attribute name placeholders
 * - expressionAttributeValues: Attribute value placeholders
 *
 * @param {Object} activeArgs Supported arguments for the AWS PutItemCommand
 * @param {Object} additionalArgs Additional arguments for AWS PutItemCommand
 * @returns {Promise<Object>} PutItemCommandOutput from AWS SDK
 * @throws {Error} If required parameters are missing
 */
async function putItem(activeArgs = {}, additionalArgs = {}) {
    const putItemArgs = {}

    // Merge context results with provided arguments
    if (this.results) {
        Object.assign(putItemArgs, this.results)
    }
    Object.assign(putItemArgs, activeArgs)

    // Validate required parameters
    if (!putItemArgs.tableName) {
        throw new Error("Required parameter 'tableName' is missing for DynamoDB put-item")
    }

    if (!putItemArgs.item) {
        throw new Error("Required parameter 'item' is missing for DynamoDB put-item")
    }

    const queryParameters = {
        TableName: putItemArgs.tableName,
        Item: typeof putItemArgs.item === 'string'
            ? JSON.parse(putItemArgs.item)
            : putItemArgs.item,
        ReturnValues: RETURN_VALUES.ALL_OLD
    }

    // Add optional expression attributes
    if (putItemArgs.expressionAttributeValues) {
        queryParameters.ExpressionAttributeValues = typeof putItemArgs.expressionAttributeValues === 'string'
            ? JSON.parse(putItemArgs.expressionAttributeValues)
            : putItemArgs.expressionAttributeValues
    }

    if (putItemArgs.expressionAttributeNames) {
        queryParameters.ExpressionAttributeNames = putItemArgs.expressionAttributeNames
    }

    // Merge any additional arguments
    if (additionalArgs && Object.keys(additionalArgs).length > 0) {
        Object.assign(queryParameters, additionalArgs)
    }

    this.attach(JSON.stringify(queryParameters))
    return await dbClient.send(new PutItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb put-item and performs the aws command
 * @param {JSON} payload an object containing keys / values for the put-item
 */
async function performDynamoDBPutItemFromJSON(payload) {
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
 * Puts an item from a dynamoDB table
 */
MAFWhen('dynamodb put-item from {jsonObject} is performed', async function (payload) {
    payload = performJSONObjectTransform.call(this, payload)
    return await performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Performs a dynamodb put-item based on the provided docstring and variables already defined
 */
MAFWhen('perform dynamodb put-item:', async function (docString) {
    if (!this.results) {
        this.results = {}
    }
    const payload = JSON.parse(fillTemplate(docString, this.results))
    return await performDynamoDBPutItemFromJSON.call(this, payload)
})

/**
 * Puts an item from a dynamoDB table
 */
MAFWhen('dynamodb put-item is performed', async function () {
    return await putItem.call(this)
})

/**
 * Updates an item in a DynamoDB table
 *
 * Required parameters:
 * - tableName: The name of the DynamoDB table
 * - key: The primary key of the item to update (as DynamoDB formatted object)
 *
 * Optional parameters:
 * - updateExpression: The update expression
 * - expressionAttributeNames: Attribute name placeholders
 * - expressionAttributeValues: Attribute value placeholders
 *
 * @param {Object} activeArgs Supported arguments for the AWS UpdateItemCommand
 * @param {Object} additionalArgs Additional arguments for AWS UpdateItemCommand
 * @returns {Promise<Object>} UpdateItemCommandOutput from AWS SDK
 * @throws {Error} If required parameters are missing
 */
async function updateItem(activeArgs = {}, additionalArgs = {}) {
    const updateItemArgs = {}

    // Merge context results with provided arguments
    if (this.results) {
        Object.assign(updateItemArgs, this.results)
    }
    Object.assign(updateItemArgs, activeArgs)

    // Validate required parameters
    if (!updateItemArgs.tableName) {
        throw new Error("Required parameter 'tableName' is missing for DynamoDB update-item")
    }

    if (!updateItemArgs.key) {
        throw new Error("Required parameter 'key' is missing for DynamoDB update-item")
    }

    const queryParameters = {
        TableName: updateItemArgs.tableName,
        Key: typeof updateItemArgs.key === 'string'
            ? JSON.parse(updateItemArgs.key)
            : updateItemArgs.key,
        ReturnValues: RETURN_VALUES.ALL_NEW
    }

    // Add optional parameters
    if (updateItemArgs.updateExpression) {
        queryParameters.UpdateExpression = updateItemArgs.updateExpression
    }

    if (updateItemArgs.expressionAttributeValues) {
        queryParameters.ExpressionAttributeValues = typeof updateItemArgs.expressionAttributeValues === 'string'
            ? JSON.parse(updateItemArgs.expressionAttributeValues)
            : updateItemArgs.expressionAttributeValues
    }

    if (updateItemArgs.expressionAttributeNames) {
        queryParameters.ExpressionAttributeNames = updateItemArgs.expressionAttributeNames
    }

    // Merge any additional arguments
    if (additionalArgs && Object.keys(additionalArgs).length > 0) {
        Object.assign(queryParameters, additionalArgs)
    }

    this.attach(JSON.stringify(queryParameters))
    return await dbClient.send(new UpdateItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb update-item and performs the aws command
 * @param {JSON} payload an object containing keys / values for the query
 */
async function performDynamoDBUpdateFromJSON(payload) {
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
    const payload = JSON.parse(fillTemplate(docString, this.results))
    return await performDynamoDBUpdateFromJSON.call(this, payload)
})

/**
 * Updates an item from a dynamoDB table
 */
MAFWhen('dynamodb update-item is performed', async function () {
    return await updateItem.call(this)
})

/**
 * Deletes an item from a DynamoDB table
 *
 * Required parameters:
 * - tableName: The name of the DynamoDB table
 * - key: The primary key of the item to delete (as DynamoDB formatted object)
 *
 * Optional parameters:
 * - expressionAttributeNames: Attribute name placeholders
 * - expressionAttributeValues: Attribute value placeholders
 *
 * @param {Object} activeArgs Supported arguments for the AWS DeleteItemCommand
 * @param {Object} additionalArgs Additional arguments for AWS DeleteItemCommand
 * @returns {Promise<Object>} DeleteItemCommandOutput from AWS SDK
 * @throws {Error} If required parameters are missing
 */
async function deleteItem(activeArgs = {}, additionalArgs = {}) {
    const deleteItemArgs = {}

    // Merge context results with provided arguments
    if (this.results) {
        Object.assign(deleteItemArgs, this.results)
    }
    Object.assign(deleteItemArgs, activeArgs)

    // Validate required parameters
    if (!deleteItemArgs.tableName) {
        throw new Error("Required parameter 'tableName' is missing for DynamoDB delete-item")
    }

    if (!deleteItemArgs.key) {
        throw new Error("Required parameter 'key' is missing for DynamoDB delete-item")
    }

    const queryParameters = {
        TableName: deleteItemArgs.tableName,
        Key: typeof deleteItemArgs.key === 'string'
            ? JSON.parse(deleteItemArgs.key)
            : deleteItemArgs.key,
        ReturnValues: RETURN_VALUES.ALL_OLD
    }

    // Add optional expression attributes
    if (deleteItemArgs.expressionAttributeValues) {
        queryParameters.ExpressionAttributeValues = typeof deleteItemArgs.expressionAttributeValues === 'string'
            ? JSON.parse(deleteItemArgs.expressionAttributeValues)
            : deleteItemArgs.expressionAttributeValues
    }

    if (deleteItemArgs.expressionAttributeNames) {
        queryParameters.ExpressionAttributeNames = deleteItemArgs.expressionAttributeNames
    }

    // Merge any additional arguments
    if (additionalArgs && Object.keys(additionalArgs).length > 0) {
        Object.assign(queryParameters, additionalArgs)
    }

    this.attach(JSON.stringify(queryParameters))
    return await dbClient.send(new DeleteItemCommand(queryParameters))
}

/**
 * Extracts variables for dynamodb delete-item and performs the aws command
 * @param {JSON} payload an object containing keys / values for the deletion
 */
async function performDynamoDBDeleteFromJSON(payload) {
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
    const payload = JSON.parse(fillTemplate(docString, this.results))
    return await performDynamoDBDeleteFromJSON.call(this, payload)
})

/**
 * Deletes an item from a dynamoDB table
 */
MAFWhen('dynamodb delete-item is performed', async function () {
    return await deleteItem.call(this)
})
