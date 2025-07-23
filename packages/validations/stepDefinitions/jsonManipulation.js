require('@ln-maf/core/parameter_types')

const { When, Then } = require('@cucumber/cucumber')
const chai = require('chai')
const assert = chai.assert
const { fillTemplate } = require('@ln-maf/core')
const { MAFWhen, tryAttach, performJSONObjectTransform } = require('@ln-maf/core')

/**
 * Removes keys from a json object
 * @param {string} jsonKey the key/s to remove from the JSON object
 * @param {JSON} object A JSON object
 * @returns true if the key was successfully removed
 */
function jsonDeleteKey(jsonKey, object) {
    const original = JSON.parse(JSON.stringify(object))
    const keys = jsonKey.split('.')
    let currentItem = object

    for (let i = 0; i < keys.length - 1; i++) {
        if (!currentItem[keys[i]]) {
            currentItem[keys[i]] = {}
        }
        currentItem = currentItem[keys[i]]
    }
    delete currentItem[keys[keys.length - 1]]
    delete object[jsonKey]
    assert.notDeepEqual(object, original)
    return true
}

/**
 * Pulls the JSON keys from a JSON object into a new, smaller JSON object
 * @param {JSON} sourceJSON The source JSON object to preform whitelist on
 * @param {string[]} whitelist A list of keys to keep from sourceJSON
 * @param {string} separator A one character string to signal a split
 * @returns A new filtered JSON object
 */
function whitelistJson(sourceJSON, whitelist, separator) {
    const object = {}

    for (let i = 0, length = whitelist.length; i < length; ++i) {
        let k = 0
        const names = whitelist[i].split(separator || '.')
        let value = sourceJSON
        let name
        const count = names.length
        let ref = object
        while (k < count - 1) {
            name = names[k++]
            value = value[name]
            ref[name] = {}
            ref = ref[name]
        }
        ref[names[count - 1]] = value[names[count - 1]]
    }
    return object
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
    assert(jsonDeleteKey.call(this, jsonpath, obj, 'Could not delete key'))
    return obj
})

/**
 * Returns the JSON key from a variable to lastRun
 */
MAFWhen('JSON key {string} is extracted from {jsonObject}', function (jsonPath, jsonObject) {
    jsonPath = fillTemplate(jsonPath, this.results)
    jsonObject = performJSONObjectTransform.call(this, jsonObject)
    let value = jsonObject
    for (const key of jsonPath.split('.')) {
        if (key.includes('[') && key.includes(']')) {
            const index = key.match(/\[(.*?)\]/)[1]
            const arrayKey = key.split('[')[0]
            if (value && value[arrayKey]) {
                value = value[arrayKey][index]
            } else {
                value = undefined
            }
        } else {
            if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                value = value[key]
            } else {
                value = undefined
            }
        }
        if (value === undefined) {
            break
        }
    }
    return value === undefined ? 'undefined' : value
})

/**
 * Returns the JSON key from a variable {jsonObject} to lastRun
 */
MAFWhen('JSON keys {string} are extracted from {jsonObject}', function (array, variable) {
    const obj = performJSONObjectTransform.call(this, variable)
    array = fillTemplate(array, this.results)
    try {
        array = JSON.parse(array)
    } catch (e) {
        array = array.replace('[', '')
        array = array.replace(']', '')
        array = array.split(',')
        array = array.map(i => i.trim())
    }
    return whitelistJson.call(this, obj, array)
})

MAFWhen('run json path {string} on {jsonObject}', function (jPath, jsonObject) {
    fillTemplate(jPath, this.results)
    const jp = require('jsonpath')
    const obj = performJSONObjectTransform.call(this, jsonObject)
    return jp.query(obj, jPath)
})

function lowerCaseItemKeys(item) {
    Object.keys(item).forEach(i => {
        if (i.toLowerCase() !== i) {
            item[i.toLowerCase()] = item[i]
            delete item[i]
        }
        if (typeof item[i.toLowerCase()] === 'object') {
            lowerCaseItemKeys(item[i.toLowerCase()])
        }
    })
}

When('make json keys for item {string} lower case', function (item) {
    item = fillTemplate(item, this.results)
    lowerCaseItemKeys(this.results[item])
    tryAttach.call(this, this.results[item])
})

function flatten(item, res) {
    Object.keys(item).forEach(i => {
        if (typeof item[i] === 'object') { flatten(item[i], res) } else { res[i] = item[i] }
    })
}

When('json item {string} is flattened', function (item) {
    const res = {}
    flatten(this.results[item], res)
    this.results[item] = res
    tryAttach.call(this, this.results[item])
})

function numberify(item) {
    Object.keys(item).forEach(i => {
        if (typeof item[i] === 'object') { numberify(item[i]) } else if (typeof item[i] === 'string') {
            const intVal = Number(item[i])
            if (!Number.isNaN(intVal)) { item[i] = intVal }
        }
    })
}

When('json item {string} is numberifyed', function (item) {
    numberify(this.results[item])
    tryAttach.call(this, this.results[item])
})

const trimIt = function (item) {
    Object.keys(item).forEach(i => {
        if (typeof item[i] === 'object') {
            trimIt(item[i])
        } else if (typeof item[i] === 'string') { item[i] = item[i].trim() }
    })
}

When('json item {string} is trimmed', function (item) {
    trimIt(this.results[item])
    tryAttach.call(this, this.results[item])
})

Then('element {string} does not exist in {jsonObject}', function (element, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    element = fillTemplate(element, this.results)
    assert.doesNotHaveAnyKeys(obj, [element])
})

Then('element {string} exists in {jsonObject}', function (element, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    element = fillTemplate(element, this.results)
    assert.containsAllKeys(obj, [element])
})

Then('elements {string} do not exist in {jsonObject}', function (element, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    try {
        element = JSON.parse(element)
    } catch (e) {
        element = element.replace('[', '')
        element = element.replace(']', '')
        element = element.split(',')
        element = element.map(i => i.trim())
    }
    assert.doesNotHaveAnyKeys(obj, element)
})

Then('elements {string} exist in {jsonObject}', function (element, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    element = fillTemplate(element, this.results)
    try {
        element = JSON.parse(element)
    } catch (e) {
        element = element.replace('[', '')
        element = element.replace(']', '')
        element = element.split(',')
        element = element.map(i => i.trim())
    }
    assert.containsAllKeys(obj, element)
})
