global.fetch = require('node-fetch')
const FormData = require('form-data')
const chai = require('chai')
const assert = chai.assert
const fs = require('fs')
const { filltemplate } = require('@ln-maf/core')
const { canAttach, performJSONObjectTransform, MAFSave, getFilePath } = require('@ln-maf/core')


function build(value, name) {
  if (!this.results) {
    this.results = {}
  }
  if (!this.request) {
    this.request = {}
    this.request.headers = '{}'
  }
  this.request[name] = filltemplate(value, this)
}

const b64toBuffer = (b64Data, contentType = '', sliceSize = 512) => {
  return Buffer.from(b64Data, 'base64')
}
async function performRequestFromJSONString(string) {
  const request = JSON.parse(filltemplate(string, this.results))
  return await performRequestFromJSON.call(this, request)
}

async function performRequestFromJSON (request) {
  if (request.url)
    build.call(this, request.url.replace(/\/$/, ''), 'url')
  if (request.body) {
    build.call(this, request.body, 'body')
  }
  if (request.jsonBody) {
    this.request.body = JSON.stringify(request.jsonBody, this.results)
  }
  if (request.urlEncodedBody) {
    let formBody = []
    const details = request.urlEncodedBody
    for (const property in details) {
      const encodedKey = encodeURIComponent(property)
      const encodedValue = encodeURIComponent(details[property])
      formBody.push(encodedKey + '=' + encodedValue)
    }
    formBody = formBody.join('&')
    build.call(this, formBody, 'body')
  }
  const formBodyMap = function (item) {
    switch (item.type) {
      case 'file':
        return fs.createReadStream(getFilePath(item.fileName, this))
      case 'base64blob':
        return b64toBuffer(item.base64blob)
      default:
        return item
    }
  }
  if (request.headers) { build.call(this, JSON.stringify(request.headers), 'headers') }
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

  if (request.api) { build.call(this, request.api.replace(/^\//, ''), 'api') }
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
    build.call(this, api + '?' + formBody, 'api')
  }

  return await performRequest.call(this, request.method)
}


async function performRequest(method) {
  const request = this.request
  if (!request.headers) {
    request.headers = {}
  }
  if (typeof request.headers === 'string') {
    request.headers = JSON.parse(request.headers)
  }
  let additionalParams = {}
  if (this.results && this.results.api) {
    additionalParams = this.results.api.additionalParams
  }
  const params = {
    method: method,
    headers: request.headers,
    body: request.body,
    ...additionalParams
  }
  let items=[request.url]
  if(request.api) {
    items.push(request.api)
  }
  const url = items.join('/')
  const req = await fetch(url, params)
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
      url: url,
      ...params
    },
    ok: req.ok,
    status: req.status,
    response: text,
    headers: headers
  }
  this.request.headers = null
  this.request.body = null
  return res
}

module.exports= { performRequestFromJSON, performRequest, build }
