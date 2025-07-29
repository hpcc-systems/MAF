require('@ln-maf/core/parameter_types')

const { Then } = require('@cucumber/cucumber')
const chai = require('chai')
const assert = chai.assert
const { tryAttach, applyJSONToString } = require('@ln-maf/core')

const doSetsMatch = (set1, set2, scenario) => {
    const isSetsEqual = (a, b) => a.size === b.size && Array.from(a).every(value => b.has(value))
    const queryResult = new Set(set1.map(json => JSON.stringify(json, null, 2)))
    const expected = new Set(set2.map(json => JSON.stringify(json, null, 2)))
    const difference = {
        queryResult: [...queryResult].filter(x => !expected.has(x)).map(e => JSON.parse(e)),
        expected: [...expected].filter(x => !queryResult.has(x)).map(e => JSON.parse(e))
    }
    const res = isSetsEqual(expected, queryResult)
    const diffedJSON = JSON.stringify(difference, null, 2)
    tryAttach.call(scenario, diffedJSON)
    assert(res, `The difference is: ${diffedJSON}`)
}

const setMatch = function (set1, set2) {
    set1 = this.results[set1]
    set2 = this.results[set2]
    doSetsMatch(set1, set2, this)
}

const setFileMatch = function (set, file) {
    const { readFile } = require('@ln-maf/core')
    file = readFile(file, this)
    doSetsMatch(applyJSONToString(this.results[set], this), applyJSONToString(file, this), this)
}

Then('it matches the set from file {string}', function (set1) {
    return setFileMatch.call(this, 'lastRun', set1)
})

Then('the set {string} matches the set from file {string}', function (f, s) {
    const res = setFileMatch.call(this, f, s)
    return res
})

Then('the set {string} matches the set {string}', setMatch)

Then('it matches the set {string}', function (set) {
    return setMatch.call(this, 'lastRun', set)
})
