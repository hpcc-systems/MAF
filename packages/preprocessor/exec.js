#!/usr/bin/env node
const glob = require('glob')
// eslint-disable-next-line no-unused-vars
const defaultSteps = require('./apply')
let appRoot
const commandLineArgs = require('command-line-args')
const optionDefinitions = [
    { name: 'src', type: String, defaultOption: true },
    { name: 'packageLocation', type: String }
]
const options = commandLineArgs(optionDefinitions)

if (options.src) {
    appRoot = options.src
}
if (!appRoot) {
    appRoot = require('app-root-path')
}
try {
    require(appRoot + '/apply.js')
} catch (e) {
}
let pLoc = options.packageLocation
if (!pLoc) {
    pLoc = 'features'
}

const a = glob.sync('**/*.feature', { cwd: `${appRoot}/${pLoc}` })
const fs = require('fs')
const outDir = appRoot + '/tmp/' + pLoc + '/'
if (!fs.existsSync(appRoot + '/tmp')) {
    fs.mkdirSync(appRoot + '/tmp')
}
if (!fs.existsSync(appRoot + '/tmp/' + pLoc)) {
    fs.mkdirSync(appRoot + '/tmp/' + pLoc)
}
async function run(file) {
    const fileName = file
    file = fs.readFileSync(appRoot + '/' + pLoc + '/' + file, 'utf8')
    const lines = file.split('\n')
    const result = []
    const processLine = require('./processLine')
    const gen = require('./gen')

    for (const i in lines) {
        const res = await processLine(lines[i])
        if (res !== null) {
            if (typeof res === 'object') {
                result.push(...gen(res))
            } else { result.push(res) }
        }
    }
    const path = require('path')
    const dir = path.dirname(fileName)
    fs.mkdirSync(outDir + dir, { recursive: true })
    fs.writeFileSync(outDir + fileName, result.join('\n'), 'utf8')
}
for (const i in a) {
    const fileName = a[i]
    run(fileName)
}
