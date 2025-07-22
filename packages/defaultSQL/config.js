#!/usr/bin/env node

const fs = require('fs')
const prompt = require('prompt')
const CredentialManager = require('./credentialManager')

/**
 * Configures database connection settings
 * Can be used in two ways:
 * 1. With config file: node config.js <configFile>
 * 2. Interactive mode: node config.js
 * @param {string} name - Database name (e.g., 'postgresql', 'mysql')
 */
const configureDatabase = async function (name) {
    if (!name) {
        throw new Error('Database name is required')
    }

    // If config file path is provided, use existing config
    if (process.argv[2]) {
        try {
            const configPath = process.argv[2]
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

            if (!config.host || !config.database) {
                throw new Error('Config file must contain "host" and "database" properties')
            }

            const environment = `${name}.${config.host}.${config.database}`
            await CredentialManager.checkCredentials(environment)
            return
        } catch (error) {
            console.error(`Error reading config file: ${error.message}`)
            process.exit(1)
        }
    }

    // Interactive configuration
    const schema = {
        properties: {
            host: {
                description: `Please enter the host for ${name} database`,
                required: true
            },
            port: {
                description: 'Please enter the port number',
                pattern: /^\d+$/,
                message: 'Port must be a number',
                required: true
            },
            database: {
                description: 'Please enter the database name',
                required: true
            }
        }
    }

    prompt.start()

    try {
        const result = await new Promise((resolve, reject) => {
            prompt.get(schema, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })

        if (result) {
            const configFile = `${name}.sqlConfig.json`
            fs.writeFileSync(configFile, JSON.stringify(result, null, 2))
            console.log(`Configuration saved to ${configFile}`)

            const environment = `${name}.${result.host}.${result.database}`
            await CredentialManager.checkCredentials(environment)
        }
    } catch (error) {
        console.error(`Configuration failed: ${error.message}`)
        process.exit(1)
    }
}

module.exports = configureDatabase
