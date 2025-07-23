require('@ln-maf/core/parameter_types')

const { Then } = require('@cucumber/cucumber')
const { fillTemplate, performJSONObjectTransform } = require('@ln-maf/core')
const validator = require('validator')

// Constants
const TIME_FUNCTIONS = {
    before: 'isBefore',
    after: 'isAfter'
}

/**
 * Converts a value to ISO date string if it's a valid timestamp
 * @param {*} value - The value to convert
 * @returns {string} ISO date string or original value
 */
const toISO = (value) => {
    if (value == null) return value

    const numericValue = Number(value)
    if (isNaN(numericValue)) {
        return value
    }

    try {
        return new Date(numericValue).toISOString()
    } catch (error) {
        return value
    }
}

/**
 * Normalizes values for comparison by converting numbers and booleans to strings
 * @param {*} value - The value to normalize
 * @returns {string|*} Normalized value
 */
const normalizeForComparison = (value) => {
    if (value == null) return value
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return value
}

/**
 * Checks if a value is a non-null object (excluding arrays)
 * @param {*} value - The value to check
 * @returns {boolean} True if value is a non-null, non-array object
 */
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Deep comparison of objects that ignores property order
 * @param {*} obj1 - First object to compare
 * @param {*} obj2 - Second object to compare
 * @returns {boolean} True if objects are deeply equal regardless of property order
 */
const deepEqual = (obj1, obj2) => {
    // Fast path for identical references
    if (obj1 === obj2) return true

    // Handle null/undefined cases
    if (obj1 == null || obj2 == null) return obj1 === obj2

    // Type check
    if (typeof obj1 !== typeof obj2) return false

    // Primitive types
    if (typeof obj1 !== 'object') return obj1 === obj2

    // Array handling
    if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2)) return false
        if (obj1.length !== obj2.length) return false

        return obj1.every((item, index) => deepEqual(item, obj2[index]))
    }

    // Ensure obj2 is not an array when obj1 is an object
    if (Array.isArray(obj2)) return false

    // Object comparison
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    const keys2Set = new Set(keys2)

    return keys1.every(key =>
        keys2Set.has(key) && deepEqual(obj1[key], obj2[key])
    )
}

/**
 * Performs equality comparison between two values using appropriate strategy
 * @param {*} value1 - First value to compare
 * @param {*} value2 - Second value to compare
 * @returns {boolean} True if values are equal
 */
const performEqualityComparison = (value1, value2) => {
    if (isObject(value1) && isObject(value2)) {
        return deepEqual(value1, value2)
    }
    if (Array.isArray(value1) && Array.isArray(value2)) {
        return deepEqual(value1, value2)
    }
    return normalizeForComparison(value1) === normalizeForComparison(value2)
}

/**
 * Safely parses JSON string, returns original value if parsing fails
 * @param {string} jsonString - String to parse as JSON
 * @returns {*} Parsed object or original string
 */
const safeJsonParse = (jsonString) => {
    try {
        return JSON.parse(jsonString)
    } catch (error) {
        return jsonString
    }
}

/**
 * Formats an error message for equality comparisons
 * @param {*} actual - The actual value
 * @param {*} expected - The expected value
 * @param {boolean} shouldEqual - Whether values should be equal
 * @returns {string} Formatted error message
 */
const formatEqualityError = (actual, expected, shouldEqual = true) => {
    const action = shouldEqual ? 'equal' : 'NOT equal'
    const expectation = shouldEqual ? '' : ' (should be different)'

    if (isObject(actual) && isObject(expected)) {
        const actualStr = JSON.stringify(actual, null, 2)
        const expectedStr = JSON.stringify(expected, null, 2)
        return `Expected actual value to ${action} expected value:\nActual: ${actualStr}\nExpected${expectation}: ${expectedStr}`
    } else {
        const actualStr = String(actual)
        const expectedStr = String(expected)
        const typeInfo = shouldEqual ? ` (type: ${typeof actual})\nExpected: "${expectedStr}" (type: ${typeof expected})` : ` (should be different): "${expectedStr}"`
        return `Expected actual value to ${action} expected value:\nActual: "${actualStr}"${typeInfo}`
    }
}

/**
 * Evaluates a comparison between two numeric values
 * @param {number} value1 - First value
 * @param {string} operator - Comparison operator
 * @param {number} value2 - Second value
 * @returns {boolean} Result of the comparison
 * @throws {Error} If operator is invalid
 */
const evaluateComparison = (value1, operator, value2) => {
    switch (operator) {
    case '=':
    case '==':
    case '===':
        return value1 === value2
    case '!=':
        return value1 !== value2
    case '>':
        return value1 > value2
    case '>=':
        return value1 >= value2
    case '<':
        return value1 < value2
    case '<=':
        return value1 <= value2
    default:
        throw new Error(`Invalid equivalence operator: ${operator}`)
    }
}

Then('{jsonObject} {validationsEquivalence} {jsonObject}', function (obj1, operator, obj2) {
    const numValue1 = Number(performJSONObjectTransform.call(this, obj1))
    const numValue2 = Number(performJSONObjectTransform.call(this, obj2))

    const result = evaluateComparison(numValue1, operator, numValue2)

    if (!result) {
        throw new Error(
            'Expected comparison to be true:\n' +
            `Actual: ${numValue1}\n` +
            `Operator: ${operator}\n` +
            `Expected: ${numValue2}\n` +
            `Result: ${numValue1} ${operator} ${numValue2} = ${result}`
        )
    }
})

/**
 * Validates date comparison using validator library
 * @param {string} dateValue1 - First date as ISO string
 * @param {string} timeQualifier - 'before' or 'after'
 * @param {string} dateValue2 - Second date as ISO string
 * @returns {boolean} True if comparison is valid
 */
const validateDateComparison = (dateValue1, timeQualifier, dateValue2) => {
    const functionName = TIME_FUNCTIONS[timeQualifier]
    if (!functionName) {
        throw new Error(`Invalid time qualifier: ${timeQualifier}`)
    }

    return validator[functionName](dateValue1, dateValue2)
}

Then('{jsonObject} is {timeQualifier} now', function (jsonObject, timeQualifier) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const dateValue = toISO(obj)
    const currentTime = new Date().toISOString()

    const isValid = validateDateComparison(dateValue, timeQualifier, currentTime)

    if (!isValid) {
        throw new Error(
            `Expected actual date to be ${timeQualifier} current time:\n` +
            `Actual: ${dateValue}\n` +
            `Current time: ${currentTime}\n` +
            `Expected: ${dateValue} should be ${timeQualifier} ${currentTime}`
        )
    }
})

Then('{jsonObject} is {timeQualifier} {jsonObject}', function (value1, timeQualifier, value2) {
    const obj1 = performJSONObjectTransform.call(this, value1)
    const obj2 = performJSONObjectTransform.call(this, value2)

    const dateValue1 = toISO(obj1)
    const dateValue2 = toISO(obj2)

    const isValid = validateDateComparison(dateValue1, timeQualifier, dateValue2)

    if (!isValid) {
        throw new Error(
            `Expected actual date to be ${timeQualifier} expected date:\n` +
            `Actual: ${dateValue1}\n` +
            `Expected: ${dateValue2}\n` +
            `Comparison: ${dateValue1} should be ${timeQualifier} ${dateValue2}`
        )
    }
})

/**
 * Checks if a value is null or undefined
 * @param {*} value - Value to check
 * @returns {boolean} True if value is null or undefined
 */
const isNullOrUndefined = (value) => value === null || value === undefined

Then('{jsonObject} is not null', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)

    if (isNullOrUndefined(obj)) {
        throw new Error(
            'Expected actual value to not be null:\n' +
            `Actual: ${obj}\n` +
            'Expected: not null/undefined'
        )
    }
})

Then('{jsonObject} is null', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)

    if (!isNullOrUndefined(obj)) {
        const objStr = typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj)
        throw new Error(
            'Expected actual value to be null:\n' +
            `Actual: ${objStr}\n` +
            'Expected: null'
        )
    }
})

Then('{jsonObject} is not equal to {jsonObject}', function (item1, item2) {
    const value1 = performJSONObjectTransform.call(this, item1)
    const value2 = performJSONObjectTransform.call(this, item2)

    if (performEqualityComparison(value1, value2)) {
        throw new Error(formatEqualityError(value1, value2, false))
    }
})

Then('{jsonObject} is equal to {jsonObject}', function (item1, item2) {
    const value1 = performJSONObjectTransform.call(this, item1)
    const value2 = performJSONObjectTransform.call(this, item2)

    if (!performEqualityComparison(value1, value2)) {
        throw new Error(formatEqualityError(value1, value2, true))
    }
})

Then('{jsonObject} is not equal to:', function (item1, templateString) {
    const value1 = performJSONObjectTransform.call(this, item1)
    const expectedString = fillTemplate(templateString, this.results)
    const expectedValue = safeJsonParse(expectedString)

    if (performEqualityComparison(value1, expectedValue)) {
        throw new Error(formatEqualityError(value1, expectedValue, false))
    }
})

Then('{jsonObject} is equal to:', function (item1, templateString) {
    const value1 = performJSONObjectTransform.call(this, item1)
    const expectedString = fillTemplate(templateString, this.results)
    const expectedValue = safeJsonParse(expectedString)

    if (!performEqualityComparison(value1, expectedValue)) {
        throw new Error(formatEqualityError(value1, expectedValue, true))
    }
})

Then('{jsonObject} contains {string}', function (jsonObject, searchString) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const processedSearchString = fillTemplate(searchString, this.results)
    const objStr = JSON.stringify(obj)

    if (!objStr.includes(processedSearchString)) {
        throw new Error(
            'Expected actual value to contain expected string:\n' +
            `Actual: ${objStr}\n` +
            `Expected to contain: "${processedSearchString}"`
        )
    }
})

Then('{jsonObject} does not contain {string}', function (jsonObject, searchString) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const processedSearchString = fillTemplate(searchString, this.results)
    const objStr = JSON.stringify(obj)

    if (objStr.includes(processedSearchString)) {
        throw new Error(
            'Expected actual value to NOT contain expected string:\n' +
            `Actual: ${objStr}\n` +
            `Expected to NOT contain: "${processedSearchString}"`
        )
    }
})

/**
 * Gets the size/length of a value
 * @param {*} value - The value to get size of
 * @returns {number} The size/length of the value
 */
const getSize = (value) => {
    if (value == null) return 0
    if (Array.isArray(value)) return value.length
    if (typeof value === 'string') return value.length
    if (typeof value === 'object') return Object.keys(value).length
    if (typeof value === 'number') return String(value).length
    return String(value).length
}

Then('{jsonObject} has a length of {int}', function (jsonObject, expectedLength) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const actualLength = getSize(obj)

    if (actualLength !== expectedLength) {
        const objType = Array.isArray(obj) ? 'array' : typeof obj
        const objStr = typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj)
        throw new Error(
            `Expected ${objType} to have length ${expectedLength}:\n` +
            `Actual: ${objStr}\n` +
            `Actual length: ${actualLength}\n` +
            `Expected length: ${expectedLength}`
        )
    }
})

Then('{jsonObject} has a length greater than {int}', function (jsonObject, expectedLength) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const actualLength = getSize(obj)

    if (actualLength <= expectedLength) {
        const objType = Array.isArray(obj) ? 'array' : typeof obj
        const objStr = typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj)
        throw new Error(
            `Expected ${objType} to have length greater than ${expectedLength}:\n` +
            `Actual: ${objStr}\n` +
            `Actual length: ${actualLength}\n` +
            `Expected: length > ${expectedLength}`
        )
    }
})

Then('{jsonObject} has a length less than {int}', function (jsonObject, expectedLength) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const actualLength = getSize(obj)

    if (actualLength >= expectedLength) {
        const objType = Array.isArray(obj) ? 'array' : typeof obj
        const objStr = typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj)
        throw new Error(
            `Expected ${objType} to have length less than ${expectedLength}:\n` +
            `Actual: ${objStr}\n` +
            `Actual length: ${actualLength}\n` +
            `Expected: length < ${expectedLength}`
        )
    }
})

Then('{jsonObject} is greater than {int}', function (itemPath, expectedValue) {
    const actualValue = performJSONObjectTransform.call(this, itemPath)
    const numActual = Number(actualValue)
    const numExpected = Number(expectedValue)

    if (isNaN(numActual)) {
        throw new Error(`Expected numeric value but got: ${JSON.stringify(actualValue)} (type: ${typeof actualValue})`)
    }

    if (numActual <= numExpected) {
        throw new Error(`Expected ${actualValue} to be greater than ${expectedValue}`)
    }
})

Then('{jsonObject} is equal to null', function (itemPath) {
    const actualValue = performJSONObjectTransform.call(this, itemPath)

    if (actualValue !== null) {
        throw new Error(`Expected null but got: ${JSON.stringify(actualValue)} (type: ${typeof actualValue})`)
    }
})
