const { Before } = require('@cucumber/cucumber')
const Cucumber = require('@cucumber/cucumber')
const fs = require('fs')
const chai = require('chai')
const assert = chai.assert
const Given = Cucumber.Given
const When = Cucumber.When
const Then = Cucumber.Then
let world = null
const { fillTemplate } = require('@ln-maf/core')
const { MAFSave, tryAttach, performJSONObjectTransform, applyJSONToString, readFile, writeFile, writeFileBuffer, readFileBuffer, getFilePath, MAFWhen } = require('@ln-maf/core')

Before((scenario) => {
    world = scenario
})
const toISO = d => {
    const val = (Number(d).valueOf())
    if (isNaN(val)) {
        return d
    }
    const date = new Date(val).toISOString()
    return date
}
const setToString = function (location, value, scenario, attach = true) {
    MAFSave.call(scenario, location, applyJSONToString(value, scenario))
}

MAFWhen('run templateString', function (docString) {
    return fillTemplate(docString, this.results)
})

MAFWhen('convert csv {jsonObject} to json', async function (obj) {
    const content = performJSONObjectTransform.call(this, obj)
    const Papa = require('papaparse')
    let res = await Papa.parse(content, {
        header: true
    })
    const keyLength = Object.keys(res.data[0]).length
    res = res.data.filter(i => Object.keys(i).length === keyLength)
    return res
})
// Stub function to test applying parameters to ensure that command line args can be included.
When('parameters are:', function (docString) {
    this.parameters = JSON.parse(docString)
})
MAFWhen('apply parameters', function () {
    Object.assign(this.results, this.parameters)
    tryAttach.call(this, this.parameters)
})

When('set {string} to {jsonObject}', function (location, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    MAFSave.call(this, location, obj)
})
When('set {string} to:', function (location, value) {
    setToString(location, value, this)
})
When('set {string} to', function (location, value) {
    setToString(location, value, this)
})

Then('{jsonObject} {validationsEquivalence} {jsonObject}', function (obj1, equiv, obj2) {
    if (equiv === '=') {
        equiv = '=='
    }
    const obj = Number(performJSONObjectTransform.call(this, obj1))
    obj2 = Number(performJSONObjectTransform.call(this, obj2))
    assert(eval('obj' + equiv + 'obj2'), JSON.stringify(obj) + ' was not ' + equiv + ' ' + JSON.stringify(obj2))
})

Then('{jsonObject} is {timeQualifier} now', function (jsonObject, isBefore) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const functionName = isBefore === 'before' ? 'isBefore' : 'isAfter'
    let dateIn = obj
    dateIn = toISO(dateIn)
    const validator = require('validator')
    assert(validator[functionName](dateIn, new Date().toISOString()), `${dateIn} was not ${isBefore} now`)
})

Then('{jsonObject} is {timeQualifier} {jsonObject}', function (string, isBefore, date) {
    let obj = performJSONObjectTransform.call(this, string)
    let obj2 = performJSONObjectTransform.call(this, date)
    const functionName = isBefore === 'before' ? 'isBefore' : 'isAfter'
    obj = toISO(obj)
    obj2 = toISO(obj2)
    const validator = require('validator')
    assert(validator[functionName](obj, obj2), `${obj} was not ${isBefore} ${obj2}`)
})

Then('{jsonObject} is not null', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    assert.exists(obj)
})
Then('{jsonObject} is null', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    assert.notExists(obj)
})

MAFWhen('run json path {string} on {jsonObject}', function (jPath, jsonObject) {
    const jp = require('jsonpath')
    const obj = performJSONObjectTransform.call(this, jsonObject)
    return jp.query(obj, jPath)
})
const setNamespace = (namespace, scenario) => {
    if (!scenario.results) {
        scenario.results = {}
    }
    if (!scenario.results.namespace) {
        scenario.results.namespace = {}
    }
    scenario.results.namespace = JSON.parse(namespace)
}
Given('xPath namespace is {string}', function (namespace) {
    setNamespace(namespace, this)
})

Given('xPath namespace is', function (namespace) {
    setNamespace(namespace, this)
})

Given('add xPath namespace {string} = {string}', function (namespace, url) {
    if (!this.results) {
        this.results = {}
    }
    if (!this.results.namespace) {
        this.results.namespace = {}
    }
    this.results.namespace[namespace] = url
})

MAFWhen('generate rsa key', function () {
    const crypto = require('crypto')
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    })
    return privateKey
})

MAFWhen('run xPath {string} on item {string}', function (xPath, element) {
    if (!this.results.namespace) {
        this.results.namespace = {}
    }
    const xpath = require('xpath')
    const Dom = require('@xmldom/xmldom').DOMParser
    const doc = new Dom().parseFromString(eval('this.results.' + element))
    const sel = xpath.useNamespaces(this.results.namespace)
    return sel(xPath, doc).map(i => i.toString()).join('\n')
})

const doSetsMatch = (set1, set2, scenario) => {
    const isSetsEqual = (a, b) => a.size === b.size && Array.from(a).every(value => b.has(value))
    const queryResult = new Set(set1.map(json => JSON.stringify(json, null, 2)))
    const expected = new Set(set2.map(json => JSON.stringify(json, null, 2)))
    const difference = {
        queryResult: [...queryResult].filter(x => !expected.has(x)).map(e => JSON.parse(e)),
        expected: [...expected].filter(x => !queryResult.has(x)).map(e => JSON.parse(e))
    }
    const res = isSetsEqual(expected, queryResult)
    const diffedJSON = JSON.stringify(difference, null, 2)
    tryAttach.call(scenario, diffedJSON)
    assert(res, `The difference is: ${diffedJSON}`)
}
const setMatch = function (set1, set2) {
    set1 = this.results[set1]
    set2 = this.results[set2]
    doSetsMatch(set1, set2, this)
}
const setFileMatch = function (set, file) {
    file = readFile(file, this)
    doSetsMatch(applyJSONToString(this.results[set], this), applyJSONToString(file, this), this)
}

/**
 * Removes keys from a json object
 * @param {string} jsonKey the key/s to remove from the JSON object
 * @param {JSON} object A JSON object
 * @returns true if the key was successfully removed
 */
function jsonDeleteKey(jsonKey, object) {
    const original = JSON.parse(JSON.stringify(object))
    eval(`delete object.${jsonKey}`)
    require('chai').assert.notDeepEqual(`${object}`, original)
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
MAFWhen('JSON key {string} is extracted from {jsonObject}', function (jsonpath, jsonObject) {
    let obj = performJSONObjectTransform.call(this, jsonObject)
    if (typeof obj === 'string') {
        obj = eval(`this.results.${obj}`)
    }
    return eval(`obj.${jsonpath}`)
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

/**
 * Replaces the value of all found JSON keys in a file, using the JSON path to identify the keys
 */
When('{string} is written to file {string} on JSON path {string}', function (value, fileName, jsonPath) {
    const jp = require('jsonpath')
    const fileContents = JSON.parse(readFile(fileName, this))
    jp.apply(fileContents, jsonPath, function () { return value })
    writeFile(fileName, JSON.stringify(fileContents), this)
    tryAttach.call(this, fileContents)
})

/**
 * Replaces the value of all found JSON keys in an item, using the JSON path to identify the keys
 */
When('{string} is applied to item {string} on JSON path {string}', function (value, item, jsonPath) {
    const jp = require('jsonpath')
    const fileContents = this.results[item]
    value = fillTemplate(value, this.results)
    if (value.trim() !== '') {
        try {
            const tmp = JSON.parse(value)
            value = tmp
        } catch (e) { }
    }
    jp.apply(fileContents, jsonPath, function () { return value })
    this.results[item] = fileContents
    tryAttach.call(this, this.results[item])
})

When('{jsonObject} is written in json line delimited format to file {string}', function (item, file) {
    let obj = performJSONObjectTransform.call(this, item)
    file = fillTemplate(file, this.results)
    try { obj = JSON.parse(obj) } catch (e) { }
    writeFile(file, obj.map(i => JSON.stringify(i)).join('\n'), this)
})

When('{jsonObject} is written to file {string}', function (jsonObject, file) {
    let obj = performJSONObjectTransform.call(this, jsonObject)
    file = fillTemplate(file, this.results)
    if (typeof (obj) === 'object') {
        obj = JSON.stringify(obj)
    }
    writeFile(file, obj, this)
})

Then('it matches the set from file {string}', function (set1) {
    return setFileMatch.call(this, 'lastRun', set1)
})

Then('the set {string} matches the set from file {string}', function (f, s) {
    const res = setFileMatch.call(this, f, s)
    return res
})

Then('the set {string} matches the set {string}', setMatch)

Then('it matches the set {string}', function (set) {
    return setMatch.call(this, 'lastRun', set)
})

MAFWhen('the file {string} is gzipped', function (filename) {
    filename = fillTemplate(filename, this.results)
    try {
        fs.deleteFileSync(getFilePath(filename, this))
    } catch (e) {
    }
    const zlib = require('zlib')
    const bf = readFileBuffer(filename, this)
    const buffer = zlib.gzipSync(bf)
    writeFileBuffer(filename + '.gz', buffer, this)
    return ''
})

MAFWhen('file {string} is gzip unzipped to file {string}', function (file, fileOut) {
    file = fillTemplate(file, this.results)
    fileOut = fillTemplate(fileOut, this.results)
    const zlib = require('zlib')
    const bf = readFileBuffer(file, this)
    const buffer = zlib.unzipSync(bf)
    writeFileBuffer(fileOut, buffer, this)
    return ''
})

When('set config from json {jsonObject}', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    for (const i in obj) {
        setToString(i, obj[i], this)
    }
})

When('set:', function (dataTable) {
    dataTable = dataTable.rawTable
    const indices = dataTable[0]
    let item = []
    indices.forEach((i, index) => {
        item[index] = []
    })
    dataTable = dataTable.slice(1)
    dataTable.forEach((i) => {
        i.forEach((j, index) => {
            item[index].push(j)
        })
    })
    item = item.map(i => {
        if (i.length === 1) {
            return i[0]
        }
        return i
    })
    indices.forEach((i, index) => {
        setToString(i, item[index], this)
    })
})

MAFWhen('set result to {jsonObject}', function (item) {
    return performJSONObjectTransform.call(this, item)
})

MAFWhen('{jsonObject} is base64 encoded', function (item) {
    item = performJSONObjectTransform.call(this, item)
    if (typeof item !== 'string') {
        item = JSON.stringify(item)
    }
    const encode = (Buffer.from(item, 'ascii').toString('base64'))
    return encode
})

MAFWhen('{jsonObject} is base64 decoded', function (item) {
    item = performJSONObjectTransform.call(this, item)
    assert(typeof item === 'string', 'Item type needs to be a string for base64 decoding, but it was a ' + typeof item)
    const decode = (Buffer.from(item, 'base64').toString('ascii'))
    return decode
})

Then('the value {string} is base64 decoded and resaved', function (item) {
    const unencrypt = (Buffer.from(this.results[item], 'base64').toString('ascii'))
    this.results[item] = unencrypt
    tryAttach.call(this, 'Decoded value: ' + unencrypt)
})

const lowerCaseItemKeys = function (item) {
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
    lowerCaseItemKeys(this.results[item])
    tryAttach.call(this, this.results[item])
})

const flatten = function (item, res) {
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

const numberify = function (item) {
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

Then('{jsonObject} is not equal to {jsonObject}', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    item2 = performJSONObjectTransform.call(this, item2)
    if (typeof item1 === 'object' && typeof item2 === 'object') {
        assert.notDeepEqual(item1, item2)
    } else {
        assert.notEqual(item1, item2)
    }
})

Then('{jsonObject} is equal to {jsonObject}', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    item2 = performJSONObjectTransform.call(this, item2)
    if (typeof item1 === 'object' && typeof item2 === 'object') {
        assert.deepEqual(item1, item2)
    } else {
        assert.equal(item1, item2)
    }
})
Then('{jsonObject} is not equal to:', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    let expected = fillTemplate(item2, this.results)
    try {
        expected = JSON.parse(expected)
    } catch (e) { }
    if (typeof item1 === 'object' && typeof expected === 'object') {
        assert.notDeepEqual(item1, expected)
    } else {
        assert.notEqual(item1, expected)
    }
})

Then('{jsonObject} is equal to:', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    let expected = fillTemplate(item2, this.results)
    try {
        expected = JSON.parse(expected)
    } catch (e) { }
    if (typeof item1 === 'object' && typeof expected === 'object') {
        assert.deepEqual(item1, expected)
    } else {
        assert.equal(item1, expected)
    }
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
const performEncrypt = function () {
    const options = {}
    options.header = this.results.header
    const jwt = require('jsonwebtoken')
    setToString('lastRun', jwt.sign(this.results.jwtPayload, this.results.privateKey, options), this)
}
When('sign item {string} using jwt', function (item) {
    item = fillTemplate(item, this.results)
    item = fillTemplate(this.results[item], this.results)
    setToString('jwtPayload', item, this, false)
    performEncrypt.call(this)
})

When('sign using jwt:', function (docString) {
    setToString('jwtPayload', docString, this, false)
    performEncrypt.call(this)
})

const sleep = {
    msleep: function (n) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n) }
}

When('wait {int} milliseconds', function (milliseconds) {
    sleep.msleep(milliseconds)
})

Given('set examples', async function () {
    // Write code here that turns the phrase above into concrete actions
    const a = world
    const flatten = (acc, cumulator) => {
        if (typeof cumulator === 'undefined') {
            return acc
        }
        if (Array.isArray(cumulator)) { return [...acc, ...cumulator] } else {
            acc.push(cumulator)
            return acc
        }
    }
    let extras = a.pickle.steps.map(i => i.astNodeIds)
    extras = extras.reduce(flatten)
    let examples = a.gherkinDocument.feature.children.map(i => {
        if (!i.scenario) return []
        if (!i.scenario.examples) return []
        return i.scenario.examples.map(
            i => i.tableBody.filter(
                i => extras.includes(i.id)))
    })
        .reduce(flatten, [])
    let res = a.gherkinDocument.feature.children.map(i => {
        if (!i.scenario) return []
        return i.scenario.examples.filter(i => {
            if (!i.tableBody) return []
            return i.tableBody.map(i => extras.includes(i.id)).includes(true)
        })
    }).reduce(flatten, [])
    let headers = res.map(i => i.tableHeader.cells).reduce(flatten, [])
    headers = headers.map(i => i.value)
    examples = examples.reduce(flatten, []).map(i => i.cells).reduce(flatten, []).map(i => i.value)
    res = headers.reduce((prev, curr, i) => {
        prev[curr] = examples[i]
        return prev
    }
    , {})
    if (!this.results) {
        this.results = {}
    }
    const keys = Object.keys(res)
    for (let key in keys) {
        key = keys[key]
        res[key] = fillTemplate(res[key], this.results)
        this.results[key] = res[key]
    }
    tryAttach.call(this, res)
})

Then('{jsonObject} contains {string}', function (jsonObject, checkString) {
    let obj = performJSONObjectTransform.call(this, jsonObject)
    checkString = fillTemplate(checkString, this.results)
    obj = JSON.stringify(obj)
    assert.isTrue(obj.includes(checkString), `String '${checkString}' is not in ${obj}`)
})

Then('{jsonObject} does not contain {string}', function (jsonObject, checkString) {
    let obj = performJSONObjectTransform.call(this, jsonObject)
    checkString = fillTemplate(checkString, this.results)
    obj = JSON.stringify(obj)
    assert.isFalse(obj.includes(checkString), `String '${checkString}' is in ${obj}`)
})
function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length)
    const view = new Uint8Array(ab)
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i]
    }
    return ab
}
MAFWhen('blob is read from file {string}', async function (fileName) {
    let res = readFileBuffer(fileName, this)
    const arrayBuff = toArrayBuffer(res)
    const f = () => arrayBuff
    f.bind(this)
    res = { arrayBuffer: f }
    return res
})

When('blob item {string} is written to file {string}', async function (blob, fileName) {
    blob = fillTemplate(blob, this.results)
    blob = eval('this.results.' + blob)
    const b = Buffer.from(await blob.arrayBuffer())
    writeFile(`${fileName}`, b, this)
})

When('blob item {string} is attached', async function (blob) {
    blob = fillTemplate(blob, this.results)
    blob = eval('this.results.' + blob)
    const b = Buffer.from(await blob.arrayBuffer())
    return this.attach(b, 'image/png')
})
Then('blob item {string} is equal to file {string}', async function (blob, fileName) {
    blob = fillTemplate(blob, this.results)
    blob = eval('this.results.' + blob)
    const b = await blob.arrayBuffer()
    const actualImage = readFileBuffer(`${fileName}`, this)
    assert.isTrue(Buffer.compare(actualImage, Buffer.from(b)) === 0)
})
