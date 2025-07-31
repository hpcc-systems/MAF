require('@ln-maf/core/parameter_types')

const { When, Then } = require('@cucumber/cucumber')
const chai = require('chai')
const assert = chai.assert
const Ajv = require('ajv')
const { fillTemplate } = require('@ln-maf/core')
const { MAFWhen, tryAttach, performJSONObjectTransform } = require('@ln-maf/core')

const ajv = new Ajv()

/**
 * Utility function to parse array strings consistently
 * @param {string} arrayString - String representation of an array
 * @returns {string[]} Parsed array
 */
function parseArrayString(arrayString) {
    try {
        return JSON.parse(arrayString)
    } catch {
        return arrayString
            .replace(/^\[/, '')
            .replace(/\]$/, '')
            .split(',')
            .map(item => item.trim())
    }
}

/**
 * Removes keys from a JSON object using dot notation
 * @param {string} jsonKey - The key path to remove from the JSON object (supports dot notation and array indices)
 * @param {Object} object - A JSON object
 * @returns {boolean} true if the key was successfully removed
 */
function jsonDeleteKey(jsonKey, object) {
    if (!object || typeof object !== 'object' || Array.isArray(object)) {
        return false
    }

    const original = JSON.parse(JSON.stringify(object))
    const keys = jsonKey.split('.')
    let currentItem = object

    // Navigate to the parent of the key to delete
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        
        if (key.includes('[') && key.includes(']')) {
            const match = key.match(/^(.+?)\[(\d+)\]$/)
            if (!match) {
                return false
            }
            const [, arrayKey, index] = match
            if (currentItem && currentItem[arrayKey] && Array.isArray(currentItem[arrayKey])) {
                currentItem = currentItem[arrayKey][parseInt(index, 10)]
            } else {
                return false
            }
        } else {
            if (!currentItem[key] || typeof currentItem[key] !== 'object') {
                return false // Path doesn't exist or is not an object
            }
            currentItem = currentItem[key]
        }
    }

    // Delete the final key (handle array indexing in final key too)
    const finalKey = keys[keys.length - 1]
    if (finalKey.includes('[') && finalKey.includes(']')) {
        const match = finalKey.match(/^(.+?)\[(\d+)\]$/)
        if (!match) {
            return false
        }
        const [, arrayKey, index] = match
        if (currentItem && currentItem[arrayKey] && Array.isArray(currentItem[arrayKey])) {
            if (parseInt(index, 10) < currentItem[arrayKey].length) {
                currentItem[arrayKey].splice(parseInt(index, 10), 1)
                assert.notDeepEqual(object, original)
                return true
            }
        }
        return false
    } else {
        if (finalKey in currentItem) {
            delete currentItem[finalKey]
            assert.notDeepEqual(object, original)
            return true
        }
        return false
    }
}

/**
 * Pulls the JSON keys from a JSON object into a new, smaller JSON object
 * @param {Object} sourceJSON - The source JSON object to perform whitelist on
 * @param {string[]} whitelist - A list of keys to keep from sourceJSON
 * @param {string} [separator='.'] - A one character string to signal a split
 * @returns {Object} A new filtered JSON object
 */
function whitelistJson(sourceJSON, whitelist, separator = '.') {
    if (!sourceJSON || typeof sourceJSON !== 'object' || !Array.isArray(whitelist)) {
        return {}
    }

    const result = {}

    for (const keyPath of whitelist) {
        const keys = keyPath.split(separator)
        let sourceValue = sourceJSON
        let targetRef = result

        // Navigate through the key path
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i]
            if (!sourceValue || typeof sourceValue !== 'object' || !(key in sourceValue)) {
                break // Path doesn't exist in source
            }
            sourceValue = sourceValue[key]

            if (!(key in targetRef)) {
                targetRef[key] = {}
            }
            targetRef = targetRef[key]
        }

        // Set the final value if the path exists
        const finalKey = keys[keys.length - 1]
        if (sourceValue && typeof sourceValue === 'object' && finalKey in sourceValue) {
            targetRef[finalKey] = sourceValue[finalKey]
        }
    }

    return result
}

/**
 * Removes the JSON key/value from the JSON Object provided
 */
MAFWhen('JSON key {string} is removed from {jsonObject}', function (jsonpath, jsonObject) {
    jsonpath = fillTemplate(jsonpath, this.results)
    let obj = performJSONObjectTransform.call(this, jsonObject)
    if (typeof obj === 'string') {
        obj = this.results[obj]
    }
    const success = jsonDeleteKey(jsonpath, obj)
    assert(success, 'Could not delete key: ' + jsonpath)
    return obj
})

/**
 * Extracts a JSON value using dot notation path, supporting array indices
 * @param {string} jsonPath - The path to extract (supports dot notation and array indices like key[0])
 * @param {Object} jsonObject - The source JSON object
 * @returns {any} The extracted value or 'undefined' if not found
 */
function extractJsonValue(jsonPath, jsonObject) {
    if (!jsonObject || typeof jsonObject !== 'object') {
        return 'undefined'
    }

    let value = jsonObject
    const keys = jsonPath.split('.')

    for (const key of keys) {
        if (key.includes('[') && key.includes(']')) {
            const match = key.match(/^(.+?)\[(\d+)\]$/)
            if (!match) {
                return 'undefined'
            }
            const [, arrayKey, index] = match
            if (value && value[arrayKey] && Array.isArray(value[arrayKey])) {
                value = value[arrayKey][parseInt(index, 10)]
            } else {
                return 'undefined'
            }
        } else {
            if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
                value = value[key]
            } else {
                return 'undefined'
            }
        }

        if (value === undefined || value === null) {
            return 'undefined'
        }
    }

    return value
}

/**
 * Returns the JSON key from a variable to lastRun
 */
MAFWhen('JSON key {string} is extracted from {jsonObject}', function (jsonPath, jsonObject) {
    jsonPath = fillTemplate(jsonPath, this.results)
    jsonObject = performJSONObjectTransform.call(this, jsonObject)
    return extractJsonValue(jsonPath, jsonObject)
})

/**
 * Returns the JSON keys from a variable {jsonObject} to lastRun
 */
MAFWhen('JSON keys {string} are extracted from {jsonObject}', function (array, variable) {
    let obj = performJSONObjectTransform.call(this, variable)
    if (typeof obj === 'string') {
        obj = this.results[obj]
    }
    array = fillTemplate(array, this.results)
    const parsedArray = parseArrayString(array)
    return whitelistJson(obj, parsedArray)
})

MAFWhen('run json path {string} on {jsonObject}', function (jPath, jsonObject) {
    jPath = fillTemplate(jPath, this.results)
    const jp = require('jsonpath')
    const obj = performJSONObjectTransform.call(this, jsonObject)
    return jp.query(obj, jPath)
})

/**
 * Recursively converts all object keys to lowercase
 * @param {Object} item - The object to process
 */
function lowerCaseItemKeys(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return
    }

    Object.keys(item).forEach(key => {
        const lowerKey = key.toLowerCase()
        if (lowerKey !== key) {
            item[lowerKey] = item[key]
            delete item[key]
        }
        if (item[lowerKey] && typeof item[lowerKey] === 'object' && !Array.isArray(item[lowerKey])) {
            lowerCaseItemKeys(item[lowerKey])
        }
    })
}

When('make json keys for item {string} lower case', function (item) {
    item = fillTemplate(item, this.results)
    lowerCaseItemKeys(this.results[item])
    tryAttach.call(this, this.results[item])
})

/**
 * Recursively flattens a nested object structure
 * @param {Object} item - The object to flatten
 * @param {Object} result - The result object to populate
 */
function flattenObject(item, result) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return
    }

    Object.keys(item).forEach(key => {
        if (typeof item[key] === 'object' && !Array.isArray(item[key]) && item[key] !== null) {
            flattenObject(item[key], result)
        } else {
            result[key] = item[key]
        }
    })
}

When('json item {string} is flattened', function (item) {
    const result = {}
    flattenObject(this.results[item], result)
    this.results[item] = result
    tryAttach.call(this, this.results[item])
})

/**
 * Recursively converts string values to numbers where possible
 * @param {Object} item - The object to process
 */
function convertToNumbers(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return
    }

    Object.keys(item).forEach(key => {
        if (typeof item[key] === 'object' && !Array.isArray(item[key]) && item[key] !== null) {
            convertToNumbers(item[key])
        } else if (typeof item[key] === 'string') {
            const numericValue = Number(item[key])
            if (!Number.isNaN(numericValue) && isFinite(numericValue)) {
                item[key] = numericValue
            }
        }
    })
}

When('json item {string} is numberifyed', function (item) {
    convertToNumbers(this.results[item])
    tryAttach.call(this, this.results[item])
})

/**
 * Recursively trims whitespace from string values
 * @param {Object} item - The object to process
 */
function trimStringValues(item) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return
    }

    Object.keys(item).forEach(key => {
        if (typeof item[key] === 'object' && !Array.isArray(item[key]) && item[key] !== null) {
            trimStringValues(item[key])
        } else if (typeof item[key] === 'string') {
            item[key] = item[key].trim()
        }
    })
}

When('json item {string} is trimmed', function (item) {
    trimStringValues(this.results[item])
    tryAttach.call(this, this.results[item])
})

/**
 * Checks if a nested path exists in an object (supports dot notation and array indices)
 * @param {string} path - The path to check (supports dot notation and array indices like key[0])
 * @param {Object} object - The source object
 * @returns {boolean} true if the path exists
 */
function pathExists(path, object) {
    if (!object || typeof object !== 'object') {
        return false
    }

    // First check if the path exists as a literal key (handles keys with dots/brackets in their names)
    if (Object.prototype.hasOwnProperty.call(object, path)) {
        return true
    }

    // If the path is a simple key without dots or brackets, and we already checked literal existence
    if (!path.includes('.') && !path.includes('[')) {
        return false
    }

    // For nested paths, use the same logic as extractJsonValue
    let value = object
    const keys = path.split('.')

    for (const key of keys) {
        if (key.includes('[') && key.includes(']')) {
            const match = key.match(/^(.+?)\[(\d+)\]$/)
            if (!match) {
                return false
            }
            const [, arrayKey, index] = match
            if (value && value[arrayKey] && Array.isArray(value[arrayKey])) {
                if (parseInt(index, 10) >= value[arrayKey].length) {
                    return false
                }
                value = value[arrayKey][parseInt(index, 10)]
            } else {
                return false
            }
        } else {
            if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
                value = value[key]
            } else {
                return false
            }
        }

        if (value === undefined || value === null) {
            return false
        }
    }

    return true
}

Then('element {string} does not exist in {jsonObject}', function (element, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    element = fillTemplate(element, this.results)
    assert(!pathExists(element, obj), `Expected path '${element}' to not exist`)
})

Then('element {string} exists in {jsonObject}', function (element, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    element = fillTemplate(element, this.results)
    assert(pathExists(element, obj), `Expected path '${element}' to exist`)
})

Then('elements {string} do not exist in {jsonObject}', function (elementString, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const elements = parseArrayString(elementString)
    assert.doesNotHaveAnyKeys(obj, elements)
})

Then('elements {string} exist in {jsonObject}', function (elementString, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const elements = parseArrayString(fillTemplate(elementString, this.results))
    assert.containsAllKeys(obj, elements)
})

MAFWhen('{jsonObject} is validated against schema {jsonObject}', function (json, schema) {
    json = performJSONObjectTransform.call(this, json)
    schema = performJSONObjectTransform.call(this, schema)

    let schemaName = 'unknown'
    if (schema.value) {
        schemaName = schema.value
    } else if (typeof schema === 'object' && schema !== null) {
        const keys = Object.keys(schema)
        if (keys.length > 0) {
            schemaName = keys[0]
        }
    }

    // Ensure json is an array for consistent processing
    const jsonArray = Array.isArray(json) ? json : [json]

    for (const item of jsonArray) {
        if (!ajv.validate(schema, item)) {
            throw new Error(`The schema '${schemaName}' does not match the provided JSON:\n${JSON.stringify(ajv.errors, null, 2)}`)
        }
    }
})