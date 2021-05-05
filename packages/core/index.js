const filltemplate = require('./filltemplate')
const Cucumber = require('@cucumber/cucumber')
const When = Cucumber.When

const fs = require('fs')
const tryAttach = function (attach, type = 'text') {
  if (canAttach.call(this)) {
    if (typeof attach === 'object') {
      this.attach(JSON.stringify(attach, null, 2))
    } else {
      this.attach(attach, type)
    }
  }
}
const canAttach = function () {
  return this.results.attach !== 'false'
}
const applyJSONToString = function (string, scenario, ft=true) {
  if (!scenario.results) {
    scenario.results = {}
  }
  if (!scenario.results.moment) {
    scenario.results.moment = require('moment')
  }
  if(ft)
  string = filltemplate(string, scenario.results)
  try {
    if (string.trim() !== '') {
      const obj = JSON.parse(string)
      if (typeof obj === 'object') {
        string = obj
      }
    }
  } catch (e) {
    try {
      string = string.split('\n').filter(i => i !== '').map(i => JSON.parse(i))
    } catch (e) { }
  }
  return string
}

const performJSONObjectTransform = function (items, ft=true) {
  if (!this.results) {
    this.results = {}
  }
  if(this.results.skipFillTemplate && this.results.skipFillTemplate.toUpperCase() === "TRUE") {
    ft=false
  }
  if (items.value) {
    items.value = items.value.slice(1, items.value.length - 1)
  }
  items.type = items.type1
  if (items.type === null || items.type === undefined) {
    items.type = items.type2
  }
  if (items.type === null || items.type === undefined) {
    items.type = ''
  }
  items.type = items.type.trim()
  switch (items.type) {
    case 'it':
      return this.results.lastRun
    case 'item':
      if(ft)
      items.value = filltemplate(items.value, this.results)
      return eval('this.results.' + items.value)
    case 'file':
      items.value = filltemplate(items.value, this.results)
      return applyJSONToString(readFile(items.value, this), this, ft)
    case '':
    case 'string':
      return applyJSONToString(items.value, this, ft)
    default:
      return parseInt(items.type)
  }
}
const getFilePath = (filename, scenario) => {
  let dir = ''
  if (!scenario.results) {
    scenario.results = {}
  }
  if (scenario.results.directory) {
    dir = scenario.results.directory
  }
  if (!dir.endsWith('/') && dir.trim() !== '') {
    dir += '/'
  }
  return dir + filename
}
const writeFile = (filename, data, scenario) => {
  let toWrite = data
  if (typeof data === 'number') {
    toWrite = JSON.stringify(data)
  }
  return fs.writeFileSync(getFilePath(filename, scenario), toWrite, 'utf-8')
}
const writeFileBuffer = (filename, data, scenario) => {
  return fs.writeFileSync(getFilePath(filename, scenario), data)
}
const readFileBuffer = (filename, scenario) => {
  return fs.readFileSync(getFilePath(filename, scenario))
}
const readFile = (filename, scenario, dataType = 'utf-8') => {
  return fs.readFileSync(getFilePath(filename, scenario), dataType)
}

const MAFWhen = function (name, func) {
  const params = []
  for (let i = 0; i < func.length; i++) {
    params.push('var' + i)
  }
  // eslint-disable-next-line no-use-before-define
  let tmpFunc
  eval(`
    tmpFunc=async function(${params.join(',')}) {
      
      if(!this.results) {
        this.results={}
      }
      this.results.lastRun=await func.call(this, ...([].slice.call(arguments)))
      if(canAttach.call(this))
        this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
    }
  `)
  When(name, tmpFunc)
}

const MAFSave = function (location, obj) {
  if (!this.results) {
    this.results = {}
  }
  const loc = 'this.results.' + location
  const set = loc + '=obj'
  eval(set)
  const res = {}
  res[location] = eval(loc)
  tryAttach.call(this, res)
}
module.exports = { performJSONObjectTransform, applyJSONToString, readFile, writeFile, writeFileBuffer, readFileBuffer, getFilePath, canAttach, MAFWhen, MAFSave, filltemplate, tryAttach }
