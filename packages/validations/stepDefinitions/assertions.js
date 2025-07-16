require('@ln-maf/core/parameter_types')

const { Then } = require('@cucumber/cucumber')
const chai = require('chai')
const assert = chai.assert
const { fillTemplate } = require('@ln-maf/core')
const { performJSONObjectTransform } = require('@ln-maf/core')

const toISO = d => {
    const val = (Number(d).valueOf())
    if (isNaN(val)) {
        return d
    }
    const date = new Date(val).toISOString()
    return date
}

Then('{jsonObject} {validationsEquivalence} {jsonObject}', function (obj1, equiv, obj2) {
    obj1 = Number(performJSONObjectTransform.call(this, obj1))
    obj2 = Number(performJSONObjectTransform.call(this, obj2))
    let result
    switch (equiv) {
    case '=':
    case '==':
    case '===':
        result = obj1 === obj2
        break
    case '!=':
        result = obj1 !== obj2
        break
    case '>':
        result = obj1 > obj2
        break
    case '>=':
        result = obj1 >= obj2
        break
    case '<':
        result = obj1 < obj2
        break
    case '<=':
        result = obj1 <= obj2
        break
    default:
        throw new Error('Invalid equivalence operator: ' + equiv)
    }
    if (!result) {
        throw new Error(JSON.stringify(obj1) + ' was not ' + equiv + ' to ' + JSON.stringify(obj2))
    }
})

Then('{jsonObject} is {timeQualifier} now', function (jsonObject, isBefore) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    const functionName = isBefore === 'before' ? 'isBefore' : 'isAfter'
    let dateIn = obj
    dateIn = toISO(dateIn)
    const validator = require('validator')
    assert(validator[functionName](dateIn, new Date().toISOString()), `${dateIn} was not ${isBefore} now`)
})

Then('{jsonObject} is {timeQualifier} {jsonObject}', function (string, isBefore, date) {
    let obj = performJSONObjectTransform.call(this, string)
    let obj2 = performJSONObjectTransform.call(this, date)
    const functionName = isBefore === 'before' ? 'isBefore' : 'isAfter'
    obj = toISO(obj)
    obj2 = toISO(obj2)
    const validator = require('validator')
    assert(validator[functionName](obj, obj2), `${obj} was not ${isBefore} ${obj2}`)
})

Then('{jsonObject} is not null', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    assert.exists(obj)
})

Then('{jsonObject} is null', function (jsonObject) {
    const obj = performJSONObjectTransform.call(this, jsonObject)
    assert.notExists(obj)
})

Then('{jsonObject} is not equal to {jsonObject}', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    item2 = performJSONObjectTransform.call(this, item2)
    if (typeof item1 === 'object' && typeof item2 === 'object') {
        assert.notDeepEqual(item1, item2)
    } else {
        assert.notEqual(item1, item2)
    }
})

Then('{jsonObject} is equal to {jsonObject}', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    item2 = performJSONObjectTransform.call(this, item2)
    if (typeof item1 === 'object' && typeof item2 === 'object') {
        assert.deepEqual(item1, item2)
    } else {
        assert.equal(item1, item2)
    }
})

Then('{jsonObject} is not equal to:', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    let expected = fillTemplate(item2, this.results)
    try {
        expected = JSON.parse(expected)
    } catch (e) { }
    if (typeof item1 === 'object' && typeof expected === 'object') {
        assert.notDeepEqual(item1, expected)
    } else {
        assert.notEqual(item1, expected)
    }
})

Then('{jsonObject} is equal to:', function (item1, item2) {
    item1 = performJSONObjectTransform.call(this, item1)
    let expected = fillTemplate(item2, this.results)
    try {
        expected = JSON.parse(expected)
    } catch (e) { }
    if (typeof item1 === 'object' && typeof expected === 'object') {
        assert.deepEqual(item1, expected)
    } else {
        assert.equal(item1, expected)
    }
})

Then('{jsonObject} contains {string}', function (jsonObject, checkString) {
    let obj = performJSONObjectTransform.call(this, jsonObject)
    checkString = fillTemplate(checkString, this.results)
    obj = JSON.stringify(obj)
    assert.isTrue(obj.includes(checkString), `String '${checkString}' is not in ${obj}`)
})

Then('{jsonObject} does not contain {string}', function (jsonObject, checkString) {
    let obj = performJSONObjectTransform.call(this, jsonObject)
    checkString = fillTemplate(checkString, this.results)
    obj = JSON.stringify(obj)
    assert.isFalse(obj.includes(checkString), `String '${checkString}' is in ${obj}`)
})
