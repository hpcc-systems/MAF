const { setDefaultTimeout } = require('@cucumber/cucumber')
const { MAFWhen, filltemplate, performJSONObjectTransform, readFile, getFilePath } = require('@ln-maf/core')
const { execSync } = require('child_process')
const { existsSync } = require('fs')

const rootPath = __dirname.replace(/\\/g, '/')
const DEFAULT_ECL_CONFIG_LOCATION = './eclConfig.json'
setDefaultTimeout(100 * 1000)

let eclConfig

// Set the eclConfig to the default path if it exists
if (existsSync(DEFAULT_ECL_CONFIG_LOCATION)) {
    eclConfig = JSON.parse(readFile(DEFAULT_ECL_CONFIG_LOCATION, this))
}

MAFWhen('{jsonObject} is converted from ecl xml to json item', async function (eclXML) {
    eclXML = performJSONObjectTransform.call(this, eclXML)
    return await convertXMLtoJSON(eclXML)
})
MAFWhen('{jsonObject} is converted from ecl xml to json', async function (eclXML) {
    eclXML = performJSONObjectTransform.call(this, eclXML)
    return await convertXMLtoJSON(eclXML)
})

MAFWhen('set ecl config from {jsonObject}', function (eclConfiguration) {
    eclConfig = performJSONObjectTransform.call(this, eclConfiguration)
    return eclConfig
})

MAFWhen('ecl query from file {string} is compiled', function (file) {
    file = getFilePath(filltemplate(file, this.results), this)
    return eclDeployCommand(file)
})

MAFWhen('ecl query from file {string} is run', function (file) {
    file = getFilePath(filltemplate(file, this.results), this)
    const workUnit = eclDeployCommand(file)
    return runECLCommand('run ' + workUnit.results).results
})

MAFWhen('work unit {string} is run', function (workUnit) {
    workUnit = filltemplate(workUnit, this.results)
    return runECLCommand('run ' + workUnit).results
})

MAFWhen('job name from workunit {string} is retrieved', async function (workUnit) {
    workUnit = filltemplate(workUnit, this.results)
    return runECLCommand('getname ' + workUnit)
})

MAFWhen('work unit {string} is retrieved', function (workUnit) {
    workUnit = filltemplate(workUnit, this.results)
    return runECLCommand('results ' + workUnit)
})

// This will check if the provided workunit status is either completed of failed with in a provided timeout period
MAFWhen('the workunit {string} is done processing within {int} minutes', async function (workUnit, timeoutMinutes) {
    workUnit = filltemplate(workUnit, this.results)
    setDefaultTimeout(timeoutMinutes * 60 * 1000)
    let output
    while (true) {
        output = runECLCommand('status -wu ' + workUnit + ' ').results
        if (output === 'completed' || output === 'failed') {
            return output
        }
        console.log(workUnit + ' current status: ' + output)
        await new Promise(resolve => setTimeout(resolve, 5 * 1000))
    }
})

/**
 * Retrieves the ECL path. This is either the ECL_PATH environment variable by default, the codeLocation.folder in eclConfig, or set to ./eclcode
 * @returns {string} The ECL path.
 */
function getPath() {
    let eclPath = process.env.ECL_PATH
    if (!eclPath) {
        if (eclConfig.codeLocation && eclConfig.codeLocation.folder) {
            eclPath = eclConfig.codeLocation.folder
        } else if (existsSync(`${rootPath}/eclcode/`)) {
            eclPath = `${rootPath}/eclcode/`
        } else {
            throw Error('Cannot find an ECL Path...\n' +
            'Check that env ECL_PATH, codeLocation.folder in eclConfig, or ./eclcode points to an ECL repo / location')
        }
    }
    eclPath = eclPath.replace(/\\ /g, ' ')
    eclPath = eclPath.replace(/ /g, '\\ ')
    return eclPath
}

function eclDeployCommand(file) {
    let eclCommandArguments = `deploy ${eclConfig.target} ${file} `

    const eclPath = getPath()
    if (eclPath && eclPath !== '') {
        eclCommandArguments += `-I "${eclPath}" `
        eclCommandArguments += `-L "${eclPath}" `
    }
    if (process.env.EXTRAPATHS) {
        eclCommandArguments += `-L "${process.env.EXTRAPATHS}" `
    }
    return runECLCommand(eclCommandArguments += '-legacy ') // Maybe remove legacy?
}

// convert ecl result (xml) to json to be consistent with other operations
async function convertXMLtoJSON(xml) {
    const result = {}
    let res = await require('xml2js').parseStringPromise(xml)
    res = res.Result.Dataset
    res.forEach((i, index) => {
        if (!i.Row) {
            return
        }
        const row = i.Row.map(j => {
            const dup = {}
            Object.keys(j).forEach((key) => {
                const value = j[key]
                if (value.length === 1) {
                    dup[key] = value[0]
                } else {
                    dup[key] = value
                }
            })
            return dup
        })
        result[`Result_${index + 1}`] = row
    })
    return result
}

function runECLCommand(eclCommand) {
    if (!eclConfig) {
        throw Error('Please define the eclConfig')
    }

    if (eclConfig.port && eclConfig.port !== '') {
        eclCommand += ` --port ${eclConfig.port} `
    }
    if (eclConfig.ssl) {
        eclCommand += ' -ssl '
    }
    if (!eclConfig.environment) {
        throw Error('Please define the environment in the eclConfig')
    }
    if (!process.env.ECL_USERNAME) {
        throw Error('Please define the ECL_USERNAME environment variable')
    }
    if (!process.env.ECL_PASSWORD) {
        throw Error('Please define the ECL_PASSWORD environment variable')
    }
    if (process.env.EXTRA_ECL_ARGS) {
        eclCommand += `${process.env.EXTRA_ECL_ARGS}`
    }
    let results
    try {
        results = execSync(`ecl ${eclCommand} -s ${eclConfig.environment} -u ${process.env.ECL_USERNAME} -pw ${process.env.ECL_PASSWORD}`).toString().trim()
    } catch (err) {
        err.message = err.message.replaceAll(/-pw \S+/g, '-pw ********')
        throw Error(err)
    }
    return {
        command: `ecl ${eclCommand} -s ${eclConfig.environment} -u ${process.env.ECL_USERNAME} -pw **********`,
        results
    }
}
