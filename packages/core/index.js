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

const applyJSONToString = function (string, scenario, fillTemplateValues = true) {
    if (!scenario.results) {
        scenario.results = {}
    }
    if (!scenario.results.DateTime) {
        scenario.results.DateTime = require('luxon').DateTime
        // scenario.results.moment = require('moment')
    }
    if (fillTemplateValues) { string = fillTemplate(string, scenario.results) }
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

/**
 * Retrieves the value of an item from a nested object using dot notation.
 *
 * @param {string} item - The item to retrieve the value for.
 * @param {object} itemsList - The nested object containing the items.
 * @returns {*} - The value of the item.
 */
function getItemValue(item, itemsList) {
    let value = itemsList
    for (const key of item.split('.')) {
        value = value[key]
    }
    return value
}

/**
 * Saves an item for MAF following dot notation.
 * this.results contains the list of all items that have been saved for MAF.
 *
 * @param {string} item - The name of the item to be saved.
 * @param {any} itemValue - The value of the item to be saved.
 */
function MAFSave(item, itemValue) {
    let resultKey // The key to be used in the attachment
    if (!this.results) {
        this.results = {}
        this.results[item] = itemValue
        resultKey = item
    } else {
        const keys = item.split('.')
        item = this.results
        if (keys.length === 1) {
            item[keys] = itemValue
            resultKey = keys
        } else {
            for (let i = 0; i < keys.length - 1; i++) {
                if (!item[keys[i]]) {
                    item[keys[i]] = {}
                }
                item = item[keys[i]]
            }
            item[keys[keys.length - 1]] = itemValue
            resultKey = keys[0]
        }
    }
    tryAttach.call(this, { [resultKey]: this.results[resultKey] })
}

function performJSONObjectTransform(items, fillTemplateValues = true) {
    if (!this.results) {
        this.results = {}
    }
    if (this.results.skipFillTemplate && this.results.skipFillTemplate.toUpperCase() === 'TRUE') {
        fillTemplateValues = false
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
        if (fillTemplateValues) { items.value = fillTemplate(items.value, this.results) }
        return getItemValue(items.value, this.results)
    case 'file':
        return applyJSONToString(readFile(items.value, this), this, fillTemplateValues)
    case '':
    case 'string':
        return applyJSONToString(items.value, this, fillTemplateValues)
    default:
        return parseInt(items.type)
    }
}

function getFilePath(filename, scenario) {
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

function MAFWhen(name, func) {
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

const fillTemplate = function (templateString, templateVars) {
    // Check if the template string is a json object
    let isJSON = true
    try {
        JSON.parse(templateString)
    } catch (e) {
        isJSON = false
    }
    templateVars.random = Math.floor(Math.random() * 100000)
    if (typeof templateString !== 'string') {
        templateString = JSON.stringify(templateString, null, 2)
    }
    // Get all the items between the curly braces.
    const left = []
    let prev = false
    let retStr = ''
    const append = function (c) {
        if (left.length === 0) {
            retStr += c
        } else {
            left[left.length - 1].str += c
        }
    }
    templateVars.require = require
    const keys = Object.keys(templateVars)
    const vals = Object.values(templateVars)
    for (let i = 0; i < templateString.length; i++) {
        const c = templateString.charAt(i)
        if (c === '{') {
            const item = {
                index: i,
                str: ''
            }
            if (prev) {
                item.var = true
            }
            // If we have no items to replace the bracket should be treated as a character
            if (left.length === 0 && !prev) {
                append(c)
            } else {
                left.push(item)
            }
            prev = false
            continue
        } else if (c === '}') {
            if (left.length !== 0) {
                const l = left.pop()
                if (l.var) {
                    // Use the provided string to process
                    let str = l.str
                    str = str.trim()
                    const res = (new Function(...keys, 'return ' + str + ';'))(...vals)
                    let ret = res
                    if ((typeof res === 'string' && isJSON) || typeof res === 'object') { ret = JSON.stringify(res, null, 2) }
                    if (isJSON && typeof res === 'string' && ret.length > 1 && ret[0] === '"' && ret[ret.length - 1] === '"') {
                        ret = ret.substring(1, ret.length - 1)
                    }
                    append(ret)
                } else {
                    append('{' + l.str + '}')
                }
            } else {
                append(c)
            }
            prev = false
            continue
        } else {
            if (prev) {
                append('$')
            }
            if (c !== '$') {
                append(c)
            }
            prev = (c === '$')
        }
    }
    while (left.length !== 0) {
        const l = left.shift()
        if (l.var) {
            retStr += '$'
        }
        retStr += '{' + l.str
    }
    return retStr
}

module.exports = { performJSONObjectTransform, applyJSONToString, readFile, writeFile, writeFileBuffer, readFileBuffer, getFilePath, canAttach, MAFWhen, MAFSave, fillTemplate, tryAttach }
