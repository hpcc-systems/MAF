require('@ln-maf/core/parameter_types')

const { Before, Given, When } = require('@cucumber/cucumber')
const { fillTemplate } = require('@ln-maf/core')
const { tryAttach } = require('@ln-maf/core')

let world = null

Before((scenario) => {
    world = scenario
})

const sleep = {
    msleep: function (n) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n) }
}

When('wait {int} milliseconds', function (milliseconds) {
    sleep.msleep(milliseconds)
})

Given('set examples', async function () {
    // Write code here that turns the phrase above into concrete actions
    const a = world
    const flatten = (acc, cumulation) => {
        if (typeof cumulation === 'undefined') {
            return acc
        }
        if (Array.isArray(cumulation)) { return [...acc, ...cumulation] } else {
            acc.push(cumulation)
            return acc
        }
    }
    let extras = a.pickle.steps.map(i => i.astNodeIds)
    extras = extras.reduce(flatten)
    let examples = a.gherkinDocument.feature.children.map(i => {
        if (!i.scenario) return []
        if (!i.scenario.examples) return []
        return i.scenario.examples.map(
            i => i.tableBody.filter(
                i => extras.includes(i.id)))
    })
        .reduce(flatten, [])
    let res = a.gherkinDocument.feature.children.map(i => {
        if (!i.scenario) return []
        return i.scenario.examples.filter(i => {
            if (!i.tableBody) return []
            return i.tableBody.map(i => extras.includes(i.id)).includes(true)
        })
    }).reduce(flatten, [])
    let headers = res.map(i => i.tableHeader.cells).reduce(flatten, [])
    headers = headers.map(i => i.value)
    examples = examples.reduce(flatten, []).map(i => i.cells).reduce(flatten, []).map(i => i.value)
    res = headers.reduce((prev, curr, i) => {
        prev[curr] = examples[i]
        return prev
    }
    , {})
    if (!this.results) {
        this.results = {}
    }
    const keys = Object.keys(res)
    for (let key in keys) {
        key = keys[key]
        res[key] = fillTemplate(res[key], this.results)
        this.results[key] = res[key]
    }
    tryAttach.call(this, res)
})
