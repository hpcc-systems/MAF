global.fetch = require('node-fetch')
const { MAFWhen, MAFSave, performJSONObjectTransform, fillTemplate, canAttach } = require('@ln-maf/core')
const { setDefaultTimeout, Then } = require('@cucumber/cucumber')

const FormData = require('form-data')
const fs = require('fs')
const assert = require('chai').assert
const { fetchToCurl } = require('fetch-to-curl')

setDefaultTimeout(30 * 1000)

/**
 * @deprecated Set the item 'url' instead
 */
MAFWhen('url {string}', function (url) {
    fillTemplate(url, this.results)
    // Remove trailing slash
    url = url.replace(/\/$/, '')
    MAFSave.call(this, 'url', url)
})

/**
 * @deprecated Set the item 'api' instead
 */
MAFWhen('api {string}', function (api) {
    fillTemplate(api, this.results)
    // Remove leading slash
    api = api.replace(/^\//, '')
    MAFSave.call(this, 'api', api)
})

/**
 * @deprecated Set the item 'body' instead
 */
MAFWhen('body {string}', function (body) {
    fillTemplate(body, this.results)
    MAFSave.call(this, 'body', body)
})

/**
 * @deprecated Set the item 'headers' instead
 */
MAFWhen('headers {string}', function (headers) {
    fillTemplate(headers, this.results)
    MAFSave.call(this, 'headers', headers)
})

/**
 * @deprecated Set the item 'method' to 'POST' and call the method 'api request is performed' instead
 */
MAFWhen('method post', async function () {
    MAFSave.call(this, 'method', 'POST')
    const results = await requestBuilder.call(this, {})
    MAFSave.call(this, 'response', results.response)
    return results
})

/**
 * @deprecated Set the item 'method' to 'GET' and call the method 'api request is performed' instead
 */
MAFWhen('method get', async function () {
    MAFSave.call(this, 'method', 'GET')
    const results = await requestBuilder.call(this, {})
    MAFSave.call(this, 'response', results.response)
    return results
})

// Builds a request object from the given request, populating any missing fields using the results object
async function requestBuilder(request) {
    if (!request.url && this.results && this.results.url) {
        request.url = this.results.url
    }
    if (!request.url) {
        throw new Error('A url must be provided either in the request or in the results object')
    }
    request.url = request.url.replace(/\/$/, '')

    if (!request.headers && this.results && this.results.headers) {
        request.headers = this.results.headers
    }
    if (!request.headers) {
        request.headers = {}
    }
    if (typeof request.headers === 'string') {
        request.headers = JSON.parse(request.headers)
    }

    if (!request.body && this.results && this.results.body) {
        request.body = this.results.body
    }
    if (!request.jsonBody && this.results && this.results.jsonBody) {
        request.jsonBody = this.results.jsonBody
    }
    if (request.jsonBody && typeof request.jsonBody !== 'object') {
        try {
            request.jsonBody = JSON.parse(request.jsonBody)
        } catch (err) {
            throw new Error('The jsonBody could not be parsed as a JSON object')
        }
    }
    // jsonBody has priority over body
    if (request.jsonBody) {
        request.body = request.jsonBody
    }

    if (!request.urlEncodedBody && this.results && this.results.urlEncodedBody) {
        request.urlEncodedBody = this.results.urlEncodedBody
    }
    if (request.urlEncodedBody) {
        const urlEncodedBody = []
        const details = request.urlEncodedBody
        for (const property in details) {
            const encodedKey = encodeURIComponent(property)
            const encodedValue = encodeURIComponent(details[property])
            urlEncodedBody.push(encodedKey + '=' + encodedValue)
        }
        request.api = request.api + '?' + urlEncodedBody.join('&')
    }
    const formBodyMap = function (item) {
        if (item && item.type === 'file') {
            let filePath = item.fileName
            const path = require('path')
            if (!filePath.startsWith('/')) {
                // Try to resolve relative to the test directory
                const testPath = path.join(__dirname, '../test', filePath)
                if (fs.existsSync(testPath)) {
                    filePath = testPath
                } else {
                    // Fallback to local directory if not found in test
                    const localPath = path.join(__dirname, filePath)
                    if (fs.existsSync(localPath)) {
                        filePath = localPath
                    } else {
                        throw new Error(`File for upload not found: ${item.fileName}`)
                    }
                }
            } else if (!fs.existsSync(filePath)) {
                throw new Error(`File for upload not found: ${filePath}`)
            }
            try {
                return fs.createReadStream(filePath)
            } catch (err) {
                throw new Error(`Failed to create read stream for file: ${filePath}. Error: ${err.message}`)
            }
        } else if (item && item.type === 'base64blob') {
            try {
                return Buffer.from(item.base64blob, 'base64')
            } catch (err) {
                throw new Error('Invalid base64blob provided in formBody')
            }
        } else {
            return item
        }
    }
    if (!request.formBody && this.results && this.results.formBody) {
        request.formBody = this.results.formBody
    }

    if (request.formBody) {
        const data = new FormData()
        const details = request.formBody
        for (const property in details) {
            if (Array.isArray(details[property])) {
                details[property].map(formBodyMap.bind(this)).forEach(i => {
                    data.append(property + '[]', i)
                })
            } else {
                data.append(property, formBodyMap.call(this, details[property]))
            }
        }
        request.body = data
    }

    if (!request.method && this.results && this.results.method) {
        request.method = this.results.method
    }
    if (!request.method) {
        throw new Error('A method must be provided either in the request or in the results object')
    }

    if (!request.api && this.results && this.results.api) {
        request.api = this.results.api
    }
    if (request.api) {
        request.api = request.api.replace(/^\//, '')
    }
    if (!request.apiParams && this.results && this.results.apiParams) {
        request.apiParams = this.results.apiParams
    }
    if (request.apiParams) {
        let formBody = []
        const details = request.apiParams
        for (const property in details) {
            const encodedKey = encodeURIComponent(property)
            // Handle nested objects by JSON stringifying them
            const value = typeof details[property] === 'object' && details[property] !== null
                ? JSON.stringify(details[property])
                : details[property]
            const encodedValue = encodeURIComponent(value)
            formBody.push(encodedKey + '=' + encodedValue)
        }
        formBody = formBody.join('&')
        request.api = request.api + '?' + formBody
    }
    let additionalParams = {}
    if (this.results && this.results.api) {
        additionalParams = this.results.api.additionalParams
    }
    return await performRequest.call(this, request, additionalParams)
}

// Performs the given request, returning the response
async function performRequest(request, additionalParams = {}) {
    if (typeof request.body === 'object') {
        request.body = JSON.stringify(request.body)
    }
    const parameters = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        ...additionalParams
    }
    const url = [request.url]
    if (request.api) {
        url.push(request.api)
    }
    const absoluteUrl = url.join('/')

    let response = await fetch(absoluteUrl, parameters)
    const curlCommand = fetchToCurl(absoluteUrl, parameters)

    const headers = await response.clone().headers.raw()
    Object.keys(headers).forEach(header => {
        headers[header] = headers[header][0]
    })
    const ok = response.ok
    const status = response.status
    if (this.results.apiRetrieveType) {
        response = await (response[this.results.apiRetrieveType])()
    } else if (headers['content-type'] && headers['content-type'].includes('image')) {
        response = await response.blob()
        try {
            if (canAttach.call(this)) {
                const tmpBlob = Buffer.from(await response.arrayBuffer())
                this.attach(tmpBlob, 'image/png')
            }
        } catch (err) { }
    } else {
        try {
            response = await response.text()
            response = JSON.parse(response)
        } catch (err) { }
    }
    const results = {
        request: {
            absoluteUrl,
            ...parameters
        },
        curlCommand,
        ok,
        status,
        response,
        headers
    }
    return results
}

MAFWhen('api request from {jsonObject} is performed', async function (request) {
    request = performJSONObjectTransform.call(this, request)
    const results = await requestBuilder.call(this, request)
    MAFSave.call(this, 'response', results.response)
    return results
})

MAFWhen('api request is performed', async function () {
    const results = await requestBuilder.call(this, {})
    MAFSave.call(this, 'response', results.response)
    return results
})

MAFWhen('perform api request:', async function (string) {
    const request = JSON.parse(fillTemplate(string, this.results))
    const results = await requestBuilder.call(this, request)
    MAFSave.call(this, 'response', results.response)
    return results
})

/**
 * @deprecated Use the status is ok, the status is {int} or the status is not ok instead
*/
Then('status not ok', function () {
    assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})
/**
 * @deprecated Use the status is ok, the status is {int} or the status is not ok instead
*/
Then('status ok', function () {
    assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('the status is ok', function () {
    assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('the status is not ok', function () {
    assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})

/**
 * @deprecated Use the status is ok, the status is {int} or the status is not ok instead
 */
Then('status {int}', function (int) {
    assert(this.results.lastRun.status === int, `The status ${this.results.lastRun.status} was not ${int}`)
})
Then('the status is {int}', function (int) {
    assert(this.results.lastRun.status === int, `The status ${this.results.lastRun.status} was not ${int}`)
})
