// Initialize fetch and Blob globally for compatibility
let fetch, Blob, FormData
let initializeFetchPromise
const initializeFetch = async () => {
    if (initializeFetchPromise) {
        await initializeFetchPromise
        return fetch
    }
    initializeFetchPromise = (async () => {
        if (!fetch) {
            const nodeFetch = await import('node-fetch')
            fetch = nodeFetch.default
            global.fetch = fetch
            
            // Import fetch-blob for better blob support
            const fetchBlob = await import('fetch-blob')
            Blob = fetchBlob.Blob
            global.Blob = Blob
            
            // Import formdata-polyfill for proper FormData support
            const formDataPolyfill = await import('formdata-polyfill/esm.min.js')
            FormData = formDataPolyfill.FormData
            global.FormData = FormData
        }
        return fetch
    })()
    return initializeFetchPromise
}

const { MAFWhen, MAFSave, performJSONObjectTransform, fillTemplate, canAttach } = require('@ln-maf/core')
const { setDefaultTimeout, Then } = require('@cucumber/cucumber')

const fs = require('fs')
const assert = require('chai').assert
const { fetchToCurl } = require('fetch-to-curl')

setDefaultTimeout(30 * 1000)

// Builds a request object from the given request, populating any missing fields using the results object
async function requestBuilder(request) {
    // Ensure fetch and related APIs are initialized
    await initializeFetch()
    
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
        } catch {
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
        const details = request.urlEncodedBody
        const urlEncodedBody = Object.entries(details).map(([property, value]) => {
            const encodedKey = encodeURIComponent(property)
            const encodedValue = encodeURIComponent(value)
            return encodedKey + '=' + encodedValue
        }).join('&')
        request.api = request.api + '?' + urlEncodedBody
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
            } catch {
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
                details[property].map(formBodyMap.bind(this)).forEach(item => {
                    data.append(property + '[]', item)
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
        const details = request.apiParams
        const formBody = Object.entries(details).map(([property, value]) => {
            const encodedKey = encodeURIComponent(property)
            // Handle nested objects by JSON stringifying them
            const processedValue = typeof value === 'object' && value !== null
                ? JSON.stringify(value)
                : value
            const encodedValue = encodeURIComponent(processedValue)
            return encodedKey + '=' + encodedValue
        }).join('&')
        request.api = request.api + '?' + formBody
    }
    return await performRequest.call(this, request, this.results?.api?.additionalParams || {})
}

// Performs the given request, returning the response
async function performRequest(request, additionalParams = {}) {
    // Ensure fetch is initialized
    await initializeFetch()
    
    // Pre-build URL to avoid array operations
    const absoluteUrl = request.api ? `${request.url}/${request.api}` : request.url
    
    // Optimize body handling
    let body = request.body
    if (body && typeof body === 'object' && !Buffer.isBuffer(body) && !(body instanceof FormData)) {
        body = JSON.stringify(body)
    }
    
    const parameters = {
        method: request.method,
        headers: request.headers,
        body,
        ...additionalParams
    }

    let response = await fetch(absoluteUrl, parameters)
    const curlCommand = fetchToCurl(absoluteUrl, parameters)

    // Extract headers more efficiently
    const headers = Object.fromEntries(response.headers.entries())
    
    // Check content-length to determine if response is large
    const contentLength = headers['content-length'] ? parseInt(headers['content-length']) : null
    const maxResponseSize = 10 * 1024 * 1024 // 10MB threshold
    const isLargeResponse = contentLength && contentLength > maxResponseSize
    
    let processedResponse
    if (this.results.apiRetrieveType) {
        processedResponse = await (response[this.results.apiRetrieveType])()
    } else {
        const contentType = headers['content-type'] || ''
        
        if (contentType.includes('image')) {
            // Process all images regardless of size
            processedResponse = await response.blob()
            try {
                if (canAttach.call(this)) {
                    const tmpBlob = Buffer.from(await processedResponse.arrayBuffer())
                    this.attach(tmpBlob, 'image/png')
                }
            } catch { /* empty */ }
            
            // Add size information for large images
            if (isLargeResponse) {
                processedResponse.sizeInfo = {
                    size: contentLength,
                    isLarge: true,
                    message: `Large image processed (${contentLength} bytes)`
                }
            }
        } else {
            try {
                if (isLargeResponse) {
                    // For large text responses, read only the first chunk
                    const reader = response.body.getReader()
                    const decoder = new TextDecoder()
                    try {
                        const { value } = await reader.read()
                        const partialText = decoder.decode(value || new Uint8Array())
                        const truncatedText = partialText.substring(0, 1000) // First 1000 chars
                        
                        processedResponse = {
                            type: 'large_response',
                            size: contentLength,
                            contentType,
                            truncated: true,
                            preview: truncatedText,
                            message: `Response too large (${contentLength} bytes) - only preview shown`
                        }
                    } finally {
                        reader.releaseLock()
                    }
                } else {
                    const text = await response.text()
                    try {
                        processedResponse = JSON.parse(text)
                    } catch {
                        processedResponse = text
                    }
                }
            } catch (error) {
                processedResponse = {
                    error: 'Failed to process response',
                    message: error.message
                }
            }
        }
    }
    const results = {
        request: {
            absoluteUrl,
            ...parameters
        },
        curlCommand,
        ok: response.ok,
        status: response.status,
        response: processedResponse,
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

Then('the status is ok', function () {
    assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('the status is not ok', function () {
    assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})

Then('the status is {int}', function (int) {
    assert(this.results.lastRun.status === int, `The status ${this.results.lastRun.status} was not ${int}`)
})
