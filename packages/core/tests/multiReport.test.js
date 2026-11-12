const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

function runReport(t, json) {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'maf-report-'))
    t.after(() => rmSync(directory, { recursive: true, force: true }))
    const reportDirectory = path.join(directory, 'test', 'report')
    mkdirSync(reportDirectory, { recursive: true })
    writeFileSync(path.join(reportDirectory, 'cucumber.json'), json)

    const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'multiReport.js')], {
        cwd: directory,
        encoding: 'utf8',
        timeout: 30000
    })
    assert.ifError(result.error)
    assert.equal(readFileSync(path.join(reportDirectory, 'cucumber.json'), 'utf8'), json)
    return { result, reportDirectory }
}

test('multiReport generates HTML from Cucumber JSON with run info and metadata', t => {
    const { result, reportDirectory } = runReport(t, JSON.stringify([{
        id: 'report-generation',
        keyword: 'Feature',
        name: 'Report generation',
        description: '',
        uri: 'features/report.feature',
        line: 1,
        elements: [{
            id: 'report-generation;passing-scenario',
            keyword: 'Scenario',
            type: 'scenario',
            name: 'Passing scenario',
            description: '',
            line: 2,
            steps: [{
                keyword: 'Given ',
                name: 'a passing step',
                line: 3,
                result: { status: 'passed', duration: 1000000 },
                embeddings: [{
                    name: 'Diagnostic JSON',
                    mime_type: 'application/json',
                    data: Buffer.from('{"id":123}').toString('base64')
                }, {
                    name: 'Screenshot',
                    mime_type: 'image/png',
                    data: Buffer.from('image bytes').toString('base64')
                }]
            }]
        }, {
            id: 'report-generation;failing-scenario',
            keyword: 'Scenario',
            type: 'scenario',
            name: 'Failing scenario',
            description: '',
            line: 5,
            steps: [{
                keyword: 'Then ',
                name: 'a failing assertion',
                line: 6,
                result: { status: 'failed', duration: 1000000, error_message: 'Expected 200 but received 500' }
            }]
        }]
    }]))

    assert.equal(result.status, 0, result.stderr)
    const index = readFileSync(path.join(reportDirectory, 'index.html'), 'utf8')
    assert.ok(index.includes('Report generation'), 'Report should include the feature name')
    assert.ok(index.includes('MAF Test Report'), 'Report should have the MAF title')
    assert.ok(index.includes('.maf-metrics'), 'Report should include the packaged compact layout')
    assert.ok(/Run info/i.test(index), 'Report should include run info')
    assert.ok(index.includes('Report Generated:'), 'Report should include the generation timestamp label')
    const timestamp = index.match(/Report Generated:\s*<\/p>\s*<p[^>]*>([^<]+)<\/p>/)?.[1]
    assert.ok(timestamp && Number.isFinite(Date.parse(timestamp)), 'Report should include a valid generation timestamp')

    const featureDirectory = path.join(reportDirectory, 'features')
    const featureFiles = readdirSync(featureDirectory).filter(file => file.endsWith('.html'))
    assert.equal(featureFiles.length, 1)
    const feature = readFileSync(path.join(featureDirectory, featureFiles[0]), 'utf8')
    assert.ok(feature.includes('Passing scenario'), 'Feature report should include the scenario')
    assert.ok(feature.includes('Failing scenario'), 'Feature report should include failed scenarios')
    assert.ok(feature.includes('Expected 200 but received 500'), 'Failure details should be preserved')
    assert.ok(feature.includes('a passing step'), 'Feature report should include the step')
    assert.ok(feature.includes(os.hostname()), 'Feature report should include the device hostname')
    assert.ok(feature.includes('Diagnostic JSON'), 'Named attachments should be preserved')
    assert.ok(feature.includes('data-resize-dir="se"'), 'Popup should be resizable')
    assert.ok(/\bmodalDraggable:\s*true/.test(feature), 'Popup should be movable')
    assert.ok(/\bmodalShowContext:\s*true/.test(feature), 'Popup should include step context')
    assert.ok(!feature.includes(`data:image/png;base64,${Buffer.from('image bytes').toString('base64')}`),
        'The screenshot payload should be externalized')
    const mediaFiles = readdirSync(path.join(reportDirectory, 'assets', 'media'))
    assert.equal(mediaFiles.length, 1)
    assert.deepEqual(readFileSync(path.join(reportDirectory, 'assets', 'media', mediaFiles[0])), Buffer.from('image bytes'))
    const script = readFileSync(path.join(reportDirectory, 'assets', 'js', 'maf-report.js'), 'utf8')
    assert.ok(script.startsWith('window.MAFReport = {"sourceFiles":["cucumber.json"]};'))
    assert.ok(feature.includes('assets/js/maf-report.js'), 'Feature pages should load packaged report behavior')
})

test('multiReport logs generation errors and exits unsuccessfully', t => {
    const { result } = runReport(t, 'invalid JSON')

    assert.equal(result.status, 1)
    assert.match(result.stderr, /Failed to generate Cucumber HTML report:/)
})
