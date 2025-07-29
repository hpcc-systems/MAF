require('@ln-maf/core/parameter_types')

const { When } = require('@cucumber/cucumber')
const { fillTemplate } = require('@ln-maf/core')
const { MAFSave, tryAttach, performJSONObjectTransform, applyJSONToString, MAFWhen } = require('@ln-maf/core')

function setToString(location, value, scenario) {
    MAFSave.call(scenario, location, applyJSONToString(value, scenario))
}

When('set {string} to {jsonObject}', function (itemName, jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    MAFSave.call(this, itemName, obj)
})

When('set {string} to:', function (location, value) {
    setToString(location, value, this)
})

When('set {string} to', function (location, value) {
    setToString(location, value, this)
})

When('set config from json {jsonObject}', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    for (const i in obj) {
        setToString(i, obj[i], this)
    }
})

When('set:', function (dataTable) {
    dataTable = dataTable.rawTable
    const indices = dataTable[0]
    let item = []
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

// Stub function to test applying parameters to ensure that command line args can be included.
When('parameters are:', function (docString) {
    this.parameters = JSON.parse(docString)
})

MAFWhen('apply parameters', function () {
    Object.assign(this.results, this.parameters)
    tryAttach.call(this, this.parameters)
})

MAFWhen('run templateString', function (docString) {
    return fillTemplate(docString, this.results)
})

MAFWhen('convert csv {jsonObject} to json', async function (obj) {
    const content = performJSONObjectTransform.call(this, obj)
    const Papa = require('papaparse')
    let res = await Papa.parse(content, {
        header: true
    })
    const keyLength = Object.keys(res.data[0]).length
    res = res.data.filter(i => Object.keys(i).length === keyLength)
    return res
})
