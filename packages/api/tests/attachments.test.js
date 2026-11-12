const assert = require('node:assert/strict')
const { test, mock } = require('node:test')
const cucumber = require('@cucumber/cucumber')
const steps = new Map()

mock.method(cucumber, 'When', (pattern, implementation) => steps.set(pattern, implementation))
mock.method(cucumber, 'Then', () => {})
mock.method(cucumber, 'setDefaultTimeout', () => {})
require('../stepDefinitions/api')

function world() {
    return {
        results: {
            url: 'https://example.test',
            api: 'users',
            method: 'GET',
            requestConfig: { url: 'https://example.test', api: 'users', method: 'GET' }
        },
        attachments: [],
        attach(data, options) {
            this.attachments.push({ data, options })
        }
    }
}

const variants = [
    ['api request is performed', []],
    ['api request from {jsonObject} is performed', [{ type1: 'item', value: '"requestConfig"' }]],
    ['perform api request:', [JSON.stringify({ url: 'https://example.test', api: 'users', method: 'GET' })]]
]

for (const [pattern, args] of variants) {
    test(`${pattern} reports the body once while preserving response and lastRun`, async t => {
        const body = { users: [{ id: 1 }] }
        t.mock.method(global, 'fetch', async () => new Response(JSON.stringify(body), {
            status: 200, headers: { 'content-type': 'application/json' }
        }))
        const context = world()
        await steps.get(pattern).call(context, ...structuredClone(args))
        assert.deepEqual(context.results.response, body)
        assert.equal(context.results.response, context.results.lastRun.response)
        assert.equal(context.results.lastRun.status, 200)
        assert.ok(context.results.lastRun.curlCommand.startsWith('curl '))
        assert.deepEqual(context.attachments.map(item => item.options.fileName), [
            'Request (GET)', 'Response body (HTTP 200)', 'Response headers', 'cURL command'
        ])
        assert.deepEqual(JSON.parse(context.attachments[1].data), body)
    })
}

for (const retrieveType of [undefined, 'blob']) {
    test(`attachment suppression applies to ${retrieveType || 'automatic'} API retrieval`, async t => {
        t.mock.method(global, 'fetch', async () => new Response('body'))
        const context = world()
        context.results.attach = 'false'
        context.results.apiRetrieveType = retrieveType
        await steps.get('api request is performed').call(context)
        const response = context.results.response
        assert.equal(response instanceof Blob ? await response.text() : response, 'body')
        assert.deepEqual(context.attachments, [])
    })
}

test('non-image Blob responses retain their bytes, MIME type, and stored values', async t => {
    const body = JSON.stringify({ users: [{ id: 1 }] })
    t.mock.method(global, 'fetch', async () => new Response(body, {
        headers: { 'content-type': 'application/json; charset=utf-8' }
    }))
    const context = world()
    context.results.apiRetrieveType = 'blob'
    await steps.get('api request is performed').call(context)
    assert.deepEqual(context.attachments.map(item => item.options.fileName), [
        'Request (GET)', 'Response body (HTTP 200)', 'Response headers', 'cURL command'
    ])
    assert.deepEqual(context.attachments[1].data, Buffer.from(body))
    assert.equal(context.attachments[1].options.mediaType, 'application/json')
    assert.ok(context.results.response instanceof Blob)
    assert.equal(context.results.response, context.results.lastRun.response)
    assert.equal(await context.results.response.text(), body)
})

for (const retrieveType of [undefined, 'blob']) {
    test(`image responses with ${retrieveType || 'automatic'} retrieval retain one image and no empty body log`, async t => {
        const bytes = Buffer.from([0, 1, 2, 255])
        t.mock.method(global, 'fetch', async () => new Response(bytes, { headers: { 'content-type': 'image/jpeg' } }))
        const context = world()
        context.results.apiRetrieveType = retrieveType
        await steps.get('api request is performed').call(context)
        const images = context.attachments.filter(item => item.options.fileName === 'Response image (HTTP 200)')
        assert.equal(images.length, 1)
        assert.deepEqual(images[0].data, bytes)
        assert.equal(images[0].options.mediaType, 'image/jpeg')
        assert.ok(context.results.response instanceof Blob)
        assert.ok(!context.attachments.some(item => item.options.fileName.startsWith('Response body')))
    })
}

test('failed requests retain request evidence and propagate the failure', async t => {
    t.mock.method(global, 'fetch', async () => { throw new Error('connection failed') })
    const context = world()
    await assert.rejects(steps.get('api request is performed').call(context), /connection failed/)
    assert.deepEqual(context.attachments.map(item => item.options.fileName), ['Request (GET)'])
})
