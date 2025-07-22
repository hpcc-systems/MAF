#!/usr/bin/env node
const fs = require('fs')
const prompt = require('prompt')
const cc = require('./checkCredentials')
const func = async function (name) {
    if (process.argv[2]) {
        const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'))
        cc(name + '.' + config.host + '.' + config.database)
        return
    }
    const schema = {
        properties: {
            host: {
                description: `Please enter the host you would like to access in ${name} sql`,
                required: true
            },
            port: {
                description: 'Please enter the port you would like to connect to',
                pattern: /^[\d]+$/,
                message: 'Can only be digits',
                required: true
            },
            database: {
                description: 'Please enter the database you are using',
                required: true
            }
        }
    }
    prompt.get(schema, function (err, result) {
        if (result) {
            fs.writeFileSync(name + '.sqlConfig.json', JSON.stringify(result, null, 2))
            cc(name + '.' + result.host + '.' + result.database)
        }
        if (err) {
            console.error(JSON.stringify(err))
        }
    })
}
module.exports = func
