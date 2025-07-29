require('@ln-maf/core/parameter_types')

const { When } = require('@cucumber/cucumber')
const fs = require('fs')
const { fillTemplate } = require('@ln-maf/core')
const { MAFWhen, tryAttach, writeFile, writeFileBuffer, readFileBuffer, getFilePath } = require('@ln-maf/core')

/**
 * Replaces the value of all found JSON keys in a file, using the JSON path to identify the keys
 */
When('{string} is written to file {string} on JSON path {string}', function (value, fileName, jsonPath) {
    const { readFile } = require('@ln-maf/core')
    value = fillTemplate(value, this.results)
    fileName = fillTemplate(fileName, this.results)
    jsonPath = fillTemplate(jsonPath, this.results)
    const jp = require('jsonpath')
    const fileContents = JSON.parse(readFile(fileName, this))
    jp.apply(fileContents, jsonPath, function () { return value })
    writeFile(fileName, JSON.stringify(fileContents), this)
    tryAttach.call(this, fileContents)
})

/**
 * Replaces the value of all found JSON keys in an item, using the JSON path to identify the keys
 */
When('{string} is applied to item {string} on JSON path {string}', function (value, item, jsonPath) {
    value = fillTemplate(value, this.results)
    item = fillTemplate(item, this.results)
    jsonPath = fillTemplate(jsonPath, this.results)
    const jp = require('jsonpath')
    const fileContents = this.results[item]
    value = fillTemplate(value, this.results)
    if (value.trim() !== '') {
        try {
            const tmp = JSON.parse(value)
            if (typeof tmp === 'object') {
                value = tmp
            }
        } catch { /* empty */ }
    }
    jp.apply(fileContents, jsonPath, function () { return value })
    this.results[item] = fileContents
    tryAttach.call(this, this.results[item])
})

When('{jsonObject} is written in json line delimited format to file {string}', function (item, file) {
    const { performJSONObjectTransform } = require('@ln-maf/core')
    let obj = performJSONObjectTransform.call(this, item)
    file = fillTemplate(file, this.results)
    try { obj = JSON.parse(obj) } catch { /* empty */ }
    writeFile(file, obj.map(i => JSON.stringify(i)).join('\n'), this)
})

When('{jsonObject} is written to file {string}', function (jsonObject, file) {
    const { performJSONObjectTransform } = require('@ln-maf/core')
    let obj = performJSONObjectTransform.call(this, jsonObject)
    file = fillTemplate(file, this.results)
    if (typeof (obj) === 'object') {
        obj = JSON.stringify(obj)
    }
    writeFile(file, obj, this)
})

MAFWhen('the file {string} is gzipped', function (filename) {
    filename = fillTemplate(filename, this.results)
    try {
        fs.deleteFileSync(getFilePath(filename, this))
    } catch { /* empty */ }
    const zlib = require('zlib')
    const bf = readFileBuffer(filename, this)
    const buffer = zlib.gzipSync(bf)
    writeFileBuffer(filename + '.gz', buffer, this)
    return ''
})

MAFWhen('file {string} is gzip unzipped to file {string}', function (file, fileOut) {
    file = fillTemplate(file, this.results)
    fileOut = fillTemplate(fileOut, this.results)
    const zlib = require('zlib')
    const bf = readFileBuffer(file, this)
    const buffer = zlib.unzipSync(bf)
    writeFileBuffer(fileOut, buffer, this)
    return ''
})
