global.fetch = require('node-fetch')
const { MAFWhen, MAFSave, performJSONObjectTransform, filltemplate, canAttach, getFilePath } = require('@ln-maf/core')
const { setDefaultTimeout, Then } = require('@cucumber/cucumber')

const FormData = require('form-data')
const fs = require('fs')
const assert = require('chai').assert
const { fetchToCurl } = require('fetch-to-curl')

setDefaultTimeout(15 * 1000)

// Builds a request object from the given request, populating any missing fields using the results object
async function requestBuilder(request) {
    if (!request.url && this.results && this.results.url) {
        request.url = this.results.url
    }
    if (!request.url) {
        throw new Error('A url must be provided either in the request or in the results object')
    }

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
    if (!request.urlEncodedBody && this.results && this.results.urlEncodedBody) {
        request.urlEncodedBody = this.results.urlEncodedBody
    }
    if (request.urlEncodedBody) {
        const formBody = []
        const details = request.urlEncodedBody
        for (const property in details) {
            const encodedKey = encodeURIComponent(property)
            const encodedValue = encodeURIComponent(details[property])
            formBody.push(encodedKey + '=' + encodedValue)
        }
        request.formBody = formBody.join('&')
    }
    const formBodyMap = function (item) {
        switch (item.type) {
        case 'file':
            return fs.createReadStream(getFilePath(item.fileName, this))
        case 'base64blob':
            return Buffer.from(item.base64blob, 'base64')
        default:
            return item
        }
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
        this.request.body = data
    }

    if (!request.method && this.results && this.results.method) {
        request.method = this.results.method
    }

    if (!request.api && this.results && this.results.api) {
        request.api = this.results.api
    }
    if (!request.apiParams && this.results && this.results.apiParams) {
        request.apiParams = this.results.apiParams
    }
    if (request.apiParams) {
        let formBody = []
        const details = request.apiParams
        for (const property in details) {
            const encodedKey = encodeURIComponent(property)
            const encodedValue = encodeURIComponent(details[property])
            formBody.push(encodedKey + '=' + encodedValue)
        }
        formBody = formBody.join('&')
        const api = this.request.api ? this.request.api : ''
        MAFSave.call(this, 'api', api + '?' + formBody)
    }
    let additionalParams = {}
    if (this.results && this.results.api) {
        additionalParams = this.results.api.additionalParams
    }
    return await performRequest.call(this, request, additionalParams)
}

// Performs the given request, returning the response
async function performRequest(request, additionalParams = {}) {
    const params = {
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
    const req = await fetch(absoluteUrl, params)
    const curlCommand = fetchToCurl(absoluteUrl, params)
    let text
    if (this.results.apiRetrieveType) {
        text = await (req[this.results.apiRetrieveType])()
    } else if (req.headers.get('content-type') && req.headers.get('content-type').includes('image')) {
        text = await req.blob()
        try {
            if (canAttach.call(this)) {
                const tmpBlob = Buffer.from(await text.arrayBuffer())
                this.attach(tmpBlob, 'image/png')
            }
        } catch (err) { }
    } else {
        try {
            text = await req.text()
            text = JSON.parse(text)
        } catch (err) { }
    }
    const headers = await req.headers.raw()
    Object.keys(headers).forEach(header => {
        headers[header] = headers[header][0]
    })
    const res = {
        request: {
            absoluteUrl,
            ...params
        },
        curlCommand,
        ok: req.ok,
        status: req.status,
        response: text,
        headers
    }
    return res
}

/**
 * @deprecated Set the item 'url' instead
 */
MAFWhen('url {string}', function (url) {
    filltemplate(url, this.results)
    // Remove trailing slash
    url = url.replace(/\/$/, '')
    MAFSave.call(this, 'url', url)
})

/**
 * @deprecated Set the item 'api' instead
 */
MAFWhen('api {string}', function (api) {
    filltemplate(api, this.results)
    // Remove leading slash
    api = api.replace(/^\//, '')
    MAFSave.call(this, 'api', api)
})

/**
 * @deprecated Set the item 'body' instead
 */
MAFWhen('body {string}', function (body) {
    filltemplate(body, this.results)
    MAFSave.call(this, 'body', body)
})

/**
 * @deprecated Set the item 'headers' instead
 */
MAFWhen('headers {string}', function (headers) {
    filltemplate(headers, this.results)
    MAFSave.call(this, 'headers', headers)
})

/**
 * @deprecated Set the item 'method' instead
 */
MAFWhen('method post', async function () {
    MAFSave.call(this, 'method', 'POST')
})

/**
 * @deprecated Set the item 'method' instead
 */
MAFWhen('method get', async function () {
    MAFSave.call(this, 'method', 'GET')
})

MAFWhen('api request from {jsonObject} is performed', async function (request) {
    request = performJSONObjectTransform.call(this, request)
    const results = await requestBuilder.call(this, request)
    MAFSave.call(this, 'response', results.response)
    return results
})

MAFWhen('perform api request:', async function (string) {
    const request = JSON.parse(filltemplate(string, this.results))
    const results = await requestBuilder.call(this, request)
    MAFSave.call(this, 'response', results.response)
    return results
})

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
        // eslint-disable-next-line no-eval
        eval(`extraParams.results.${indices[i]} = val`)
    }
    const request = performJSONObjectTransform.call(extraParams, reqItem)
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
