#!/usr/bin/env node
const report = require('multiple-cucumber-html-reporter')
const os = require('os')

// Get the platform name from the os module
// Possible values are `'aix'`, `'darwin'`, `'freebsd'`, `'linux'`, `'openbsd'`, `'sunos'`, and `'win32'`.
const platformMap = {
    darwin: 'osx',
    win32: 'windows',
    freebsd: 'linux',
    openbsd: 'linux'
}
let platformName = os.platform()
if (platformMap[os.platform()]) {
    platformName = platformMap[os.platform()]
}

// Use REPORT_DIR env var if set, otherwise fall back to default
const reportDir = process.env.REPORT_DIR || 'test/report'

// Generate the report
report.generate({
    displayDuration: true,
    metadata: {
        device: os.hostname(),
        platform: {
            name: platformName,
            version: os.release()
        }
    },
    customData: {
        title: 'Run info',
        data: [
            { label: 'Report Generated:', value: `${new Date()}` }
        ]
    },
    jsonDir: `${reportDir}/`,
    reportPath: `${reportDir}/`
})
