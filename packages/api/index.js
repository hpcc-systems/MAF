global.fetch = require('node-fetch')
const FormData = require('form-data')
const chai = require('chai')
const assert = chai.assert
const fs = require('fs')
const { filltemplate } = require('@ln-maf/core')
const { canAttach, performJSONObjectTransform, MAFSave, getFilePath, MAFWhen } = require('@ln-maf/core')
const { setDefaultTimeout, Given, Then } = require('@cucumber/cucumber')

setDefaultTimeout(15 * 1000)

const build = (scenario, value, name) => {
  if (!scenario.results) {
    scenario.results = {}
  }
  if (!scenario.request) {
    scenario.request = {}
    scenario.request.headers = '{}'
  }
  scenario.request[name] = filltemplate(value, scenario.results)
}
Given('url {string}', function (url) {
  url = url.replace(/\/$/, '')
  build(this, url, 'url')
})
Given('api {string}', function (api) {
  api = api.replace(/^\//, '')
  build(this, api, 'api')
})

Given('body {string}', function (request) {
  build(this, request, 'body')
})

Given('headers {string}', function (headers) {
  build(this, headers, 'headers')
})

const b64toBuffer = (b64Data, contentType = '', sliceSize = 512) => {
  return Buffer.from(b64Data, 'base64')
}
const performRequestFromJSONString = async function (string) {
  const request = JSON.parse(filltemplate(string, this.results))
  return await performRequestFromJSON.call(this, request)
}

const performRequestFromJSON = async function (request) {
  if(request.url)
  build(this, request.url.replace(/\/$/, ''), 'url')
  if (request.body) {
    build(this, request.body, 'body')
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
    build(this, formBody, 'body')
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
  if (request.headers) { build(this, JSON.stringify(request.headers), 'headers') }
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

  if (request.api) { build(this, request.api.replace(/^\//, ''), 'api') }
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
    build(this, api + '?' + formBody, 'api')
  }

  return await performRequest(request.method, this)
}

MAFWhen('api request from {jsonObject} is performed', async function (item) {
  item = performJSONObjectTransform.call(this, item)
  return await performRequestFromJSON.call(this, item)
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
  return await performRequestFromJSON.call(this, item)
})

const performRequest = async (method, scenario) => {
  const request = scenario.request
  if (!request.headers) {
    request.headers = {}
  }
  if (typeof request.headers === 'string') {
    request.headers = JSON.parse(request.headers)
  }
  let additionalParams = {}
  if (scenario.results && scenario.results.api) {
    additionalParams = scenario.results.api.additionalParams
  }
  const params = {
    method: method,
    headers: request.headers,
    body: request.body,
    ...additionalParams
  }
  const url = [request.url, request.api].join('/')
  const req = await fetch(url, params)
  let text
  if (scenario.results.apiRetrieveType) {
    text = await (req[scenario.results.apiRetrieveType])()
  } else if (req.headers.get('content-type') && req.headers.get('content-type').includes('image')) {
    text = await req.blob()
    try {
      if (canAttach.call(scenario)) {
        const tmpBlob = Buffer.from(await text.arrayBuffer())
        scenario.attach(tmpBlob, 'image/png')
      }
    } catch (err) {}
  } else {
    try {
      text = await req.text()
      text = JSON.parse(text)
    } catch (err) {}
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
  MAFSave.call(scenario, 'response', res.response)
  scenario.request.headers = null
  scenario.request.body = null
  return res
}

MAFWhen('method post', async function () {
  return await performRequest('POST', this)
})
MAFWhen('method get', async function () {
  return await performRequest('GET', this)
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
