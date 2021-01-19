const { fillTemplate } = require('filltemplate')
var Cucumber = require('cucumber')
var When = Cucumber.When;

var fs=require('fs')
var canAttach=function() {
  if(!this.results) {
    this.results={}
  }
  return this.results.attach!=="false"
}
var applyJSONToString = function (string, scenario) {
  if (!scenario.results) {
    scenario.results = {}
  }
  if (!scenario.results.moment) {
    scenario.results.moment = require('moment')
  }
  string = fillTemplate(string, scenario.results)
  try {
    if (string.trim() !== "") {
      var obj = JSON.parse(string)
      if (typeof obj === "object") {
        string = obj
      }
    }
  } catch (e) {
    try {
      string = string.split("\n").filter(i => i !== "").map(i => JSON.parse(i))
    } catch (e) { }
  }
  return string
}

var performJSONObjectTransform = function (items) {
  if (!this.results) {
    this.results = {}
  }
  if (items.value) {
    items.value = items.value.slice(1, items.value.length - 1)
  }
  if(items.type===null || items.type===undefined) {
    items.type=""
  }
  items.type = items.type.trim()
  switch (items.type) {
    case "it":
      return this.results.lastRun
    case "item":
      items.value = fillTemplate(items.value, this.results)
      return eval("this.results." + items.value)
    case "file":
      items.value = fillTemplate(items.value, this.results)
      var res=applyJSONToString(readFile(items.value, this), this)
      return res
    case "":
      return applyJSONToString(items.value, this)
    case "string":
      var res= fillTemplate(items.value, this.results)
      return res
    default:
      return parseInt(items.type)
  }
}
var getFilePath = (filename, scenario) => {
  var dir = ""
  if (!scenario.results) {
    scenario.results = {}
  }
  if (scenario.results.directory) {
    dir = scenario.results.directory
  }
  if (!dir.endsWith('/') && dir.trim() !== "") {
    dir += "/"
  }
  return dir + filename
}
var writeFile = (filename, data, scenario) => {
  return fs.writeFileSync(getFilePath(filename, scenario), data, "utf-8")
}
var writeFileBuffer = (filename, data, scenario) => {
  return fs.writeFileSync(getFilePath(filename, scenario), data)
}
var readFileBuffer = (filename, scenario) => {
  return fs.readFileSync(getFilePath(filename, scenario))
}
var readFile = (filename, scenario) => {
  return fs.readFileSync(getFilePath(filename, scenario), "utf-8")
}

var MAFWhen=function(name, func) {
  var params=[]
  for(var i=0; i<func.length ;i ++ ) {
    params.push("var" + i)
  }
  eval(`
    var tmpFunc=async function(${params.join(",")}) {
      if(!this.results) {
        this.results={}
      }
      this.results.lastRun=await func.call(this, ...([].slice.call(arguments)))
      if(canAttach.call(this))
        this.attach(JSON.stringify({ lastRun: this.results.lastRun }))
    }
  `)
  When(name, tmpFunc)
}

module.exports={performJSONObjectTransform, applyJSONToString, readFile, writeFile, writeFileBuffer,readFileBuffer, getFilePath, canAttach, MAFWhen}
