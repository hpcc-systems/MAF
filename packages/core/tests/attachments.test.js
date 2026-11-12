const assert = require('node:assert/strict')
const { test, mock } = require('node:test')
const cucumber = require('@cucumber/cucumber')
const definitions = []

mock.method(cucumber, 'When', (pattern, implementation) => definitions.push({ pattern, implementation }))
const { tryAttach, MAFSave, MAFWhen } = require('../index')

function world(results = {}) {
    return {
        results,
        attachments: [],
        attach(data, options) {
            this.attachments.push({ data, options })
        }
    }
}

test('tryAttach emits named JSON without wrapping the value', () => {
    for (const value of [{ users: [1, 2] }, [1, 2], null, 123, false]) {
        const context = world()
        tryAttach.call(context, value, { fileName: 'Diagnostic' })
        assert.deepEqual(context.attachments[0].options, { mediaType: 'application/json', fileName: 'Diagnostic' })
        assert.deepEqual(JSON.parse(context.attachments[0].data), value)
    }
})

test('tryAttach preserves binary bytes and supports legacy MIME arguments', () => {
    const context = world()
    const bytes = Buffer.from([0, 1, 255])
    tryAttach.call(context, bytes, { mediaType: 'image/png', fileName: 'Screenshot' })
    assert.equal(context.attachments[0].data, bytes)
    assert.deepEqual(context.attachments[0].options, { mediaType: 'image/png', fileName: 'Screenshot' })
    tryAttach.call(context, 'message', 'text')
    assert.equal(context.attachments[1].options.mediaType, 'text/plain')
})

test('disabled attachments do not serialize content or change stored results', () => {
    const context = world({ attach: 'false' })
    const circular = {}
    circular.self = circular
    tryAttach.call(context, circular)
    MAFSave.call(context, 'value', circular)
    assert.equal(context.results.value, circular)
    assert.deepEqual(context.attachments, [])
})

test('MAFSave reports nested values correctly and supports saving without a duplicate attachment', () => {
    const context = world()
    MAFSave.call(context, 'user.id', 123)
    assert.equal(context.results.user.id, 123)
    assert.equal(context.attachments[0].options.fileName, 'Value: user.id')
    assert.equal(JSON.parse(context.attachments[0].data), 123)
    MAFSave.call(context, 'response', { status: 200 }, { attach: false })
    assert.deepEqual(context.results.response, { status: 200 })
    assert.equal(context.attachments.length, 1)
    MAFSave.call(context, 'missing', undefined)
    assert.equal(context.attachments[1].data, 'undefined')
    assert.equal(context.attachments[1].options.mediaType, 'text/plain')
})

test('MAFWhen preserves arity and lastRun while attaching the result once', async () => {
    MAFWhen('add {int} and {int}', function (a, b) { return a + b })
    const { implementation } = definitions.at(-1)
    assert.equal(implementation.length, 2)
    const context = world()
    await implementation.call(context, 1, 2)
    assert.equal(context.results.lastRun, 3)
    assert.equal(context.attachments.length, 1)
    assert.equal(context.attachments[0].options.fileName, 'Step result')
    assert.equal(JSON.parse(context.attachments[0].data), 3)
})

test('MAFWhen can suppress automatic evidence without changing the last result', async () => {
    const result = { response: { id: 1 } }
    MAFWhen('custom evidence', function () { return result }, { attachResult: false })
    const context = world()
    await definitions.at(-1).implementation.call(context)
    assert.equal(context.results.lastRun, result)
    assert.deepEqual(context.attachments, [])
})

test('void steps do not add empty result attachments and errors still propagate', async () => {
    MAFWhen('void step', function () {})
    const context = world()
    await definitions.at(-1).implementation.call(context)
    assert.equal(context.results.lastRun, undefined)
    assert.deepEqual(context.attachments, [])
    MAFWhen('failing step', function () { throw new Error('step failed') })
    await assert.rejects(definitions.at(-1).implementation.call(context), /step failed/)
})
