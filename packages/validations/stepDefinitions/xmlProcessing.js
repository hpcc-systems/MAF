require('@ln-maf/core/parameter_types')

const { MAFWhen } = require('@ln-maf/core')

const setNamespace = (namespace, scenario) => {
    if (!scenario.results) {
        scenario.results = {}
    }
    if (!scenario.results.namespace) {
        scenario.results.namespace = {}
    }
    scenario.results.namespace = JSON.parse(namespace)
}

MAFWhen('xPath namespace is {string}', function (namespace) {
    setNamespace(namespace, this)
})

MAFWhen('xPath namespace is', function (namespace) {
    setNamespace(namespace, this)
})

MAFWhen('add xPath namespace {string} = {string}', function (namespace, url) {
    if (!this.results) {
        this.results = {}
    }
    if (!this.results.namespace) {
        this.results.namespace = {}
    }
    this.results.namespace[namespace] = url
})

MAFWhen('run xPath {string} on item {string}', function (xPath, element) {
    if (!this.results.namespace) {
        this.results.namespace = {}
    }
    const xpath = require('xpath')
    const Dom = require('@xmldom/xmldom').DOMParser
    const doc = new Dom().parseFromString(this.results[element])
    const sel = xpath.useNamespaces(this.results.namespace)
    return sel(xPath, doc).map(i => i.toString()).join('\n')
})
