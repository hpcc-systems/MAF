const Cucumber = require('@cucumber/cucumber')
const fs = require('fs')
const path = require('path')

const { When } = Cucumber

/**
 * Tries to attach content to the current scenario if attachment is enabled.
 * @param {*} attach - The content to attach (object or string)
 * @param {string} [type='text'] - The MIME type of the attachment
 */
const tryAttach = function (attach, type = 'text') {
    if (canAttach.call(this)) {
        if (typeof attach === 'object') {
            this.attach(JSON.stringify(attach, null, 2))
        } else {
            this.attach(attach, type)
        }
    }
}

/**
 * Checks if attachment is enabled for the current scenario.
 * @returns {boolean} True if attachment is enabled, false otherwise
 */
const canAttach = function () {
    return this.results && this.results.attach !== 'false'
}

/**
 * Applies JSON parsing to a string with template filling capabilities.
 * @param {string} string - The string to process
 * @param {object} scenario - The scenario context containing results
 * @param {boolean} [fillTemplateValues=true] - Whether to fill template values
 * @returns {*} The processed string, object, or array
 */
const applyJSONToString = function (string, scenario, fillTemplateValues = true) {
    if (!scenario.results) {
        scenario.results = {}
    }
    if (!scenario.results.DateTime) {
        scenario.results.DateTime = require('luxon').DateTime
        scenario.results.moment = require('moment')
    }
    if (fillTemplateValues) {
        string = fillTemplate(string, scenario.results)
    }

    try {
        if (string.trim() !== '') {
            const obj = JSON.parse(string)
            if (typeof obj === 'object') {
                return obj
            }
        }
    } catch {
        try {
            // Try to parse as multiple JSON lines
            return string.split('\n')
                .filter(line => line.trim() !== '')
                .map(line => JSON.parse(line))
        } catch {
            // If all parsing fails, return the original string
        }
    }
    return string
}

/**
 * Retrieves the value of an item from a nested object using dot notation and array bracket notation.
 * @param {string} item - The item path to retrieve using dot notation (e.g., 'user.profile.name') and array notation (e.g., 'users[0].name')
 * @param {object} itemsList - The nested object containing the items
 * @returns {*} The value of the item, or undefined if not found
 * @throws {Error} If item is not a string or itemsList is not an object
 */
function getItemValue(item, itemsList) {
    if (typeof item !== 'string') {
        throw new Error('Item must be a string')
    }
    if (!itemsList || typeof itemsList !== 'object') {
        throw new Error('ItemsList must be an object')
    }

    let value = itemsList

    // Split the path and handle both dot notation and array bracket notation
    const pathParts = item.split('.')

    for (const pathPart of pathParts) {
        if (value === null || value === undefined) {
            return undefined
        }

        // Check if this path part contains array bracket notation
        if (pathPart.includes('[') && pathPart.includes(']')) {
            // Handle array notation like "lastRun[0]" or "users[2]"
            const arrayMatch = pathPart.match(/^([^[]+)\[(\d+)\]$/)
            if (arrayMatch) {
                const [, arrayName, index] = arrayMatch
                value = value[arrayName]
                if (value === null || value === undefined) {
                    return undefined
                }
                value = value[parseInt(index)]
            } else {
                // If bracket notation is malformed, treat as regular key
                value = value[pathPart]
            }
        } else {
            // Regular property access
            value = value[pathPart]
        }
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
    if (item.includes('__proto__') || item.includes('constructor') || item.includes('prototype')) {
        throw new Error('Invalid item key')
    }
    if (!this.results) {
        this.results = {}
    }
    const resultKey = item
    const keys = item.split('.')
    let currentItem = this.results


    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]

        // Validate key to prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            throw new Error('Invalid key detected during recursive assignment')
        }

        // Check if this key contains array bracket notation
        if (key.includes('[') && key.includes(']')) {
            const arrayMatch = key.match(/^([^[]+)[[](\d+)[\]]$/)
            if (arrayMatch) {
                const [, arrayName, index] = arrayMatch
                const arrayIndex = parseInt(index)

                // Validate arrayName to prevent prototype pollution
                if (arrayName === '__proto__' || arrayName === 'constructor' || arrayName === 'prototype') {
                    throw new Error('Invalid arrayName detected during recursive assignment')
                }

                // Initialize array if it doesn't exist
                if (!currentItem[arrayName]) {
                    currentItem[arrayName] = []
                }

                // Ensure array is large enough
                while (currentItem[arrayName].length <= arrayIndex) {
                    currentItem[arrayName].push(undefined)
                }

                // Initialize object at array index if needed
                if (!currentItem[arrayName][arrayIndex]) {
                    currentItem[arrayName][arrayIndex] = {}
                }

                currentItem = currentItem[arrayName][arrayIndex]
            } else {
                // Malformed bracket notation, treat as regular key
                if (!currentItem[key]) {
                    currentItem[key] = {}
                }
                currentItem = currentItem[key]
            }
        } else {
            // Regular property access
            if (!currentItem[key]) {
                currentItem[key] = {}
            }
            currentItem = currentItem[key]
        }
    }


    // Handle the final key (could also have array notation)
    const finalKey = keys[keys.length - 1]
    // Validate finalKey to prevent prototype pollution
    if (finalKey === '__proto__' || finalKey === 'constructor' || finalKey === 'prototype') {
        throw new Error('Invalid key detected during final assignment')
    }

    if (finalKey.includes('[') && finalKey.includes(']')) {
        const arrayMatch = finalKey.match(/^([^[]+)[[](\d+)[\]]$/)
        if (arrayMatch) {
            const [, arrayName, index] = arrayMatch
            const arrayIndex = parseInt(index)

            // Validate arrayName to prevent prototype pollution
            if (arrayName === '__proto__' || arrayName === 'constructor' || arrayName === 'prototype') {
                throw new Error('Invalid arrayName detected during final assignment')
            }

            // Initialize array if it doesn't exist
            if (!currentItem[arrayName]) {
                currentItem[arrayName] = []
            }

            // Ensure array is large enough
            while (currentItem[arrayName].length <= arrayIndex) {
                currentItem[arrayName].push(undefined)
            }

            currentItem[arrayName][arrayIndex] = itemValue
        } else {
            // Malformed bracket notation, treat as regular key
            currentItem[finalKey] = itemValue
            if (finalKey === '__proto__' || finalKey === 'constructor' || finalKey === 'prototype') {
                throw new Error('Invalid key detected during final assignment')
            }
        }
    } else {
        // Regular property assignment
        currentItem[finalKey] = itemValue
        if (finalKey === '__proto__' || finalKey === 'constructor' || finalKey === 'prototype') {
            throw new Error('Invalid key detected during final assignment')
        }
    }

    tryAttach.call(this, { [resultKey]: this.results[resultKey] })
}

/**
 * Performs object transformation based on item type.
 * @param {object} items - The items object containing type and value
 * @param {boolean} [fillTemplateValues=true] - Whether to fill template values
 * @returns {*} The transformed value based on the item type
 */
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
        if (fillTemplateValues) {
            items.value = fillTemplate(items.value, this.results)
        }
        return getItemValue(items.value, this.results)
    case 'file':
        if (fillTemplateValues) {
            items.value = fillTemplate(items.value, this.results)
        }
        return applyJSONToString(readFile(items.value, this), this, fillTemplateValues)
    case '':
    case 'string':
        return applyJSONToString(items.value, this, fillTemplateValues)
    default:
        return parseInt(items.type)
    }
}

/**
 * Constructs a file path by joining directory and filename.
 * @param {string} filename - The filename to get the path for
 * @param {object} scenario - The scenario object containing directory information
 * @returns {string} The constructed file path
 * @throws {Error} If filename or scenario is missing
 */
function getFilePath(filename, scenario) {
    if (!filename) throw new Error('getFilePath: filename is required')
    if (!scenario) throw new Error('getFilePath: scenario is required')
    let dir = ''
    if (!scenario.results) {
        scenario.results = {}
    }
    if (scenario.results.directory) {
        dir = scenario.results.directory
    }
    if (dir.trim() !== '') {
        return path.join(dir, filename)
    }
    return filename
}

/**
 * Writes data to a file with UTF-8 encoding.
 * @param {string} filename - The filename to write to
 * @param {*} data - The data to write
 * @param {object} scenario - The scenario object containing directory information
 * @returns {undefined}
 * @throws {Error} If filename or scenario is missing
 */
const writeFile = (filename, data, scenario) => {
    if (!filename || !scenario) {
        throw new Error('writeFile: filename and scenario are required')
    }
    let toWrite = data
    if (typeof data === 'number') {
        toWrite = JSON.stringify(data)
    }
    return fs.writeFileSync(getFilePath(filename, scenario), toWrite, 'utf-8')
}

/**
 * Writes binary data to a file.
 * @param {string} filename - The filename to write to
 * @param {Buffer} data - The binary data to write
 * @param {object} scenario - The scenario object containing directory information
 * @returns {undefined}
 * @throws {Error} If filename or scenario is missing
 */
const writeFileBuffer = (filename, data, scenario) => {
    if (!filename || !scenario) {
        throw new Error('writeFileBuffer: filename and scenario are required')
    }
    return fs.writeFileSync(getFilePath(filename, scenario), data)
}

/**
 * Reads binary data from a file.
 * @param {string} filename - The filename to read from
 * @param {object} scenario - The scenario object containing directory information
 * @returns {Buffer} The file contents as a buffer
 * @throws {Error} If filename or scenario is missing
 */
const readFileBuffer = (filename, scenario) => {
    if (!filename || !scenario) {
        throw new Error('readFileBuffer: filename and scenario are required')
    }
    return fs.readFileSync(getFilePath(filename, scenario))
}

/**
 * Reads text data from a file.
 * @param {string} filename - The filename to read from
 * @param {object} scenario - The scenario object containing directory information
 * @param {string} [dataType='utf-8'] - The encoding to use for reading
 * @returns {string} The file contents as a string
 * @throws {Error} If filename or scenario is missing
 */
const readFile = (filename, scenario, dataType = 'utf-8') => {
    if (!filename || !scenario) {
        throw new Error('readFile: filename and scenario are required')
    }
    return fs.readFileSync(getFilePath(filename, scenario), dataType)
}

/**
 * Creates a Cucumber When step with automatic result saving and attachment.
 * @param {string} name - The step definition pattern
 * @param {Function} func - The step implementation function
 */
function MAFWhen(name, func) {
    // Create a wrapper function that handles any number of parameters
    // We'll create a generic wrapper that uses ...args but preserve the original function's length
    const wrapperFunction = async function (...args) {
        if (!this.results) {
            this.results = {}
        }
        this.results.lastRun = await func.call(this, ...args)
        if (canAttach.call(this)) {
            this.attach(JSON.stringify({ lastRun: this.results.lastRun }, null, 2))
        }
    }

    // Preserve the original function's parameter count by setting the length property
    Object.defineProperty(wrapperFunction, 'length', {
        value: func.length,
        writable: false,
        enumerable: false,
        configurable: true
    })

    When(name, wrapperFunction)
}

/**
 * Helper function to check if a string is valid JSON
 * @param {string} str - The string to check
 * @returns {boolean} - True if valid JSON, false otherwise
 */
function isValidJSON(str) {
    try {
        JSON.parse(str)
        return true
    } catch {
        return false
    }
}

/**
 * Helper function to safely evaluate a template expression
 * @param {string} expression - The expression to evaluate
 * @param {object} variables - The variables available for evaluation
 * @returns {*} - The result of the evaluation
 */
function evaluateExpression(expression, variables) {
    const trimmedExpression = expression.trim()
    const keys = Object.keys(variables)
    const values = Object.values(variables)

    try {
        return (new Function(...keys, `return ${trimmedExpression};`))(...values)
    } catch {
        // Return the original expression if evaluation fails
        return `{${expression}}`
    }
}

/**
 * Helper function to format the result based on context
 * @param {*} result - The result to format
 * @param {boolean} isJSON - Whether the template is JSON
 * @returns {string} - The formatted result
 */
function formatResult(result, isJSON) {
    let formattedResult = result

    // Handle object/array results
    if (typeof result === 'object' && result !== null) {
        formattedResult = JSON.stringify(result, null, 2)
    } else if (typeof result === 'string' && isJSON) {
        formattedResult = JSON.stringify(result, null, 2)
    }

    // Remove extra quotes for JSON strings
    if (isJSON && typeof result === 'string' && typeof formattedResult === 'string' &&
        formattedResult.length > 1 &&
        formattedResult.startsWith('"') &&
        formattedResult.endsWith('"')) {
        formattedResult = formattedResult.slice(1, -1)
    }

    return formattedResult
}

/**
 * Fills a template string with variables from templateVars.
 * Supports ${expression} syntax for variable substitution and evaluation.
 * @param {string|object} templateString - The template string or object.
 * @param {object} templateVars - Variables to fill into the template.
 * @returns {string} - The filled template string.
 */
const fillTemplate = function (templateString, templateVars) {
    // Input validation
    if (!templateVars || typeof templateVars !== 'object') {
        templateVars = {}
    }

    // Check if the template string is valid JSON
    const isJSON = typeof templateString === 'string' && isValidJSON(templateString)

    // Create a copy of template variables to avoid mutation
    const variables = { ...templateVars }
    variables.require = require

    // Define a getter for random to generate a new number each time it's accessed
    Object.defineProperty(variables, 'random', {
        get: () => Math.floor(Math.random() * 100000),
        enumerable: true,
        configurable: true
    })

    // Convert non-string input to string
    if (typeof templateString !== 'string') {
        templateString = JSON.stringify(templateString, null, 2)
    }

    // State variables for parsing
    const bracketStack = []
    let previousChar = ''
    let result = ''

    /**
     * Appends character to either result or current bracket expression
     * @param {string} char - Character to append
     */
    const appendChar = (char) => {
        if (bracketStack.length === 0) {
            result += char
        } else {
            bracketStack[bracketStack.length - 1].expression += char
        }
    }

    // Process each character in the template string
    for (let i = 0; i < templateString.length; i++) {
        const currentChar = templateString[i]

        if (currentChar === '{') {
            const bracketInfo = {
                index: i,
                expression: '',
                isVariable: previousChar === '$'
            }

            // Handle opening bracket
            if (bracketStack.length === 0 && !bracketInfo.isVariable) {
                appendChar(currentChar)
            } else {
                bracketStack.push(bracketInfo)
            }
            previousChar = ''
        } else if (currentChar === '}') {
            // Handle closing bracket
            if (bracketStack.length > 0) {
                const bracket = bracketStack.pop()

                if (bracket.isVariable) {
                    // Evaluate the expression and append result
                    const evaluationResult = evaluateExpression(bracket.expression, variables)
                    const formattedResult = formatResult(evaluationResult, isJSON)
                    appendChar(formattedResult)
                } else {
                    // Not a variable, treat as literal text
                    appendChar(`{${bracket.expression}}`)
                }
            } else {
                appendChar(currentChar)
            }
            previousChar = ''
        } else {
            // Handle regular characters
            if (previousChar === '$' && currentChar !== '{') {
                appendChar('$')
            }

            if (currentChar !== '$') {
                appendChar(currentChar)
            }

            previousChar = currentChar
        }
    }

    // Handle any remaining unclosed brackets
    while (bracketStack.length > 0) {
        const bracket = bracketStack.shift()
        if (bracket.isVariable) {
            result += '$'
        }
        result += `{${bracket.expression}`
    }

    // Handle trailing $
    if (previousChar === '$') {
        result += '$'
    }

    return result
}

module.exports = {
    // Template and data processing functions
    fillTemplate,
    applyJSONToString,
    performJSONObjectTransform,

    // File operations
    readFile,
    writeFile,
    readFileBuffer,
    writeFileBuffer,
    getFilePath,

    // Cucumber and testing utilities
    MAFWhen,
    MAFSave,
    tryAttach,
    canAttach
}
