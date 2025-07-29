require('@ln-maf/core/parameter_types')

const { MAFWhen } = require('@ln-maf/core')
const { fillTemplate, tryAttach } = require('@ln-maf/core')

/**
 * Sets the namespace configuration for XPath operations
 * @param {string} namespace - JSON string containing namespace mappings
 * @param {object} scenario - The test scenario context
 */
const setNamespace = (namespace, scenario) => {
    if (!scenario.results) {
        scenario.results = {}
    }
    if (!scenario.results.namespace) {
        scenario.results.namespace = {}
    }
    try {
        scenario.results.namespace = JSON.parse(namespace)
        tryAttach.call(scenario, { namespace: scenario.results.namespace })
    } catch (error) {
        throw new Error(`Invalid JSON format for namespace: ${error.message}`)
    }
}

/**
 * Initializes namespace configuration if not already set
 * @param {object} scenario - The test scenario context
 */
const initializeNamespace = (scenario) => {
    if (!scenario.results) {
        scenario.results = {}
    }
    if (!scenario.results.namespace) {
        scenario.results.namespace = {}
    }
}

/**
 * Creates a namespace resolver function for fontoxpath
 * @param {object} namespaces - Object containing prefix to URI mappings
 * @returns {function} Namespace resolver function
 */
const createNamespaceResolver = (namespaces) => {
    return (prefix) => {
        return namespaces[prefix] || null
    }
}

/**
 * Processes XPath query results based on their type
 * @param {Array} nodes - Array of DOM nodes from XPath query
 * @returns {string} Processed results joined by newlines
 */
const processXPathResults = (nodes) => {
    if (!Array.isArray(nodes)) {
        return String(nodes || '')
    }

    return nodes.map(node => {
        if (node && typeof node === 'object') {
            // Handle different node types
            if (node.nodeType === 2) { // Attribute node
                return node.value || node.nodeValue || ''
            } else if (node.nodeType === 3) { // Text node
                return node.nodeValue || node.textContent || ''
            } else if (node.textContent !== undefined) { // Element node
                return node.textContent
            } else {
                return node.toString()
            }
        }
        return String(node || '')
    }).join('\n')
}

MAFWhen('xPath namespace is {string}', function (namespace) {
    namespace = fillTemplate(namespace, this.results)
    setNamespace(namespace, this)
})

MAFWhen('xPath namespace is', function (namespace) {
    namespace = fillTemplate(namespace, this.results)
    setNamespace(namespace, this)
})

MAFWhen('add xPath namespace {string} = {string}', function (namespace, url) {
    namespace = fillTemplate(namespace, this.results)
    url = fillTemplate(url, this.results)

    initializeNamespace(this)
    this.results.namespace[namespace] = url

    tryAttach.call(this, {
        addedNamespace: { [namespace]: url },
        allNamespaces: this.results.namespace
    })
})

MAFWhen('run xPath {string} on item {string}', function (xPath, element) {
    xPath = fillTemplate(xPath, this.results)
    element = fillTemplate(element, this.results)

    initializeNamespace(this)

    if (!this.results[element]) {
        throw new Error(`Element '${element}' not found in results`)
    }

    try {
        const { evaluateXPathToNodes } = require('fontoxpath')
        const Dom = require('@xmldom/xmldom').DOMParser
        const doc = new Dom().parseFromString(this.results[element], 'text/xml')

        const nodes = evaluateXPathToNodes(xPath, doc, null, null, {
            namespaceResolver: createNamespaceResolver(this.results.namespace)
        })

        const result = processXPathResults(nodes)

        tryAttach.call(this, {
            xpath: xPath,
            element,
            namespaces: this.results.namespace,
            resultCount: Array.isArray(nodes) ? nodes.length : 1,
            result
        })

        return result
    } catch (error) {
        throw new Error(`XPath evaluation failed: ${error.message}. XPath: '${xPath}', Element: '${element}'`)
    }
})
