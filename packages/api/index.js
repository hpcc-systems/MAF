global.fetch = require('node-fetch')
var FormData = require('form-data')
var chai=require('chai')
var assert=chai.assert;
var fs=require('fs')
const { filltemplate } = require('@ln-maf/core')
const { canAttach, performJSONObjectTransform, MAFSave, getFilePath, MAFWhen} = require('@ln-maf/core')
const { setDefaultTimeout, Given, Then } = require('@cucumber/cucumber');

setDefaultTimeout(15 * 1000)

var build=(scenario, value, name) => {
  if(!scenario.results) {
    scenario.results={}
  }
  if(!scenario.request) {
    scenario.request={}
    scenario.request.headers="{}"
  }
  scenario.request[name]=filltemplate(value, scenario.results)
}
Given('url {string}', function(url) {
  url=url.replace(/\/$/, "")
  build(this, url, "url")
})
Given('api {string}', function(api) {
  api=api.replace(/^\//, "")
  build(this, api, "api")
})

Given('body {string}', function(request) {
  build(this, request, "body")
})

Given('headers {string}', function(headers) {
  build(this, headers, "headers")
})


const b64toBuffer = (b64Data, contentType='', sliceSize=512) => {
  return Buffer.from(b64Data, 'base64')
}
var performRequestFromJSONString=async function(string) {
  var request=JSON.parse(filltemplate(string, this.results))
  return await performRequestFromJSON.call(this, request)
}

var performRequestFromJSON=async function(request) {
  build(this, request.url.replace(/\/$/, ""), "url")
  if(request.body) {
    build(this, request.body, "body")
  }
  if(request.jsonBody) {
    this.request.body=JSON.stringify(request.jsonBody, this.results)
  }
  if(request.urlEncodedBody) {
    var formBody = [];
    var details=request.urlEncodedBody
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    build(this, formBody, "body")
  }
  var formBodyMap=function(item) {
    var scenario=this
    switch(item.type) {
      case "file":
        return fs.createReadStream(getFilePath(item.fileName, this))
      case "base64blob":
        return b64toBuffer(item.base64blob)
      default:
        return item
    }
  }
  if(request.headers)
    build(this, JSON.stringify(request.headers), "headers")
  if(request.formBody) {
    var data=new FormData()
    var details=request.formBody
    for(var property in details) {
      if(Array.isArray(details[property])) {
        details[property].map(formBodyMap.bind(this)).forEach(i=>{
          data.append(property+"[]", i)
        })
      } else {
        data.append(property, formBodyMap.call(this, details[property]))
      }
    }
    this.request.body=data
    var headers={}
    try {
      headers=JSON.parse(this.request.headers)
    } catch (e) {}
    headers = JSON.stringify({ ...headers, ...data.getHeaders() })
  }

  
  if(request.api)
    build(this, request.api.replace(/^\//, ""), "api")
  if(request.apiParams) {
    var formBody = [];
    var details=request.apiParams
    for (var property in details) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(details[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    var api=this.request.api ? this.request.api : ""
    build(this, api+"?"+formBody, "api")
  }
  
  return await performRequest(request.method, this)
}

MAFWhen('api request from {jsonObject} is performed', async function (item){
  item = performJSONObjectTransform.call(this, item)
  return await performRequestFromJSON.call(this, item);
})
MAFWhen('perform api request:', performRequestFromJSONString)
MAFWhen('api request from {jsonObject} is performed with:', async function(reqItem, dataTable) {
  dataTable=dataTable.rawTable
  var indices=dataTable[0]
  var item=[]
  indices.forEach((i, index) => {
   item[index]=[]
  })
  dataTable=dataTable.slice(1)
  dataTable.forEach((i) => {
    i.forEach((j, index) => {
    item[index].push(j)
    })
  })
  item=item.map(i => {
    if(i.length===1) {
      return i[0]
    }
    return i
  })
  var extraParams={}
  extraParams.results={...this.results}
  for(var i=0; i<indices.length; i++) {
    var val=filltemplate(item[i], this.results)
    eval(`extraParams.results.${indices[i]} = val`)
  }

  var item = performJSONObjectTransform.call(extraParams, reqItem)
  return await performRequestFromJSON.call(this, item)
})

var performRequest=async (method, scenario) => {
  var request=scenario.request
  if(!request.headers) {
    request.headers={}
  }
  if(typeof request.headers === "string") {
    request.headers=JSON.parse(request.headers)
  }
  var additionalParams={}
  if(scenario.results && scenario.results.api ) {
    var apiParams=scenario.results.api
    try {
      apiParams=JSON.parse(apiParams)
    } catch(e) {}
    additionalParams=scenario.results.api.additionalParams
  }
  var params={
    method: method,
    headers: request.headers,
    body: request.body,
    ...additionalParams
  }
  var url=[request.url, request.api].join("/")
  var req=await fetch(url, params)
  var text;
  if(scenario.results.apiRetrieveType) {
    text=await (req[scenario.results.apiRetrieveType])()
  } else if (req.headers.get("content-type") && req.headers.get("content-type").includes("image")) {
    text = await req.blob()
    try {
      if(canAttach.call(scenario)) {
        var tmpBlob=Buffer.from(await text.arrayBuffer())
        scenario.attach(tmpBlob, 'image/png');
      }
    } catch(err) {}
  } else {
    try {
      text=await req.text()
      text=JSON.parse(text)
    } catch(err) {}
  }
  var headers=await req.headers.raw()
  Object.keys(headers).forEach(header => headers[header] = headers[header][0])
  var res={ 
    request: { 
      url: url, 
      ...params 
    }, 
    ok: req.ok, 
    status: req.status, 
    response: text, 
    headers: headers 
  }
  MAFSave.call(scenario, "response", res.response)
  scenario.request.headers=null
  scenario.request.body=null
  return res
}

MAFWhen('method post', async function() {
  return await performRequest("POST", this)
})
MAFWhen('method get', async function() {
  return await performRequest("GET", this)
})
Then('the status is ok', function() {
  assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('the status is not ok', function() {
  assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})
Then('status not ok', function() {
  assert(!this.results.lastRun.ok, `The status ${this.results.lastRun.status} was in the range of valid http response codes 200-299`)
})
Then('status ok', function() {
  assert(this.results.lastRun.ok, `The status ${this.results.lastRun.status} was not in the range of valid http response codes 200-299`)
})
Then('status {int}',function(int) {
  assert(this.results.lastRun.status == int, `The status ${this.results.lastRun.status} was not ${int}`)
})
Then('the status is {int}', function (int) {
  assert(this.results.lastRun.status == int, `The status ${this.results.lastRun.status} was not ${int}`)
});
