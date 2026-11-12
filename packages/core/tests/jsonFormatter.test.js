const assert = require('node:assert/strict')
const { test } = require('node:test')
const { JsonFormatter } = require('@cucumber/cucumber')
const MAFJSONFormatter = require('../jsonFormatter')

test('MAF JSON formatter preserves Cucumber data and adds attachment filenames', t => {
    const data = {
        name: 'API request',
        result: { status: 'passed' },
        embeddings: [
            { mime_type: 'application/json', data: 'e30=' },
            { mime_type: 'text/plain', data: 'bG9n' }
        ]
    }
    t.mock.method(JsonFormatter.prototype, 'getStepData', () => structuredClone(data))
    const formatter = Object.create(MAFJSONFormatter.prototype)
    const result = formatter.getStepData({ testStepAttachments: [{ fileName: 'Request (GET)' }, {}] })
    assert.deepEqual(result, {
        ...data,
        embeddings: [{ ...data.embeddings[0], name: 'Request (GET)' }, data.embeddings[1]]
    })
})

test('steps without attachments remain unchanged', t => {
    const data = { name: 'Assertion', result: { status: 'passed' } }
    t.mock.method(JsonFormatter.prototype, 'getStepData', () => data)
    const formatter = Object.create(MAFJSONFormatter.prototype)
    assert.equal(formatter.getStepData({ testStepAttachments: [] }), data)
})
