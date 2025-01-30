global.fetch = require('node-fetch')
const chai = require('chai')
const assert = chai.assert
const { filltemplate } = require('@ln-maf/core')
const { performJSONObjectTransform, MAFSave, MAFWhen } = require('@ln-maf/core')
const { setDefaultTimeout, Given, Then } = require('@cucumber/cucumber')
const { build, performRequestFromJSON, performRequest } = require('./helpers')

setDefaultTimeout(15 * 1000)

Given('url {string}', function (url) {
    url = url.replace(/\/$/, '')
    build.call(this, url, 'url')
})
Given('api {string}', function (api) {
    api = api.replace(/^\//, '')
    build.call(this, api, 'api')
})

Given('body {string}', function (request) {
    build.call(this, request, 'body')
})

Given('headers {string}', function (headers) {
    build.call(this, headers, 'headers')
})

const performRequestFromJSONString = async function (string) {
    let request
    try {
        request = JSON.parse(filltemplate(string, this.results))
    } catch (e) {
        throw new Error(`Error parsing JSON. Check that JSON format is valid for string: ${string}.\n Error: ${e}`)
    }
    return await performRequestFromJSONMAF.call(this, request)
}

const performRequestFromJSONMAF = async function (request) {
    // fail if request is not an object
    if (typeof request !== 'object') {
        try {
            request = JSON.parse(request)
        } catch (err) {
            throw new Error(`Error parsing JSON. Check that JSON format is valid for string: ${request}.\n Error: ${err}`)
        }
    }
    const res = await performRequestFromJSON.call(this, request)
    MAFSave.call(this, 'response', res.response)
    return res
}

MAFWhen('api request from {jsonObject} is performed', async function (item) {
    item = performJSONObjectTransform.call(this, item)
    return await performRequestFromJSONMAF.call(this, item)
})
MAFWhen('perform api request:', performRequestFromJSONString)
MAFWhen('api request from {jsonObject} is performed with:', async function (reqItem, dataTable) {
    dataTable = dataTable.rawTable
    const indices = dataTable[0]
    let apiItem = []
    indices.forEach((i, index) => {
        apiItem[index] = []
    })
    dataTable = dataTable.slice(1)
    dataTable.forEach((i) => {
        i.forEach((j, index) => {
            apiItem[index].push(j)
        })
    })
    apiItem = apiItem.map(i => {
        if (i.length === 1) {
            return i[0]
        }
        return i
    })
    const extraParams = {}
    extraParams.results = { ...this.results }
    for (let i = 0; i < indices.length; i++) {
    // eslint-disable-next-line no-unused-vars
        const val = filltemplate(apiItem[i], this.results)
        eval(`extraParams.results.${indices[i]} = val`)
    }

    const item = performJSONObjectTransform.call(extraParams, reqItem)
    return await performRequestFromJSONMAF.call(this, item)
})

async function performRequestMAF(method) {
    const res = await performRequest.call(this, method)
    MAFSave.call(this, 'response', res.response)
    return res
}

MAFWhen('method post', async function () {
    return await performRequestMAF.call(this, 'POST')
})
MAFWhen('method get', async function () {
    return await performRequestMAF.call(this, 'GET')
})
Then('the status is ok', function () {
    assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('the status is not ok', function () {
    assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})
Then('status not ok', function () {
    assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})
Then('status ok', function () {
    assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('status {int}', function (int) {
    assert(this.results.lastRun.status === int, `The status ${this.results.lastRun.status} was not ${int}`)
})
Then('the status is {int}', function (int) {
    assert(this.results.lastRun.status === int, `The status ${this.results.lastRun.status} was not ${int}`)
})
