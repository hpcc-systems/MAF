const { Before } = require('@cucumber/cucumber');
var Cucumber = require('@cucumber/cucumber')
var fs = require('fs')
var chai = require('chai')
var assert = chai.assert;
var Given = Cucumber.Given;
var When = Cucumber.When;
var Then = Cucumber.Then;
var world = null
const { filltemplate }= require('@ln-maf/core')
const {  MAFSave, tryAttach, performJSONObjectTransform, applyJSONToString, readFile, writeFile, writeFileBuffer, readFileBuffer, getFilePath, MAFWhen } = require('@ln-maf/core')

Before((scenario) => {
  world = scenario
});
var toISO = d => {
  var val = (new Number(d).valueOf())
  if (isNaN(val)) {
    return d
  }
  var date = new Date(val).toISOString()
  return date
}
var setToString = function (location, value, scenario, attach = true) {
  MAFSave.call(scenario, location, applyJSONToString(value, scenario))
}
// Stub function to test applying parameters to ensure that command line args can be included.
When('parameters are:', function(docString) {
  this.parameters=JSON.parse(docString)
})
MAFWhen('apply parameters', function () {
  Object.assign(this.results, this.parameters)
  tryAttach.call(this, this.parameters)
})


When('set {string} to {jsonObject}', function (location, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  MAFSave.call(this, location, obj)
})
When('set {string} to:', function (location, value) {
  setToString(location, value, this)
})
When('set {string} to', function (location, value) {
  setToString(location, value, this)
})

Then('{jsonObject} {validationsEquivalence} {jsonObject}', function (obj1, equiv, obj2) {
  if (equiv === "=") {
    equiv = "=="
  }
  var obj = Number(performJSONObjectTransform.call(this, obj1))
  var obj2 = Number(performJSONObjectTransform.call(this, obj2))
  assert(eval("obj" + equiv + "obj2"), JSON.stringify(obj) + " was not " + equiv + " " + JSON.stringify(obj2))
})

Then('{jsonObject} is {timeQualifier} now', function (jsonObject, isBefore) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  var functionName = isBefore === "before" ? "isBefore" : "isAfter"
  var dateIn = obj
  dateIn = toISO(dateIn)
  var validator = require('validator')
  assert(validator[functionName](dateIn, new Date().toISOString()), `${dateIn} was not ${isBefore} now`)
});

Then('{jsonObject} is {timeQualifier} {jsonObject}', function (string, isBefore, date) {
  var obj = performJSONObjectTransform.call(this, string)
  var obj2 = performJSONObjectTransform.call(this, date)
  var functionName = isBefore === "before" ? "isBefore" : "isAfter"
  obj = toISO(obj)
  obj2 = toISO(obj2)
  var validator = require('validator')
  assert(validator[functionName](obj, obj2), `${obj} was not ${isBefore} ${obj2}`)
});



Then("{jsonObject} is not null", function (jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  assert.exists(obj)
})
Then("{jsonObject} is null", function (jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  assert.notExists(obj)
})

MAFWhen("run json path {string} on {jsonObject}", function (jPath, jsonObject) {
  var jp = require('jsonpath')
  var obj = performJSONObjectTransform.call(this, jsonObject)
  return jp.query(obj, jPath)
})
var setNamespace = (namespace, scenario) => {
  if(!scenario.results) {
    scenario.results={}
  }
  if (!scenario.results.namespace) {
    scenario.results.namespace = {}
  }
  scenario.results.namespace = JSON.parse(namespace)
}
Given("xPath namespace is {string}", function (namespace) {
  setNamespace(namespace, this)
})

Given('xPath namespace is', function (namespace) {
  setNamespace(namespace, this)
})

Given("add xPath namespace {string} = {string}", function (namespace, url) {
  if (!this.results) {
    this.results = {}
  }
  if (!this.results.namespace) {
    this.results.namespace = {}
  }
  this.results.namespace[namespace] = url
})

MAFWhen("generate rsa key", function() {
  const crypto = require('crypto');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  }); 
  return privateKey
})
MAFWhen("run xPath {string} on item {string}", function (xPath, element) {
  if (!this.results.namespace) {
    this.results.namespace = {}
  }
  var xpath = require('xpath')
  var dom = require('xmldom').DOMParser
  var doc = new dom().parseFromString(eval("this.results." + element))
  var sel = xpath.useNamespaces(this.results.namespace)
  return sel(xPath, doc).map(i => i.toString()).join("\n")
})

var doSetsMatch = (set1, set2, scenario) => {
  var isSetsEqual = (a, b) => a.size === b.size && Array.from(a).every(value => b.has(value))
  var queryResult = new Set(set1.map(json => JSON.stringify(json, null, 2)))
  var expected = new Set(set2.map(json => JSON.stringify(json, null, 2)))
  let difference = {
    queryResult: [...queryResult].filter(x => !expected.has(x)).map(e => JSON.parse(e)),
    expected: [...expected].filter(x => !queryResult.has(x)).map(e => JSON.parse(e))
  }
  var res = isSetsEqual(expected, queryResult)
  var diffedJSON = JSON.stringify(difference, null, 2)
  tryAttach.call(scenario, diffedJSON)
  assert(res, `The difference is: ${diffedJSON}`)
}
var setMatch = function (set1, set2) {
  set1 = this.results[set1]
  set2 = this.results[set2]
  doSetsMatch(set1, set2, this)
}
var setFileMatch = function (set, file) {
  var file = readFile(file, this)
  doSetsMatch(applyJSONToString(this.results[set], this), applyJSONToString(file, this), this)
}

/**
 * Removes keys from a json object
 * @param {string} jsonKey the key/s to remove from the JSON object
 * @param {JSON} object A JSON object
 * @returns true if the key was successfully removed
 */
function jsonDeleteKey(jsonKey, object) {
  var original = JSON.parse(JSON.stringify(object))
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
  var object = {};

  for (var i = 0, length = whitelist.length; i < length; ++i) {
    var k = 0,
      names = whitelist[i].split(separator || '.'),
      value = sourceJSON,
      name,
      count = names.length,
      ref = object;
    while (k < count - 1) {
      name = names[k++];
      value = value[name];
      ref[name] = {};
      ref = ref[name];
    }
      ref[names[count - 1]] = value[names[count - 1]];

  }
  return object;
}

/**
 * Removes the JSON key/value from the JSON Object provided
 */
MAFWhen("JSON key {string} is removed from {jsonObject}", function (jsonpath, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  if (typeof obj === "string") {
    obj = this.results[obj]
  }
  assert(jsonDeleteKey.call(this, jsonpath, obj, "Could not delete key"))
  return obj
})

/**
 * Returns the JSON key from a variable to lastRun
 */
MAFWhen("JSON key {string} is extracted from {jsonObject}", function (jsonpath, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  if (typeof obj === "string") {
    obj = eval(`this.results.${obj}`)
  }
  return eval(`obj.${jsonpath}`)
})

/**
 * Returns the JSON key from a variable {jsonObject} to lastRun
 */
MAFWhen('JSON keys {string} are extracted from {jsonObject}', function (array, variable) {
  var obj = performJSONObjectTransform.call(this, variable)
  array = filltemplate(array, this.results)
  try {
    array = JSON.parse(array)
  } catch (e) {
    array = array.replace("[", "")
    array = array.replace("]", "")
    array = array.split(",")
    array = array.map(i => i.trim())
  }
  return whitelistJson.call(this, obj, array)
})

/**
 * Replaces the value of all found JSON keys in a file, using the JSON path to identify the keys
 */
When("{string} is written to file {string} on JSON path {string}", function (value, fileName, jsonPath) {
  var jp = require('jsonpath')
  var fileContents = JSON.parse(readFile(fileName, this))
  jp.apply(fileContents, jsonPath, function () { return value })
  writeFile(fileName, JSON.stringify(fileContents), this)
  tryAttach.call(this, fileContents)
})

/**
 * Replaces the value of all found JSON keys in an item, using the JSON path to identify the keys
 */
When("{string} is applied to item {string} on JSON path {string}", function (value, item, jsonPath) {
  var jp = require('jsonpath')
  var fileContents = this.results[item]
  value = filltemplate(value, this.results)
  if (value.trim() !== "") {
    try {
      var tmp = JSON.parse(value)
      value = tmp
    } catch (e) { }
  }
  jp.apply(fileContents, jsonPath, function () { return value })
  this.results[item] = fileContents
  tryAttach.call(this, this.results[item])
})

When("{jsonObject} is written in json line delimited format to file {string}", function (item, file) {
  var obj = performJSONObjectTransform.call(this, item)
  file = filltemplate(file, this.results)
  try { obj = JSON.parse(obj) } catch ( e ) {}
  writeFile(file, obj.map(i => JSON.stringify(i)).join("\n"), this)
})

When("{jsonObject} is written to file {string}", function (jsonObject, file) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  file = filltemplate(file, this.results)
  if (typeof (obj) === "object") {
    obj = JSON.stringify(obj)
  }
  writeFile(file, obj, this)
})

Then("it matches the set from file {string}", function (set1) {
  return setFileMatch.call(this, "lastRun", set1)
})

Then("the set {string} matches the set from file {string}", function (f, s) {
  var res = setFileMatch.call(this, f, s)
  return res
})

Then("the set {string} matches the set {string}", setMatch)

Then("it matches the set {string}", function (set) {
  return setMatch.call(this, "lastRun", set)
})

When('the file {string} is gzipped', function (filename) {
  filename = filltemplate(filename, this.results)
  try {
    fs.deleteFileSync(getFilePath(filename, this))
  } catch (e) {
  }
  var zlib = require('zlib');
  var bf = readFileBuffer(filename, this)
  var buffer = zlib.gzipSync(bf)
  writeFileBuffer(filename + ".gz", buffer, this)
})

MAFWhen('file {string} is gzip unzipped to file {string}', function (file, fileOut) {
  file = filltemplate(file, this.results)
  var zlib = require('zlib');
  var bf = readFileBuffer(file, this)
  var buffer = zlib.unzipSync(bf)
  writeFileBuffer(fileOut, buffer, this)
})
When('set config from json {jsonObject}', function (jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  for (var i in obj) {
    setToString(i, obj[i], this)
  }
})

When('set:', function (dataTable) {
  dataTable = dataTable.rawTable
  var indices = dataTable[0]
  var item = []
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
  var item = performJSONObjectTransform.call(this, item)
  if (typeof item !== "string") {
    item = JSON.stringify(item)
  }
  var encode = (new Buffer(item, 'ascii').toString("base64"))
  return encode
})
MAFWhen('{jsonObject} is base64 decoded', function (item) {
  var item = performJSONObjectTransform.call(this, item)
  assert(typeof item === "string", "Item type needs to be a string for base64 decoding, but it was a " + typeof item)
  var decode = (new Buffer(item, 'base64').toString("ascii"))
  return decode
})

Then('the value {string} is base64 decoded and resaved', function (item) {
  var unencrypt = (new Buffer(this.results[item], 'base64').toString("ascii"))
  this.results[item] = unencrypt
  tryAttach.call(this, "Decoded value: " + unencrypt)
})

var lowerCaseItemKeys = function (item) {
  Object.keys(item).forEach(i => {
    if (i.toLowerCase() !== i) {
      item[i.toLowerCase()] = item[i]
      delete item[i]
    }
    if (typeof item[i.toLowerCase()] === "object") {
      lowerCaseItemKeys(item[i.toLowerCase()])

    }
  })
}

When('make json keys for item {string} lower case', function (item) {
  lowerCaseItemKeys(this.results[item])
  tryAttach.call(this, this.results[item])
})

var flatten = function (item, res) {
  Object.keys(item).forEach(i => {
    if (typeof item[i] === "object") { flatten(item[i], res) }
    else { res[i] = item[i] }
  })
}

When('json item {string} is flattened', function (item) {
  var res = {}
  flatten(this.results[item], res)
  this.results[item] = res
  tryAttach.call(this, this.results[item])
})

var numberify = function (item) {
  Object.keys(item).forEach(i => {
    if (typeof item[i] === "object") { numberify(item[i]) }
    else if (typeof item[i] === "string") {
      var intVal = Number(item[i])
      if (!Number.isNaN(intVal)) { item[i] = intVal }
    }
  })
}

When('json item {string} is numberifyed', function (item) {
  numberify(this.results[item])
  tryAttach.call(this, this.results[item])
})

var trimIt = function (item) {
  Object.keys(item).forEach(i => {
    if (typeof item[i] === "object") {
      trimIt(item[i])
    }
    else if (typeof item[i] === "string") { item[i] = item[i].trim() }
  })
}

When('json item {string} is trimmed', function (item) {
  trimIt(this.results[item])
  tryAttach.call(this, this.results[item])
})

Then('{jsonObject} is not equal to {jsonObject}', function (item1, item2) {
  var item1 = performJSONObjectTransform.call(this, item1)
  var item2 = performJSONObjectTransform.call(this, item2)
  if (typeof item1 === "object" && typeof item2 === "object") {
    assert.notDeepEqual(item1, item2)
  } else {
    assert.notEqual(item1, item2)
  }
})

Then('{jsonObject} is equal to {jsonObject}', function (item1, item2) {
  var item1 = performJSONObjectTransform.call(this, item1)
  var item2 = performJSONObjectTransform.call(this, item2)
  if (typeof item1 === "object" && typeof item2 === "object") {
    assert.deepEqual(item1, item2)
  } else {
    assert.equal(item1, item2)
  }
})
Then('{jsonObject} is not equal to:', function (item1, item2) {
  var item1 = performJSONObjectTransform.call(this, item1)
  var expected = filltemplate(item2, this.results)
  try {
    expected = JSON.parse(expected)
  } catch (e) { }
  if (typeof item1 === "object" && typeof expected === "object") {
    assert.notDeepEqual(item1, expected)
  } else {
    assert.notEqual(item1, expected)
  }
})


Then('{jsonObject} is equal to:', function (item1, item2) {
  var item1 = performJSONObjectTransform.call(this, item1)
  var expected = filltemplate(item2, this.results)
  try {
    expected = JSON.parse(expected)
  } catch (e) { }
  if (typeof item1 === "object" && typeof expected === "object") {
    assert.deepEqual(item1, expected)
  } else {
    assert.equal(item1, expected)
  }
})

Then('element {string} does not exist in {jsonObject}', function (element, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  element = filltemplate(element, this.results)
  assert.doesNotHaveAnyKeys(obj, [element])
})
Then('element {string} exists in {jsonObject}', function (element, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  element = filltemplate(element, this.results)
  assert.containsAllKeys(obj, [element])
})
Then('elements {string} do not exist in {jsonObject}', function (element, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  element = filltemplate(element, this.results)
  try {
    element = JSON.parse(element)
  } catch (e) {
    element = element.replace("[", "")
    element = element.replace("]", "")
    element = element.split(",")
    element = element.map(i => i.trim())
  }
  assert.doesNotHaveAnyKeys(jsonObject, element)
})
Then('elements {string} exist in {jsonObject}', function (element, jsonObject) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  element = filltemplate(element, this.results)
  try {
    element = JSON.parse(element)
  } catch (e) {
    element = element.replace("[", "")
    element = element.replace("]", "")
    element = element.split(",")
    element = element.map(i => i.trim())
  }
  assert.containsAllKeys(obj, element)
})
var performEncrypt = function () {
  var options = {}
    options.header = this.results.header
  var jwt = require('jsonwebtoken')
  setToString("lastRun", jwt.sign(this.results.jwtPayload, this.results.privateKey, options), this);
}
When('sign item {string} using jwt', function (item) {
  item = filltemplate(item, this.results)
  item = filltemplate(this.results[item], this.results)
  setToString("jwtPayload", item, this, false)
  performEncrypt.call(this)
})

When('sign using jwt:', function (docString) {
  setToString("jwtPayload", docString, this, false)
  performEncrypt.call(this)
});

var sleep = {
  msleep: function (n) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n); }
}

When('wait {int} milliseconds', function (milliseconds) {
  sleep.msleep(milliseconds)
})

Given('set examples', async function () {
  // Write code here that turns the phrase above into concrete actions
  var a = world
  var flatten = (acc, cumulator) => [...acc, ...cumulator]
  var extras = a.pickle.steps.map(i => i.astNodeIds)
  extras = extras.reduce(flatten)
  var examples = a.gherkinDocument.feature.children.map(i =>
    i.scenario.examples.map(
      i => i.tableBody.filter(
        i => extras.includes(i.id))))
    .reduce(flatten)

  var res = a.gherkinDocument.feature.children.map(i =>
    i.scenario.examples.filter(i =>
      i.tableBody.map(i => extras.includes(i.id)).includes(true)))
  res = res.reduce(flatten, [])
  var headers = res.map(i => i.tableHeader.cells).reduce(flatten, [])
  headers = headers.map(i => i.value)
  examples = examples.reduce(flatten, []).map(i => i.cells).reduce(flatten, []).map(i => i.value)
  var res = headers.reduce((prev, curr, i) => {
    prev[curr] = examples[i]
    return prev
  }
    , {})
  if (!this.results) {
    this.results = {}
  }
  var keys = Object.keys(res)
  for (var key in keys) {
    key = keys[key]
    res[key] = filltemplate(res[key], this.results)
    this.results[key] = res[key]
  }
  tryAttach.call(this, res)
});

Then("{jsonObject} contains {string}", function (jsonObject, checkString) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  checkString = filltemplate(checkString, this.results)
  obj = JSON.stringify(obj)
  assert.isTrue(obj.includes(checkString), `String '${checkString}' is not in ${obj}`)
})

Then("{jsonObject} does not contain {string}", function (jsonObject, checkString) {
  var obj = performJSONObjectTransform.call(this, jsonObject)
  checkString = filltemplate(checkString, this.results)
  obj = JSON.stringify(obj)
  assert.isFalse(obj.includes(checkString), `String '${checkString}' is in ${obj}`)
})
function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
MAFWhen("blob is read from file {string}", async function(fileName) {
  var res= readFileBuffer(fileName, this)
  var arrayBuff=toArrayBuffer(res)
  var f=() => arrayBuff
  f.bind(this)
  res= { "arrayBuffer": f}
  return res
  
})

When("blob item {string} is written to file {string}", async function (blob, fileName) {
  blob = filltemplate(blob, this.results);
  blob = eval("this.results." + blob)
  var b = Buffer.from(await blob.arrayBuffer())
  writeFile(`${fileName}`, b, this);
})

When("blob item {string} is attached", async function (blob) {
  blob = filltemplate(blob, this.results);
  blob = eval("this.results." + blob)
  var b = Buffer.from(await blob.arrayBuffer())
  return this.attach(b, 'image/png');
})
Then("blob item {string} is equal to file {string}", async function (blob, fileName) {
  blob = filltemplate(blob, this.results);
  blob = eval("this.results." + blob)
  var b = await blob.arrayBuffer()
  var actualImage = readFileBuffer(`${fileName}`, this);
  assert.isTrue(Buffer.compare(actualImage, Buffer.from(b)) === 0)
})
