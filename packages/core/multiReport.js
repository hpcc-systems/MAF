#!/usr/bin/env node
const os = require('os')
const fs = require('fs')
const path = require('path')

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

async function generateReport() {
    const { generate } = await import('multiple-cucumber-html-reporter')
    const reportPath = path.resolve('reports')
    const customScript = path.join(__dirname, 'report-assets', 'maf-report.js')

    await generate({
        reportName: 'MAF Test Report',
        pageTitle: 'Automated execution results',
        displayDuration: true,
        humanReadableDuration: true,
        attachmentLayout: 'modal',
        modalBackdrop: true,
        modalDraggable: true,
        modalResizable: true,
        modalShowContext: true,
        externalizeMedia: true,
        customStyle: path.join(__dirname, 'report-assets', 'maf-report.css'),
        customScript,
        metadata: {
            device: os.hostname(),
            platform: {
                name: platformName,
                version: os.release()
            }
        },
        customData: {
            projectName: 'MAF',
            'Report Generated:': `${new Date()}`
        },
        jsonDir: reportPath,
        reportPath
    })
    const sourceFiles = fs.readdirSync(reportPath, { withFileTypes: true })
        .filter(file => file.isFile() && file.name.endsWith('.json'))
        .map(file => file.name).sort()
    fs.writeFileSync(path.join(reportPath, 'assets', 'js', path.basename(customScript)),
        `window.MAFReport = ${JSON.stringify({ sourceFiles })};\n${fs.readFileSync(customScript, 'utf8')}`)
}

generateReport().catch(error => {
    console.error('Failed to generate Cucumber HTML report:', error)
    process.exitCode = 1
})
