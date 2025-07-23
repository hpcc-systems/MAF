#!/usr/bin/env node

/**
 * Sets database credentials in secure storage using the credential manager
 * Usage: node setCreds.js <configFile> <username> <password>
 */
const fs = require('fs')
const CredentialManager = require('./credentialManager')

async function setCredentials() {
    const args = process.argv.slice(2)

    if (args.length !== 3) {
        console.error('Usage: setCreds.js <configFile> <username> <password>')
        process.exit(1)
    }

    const [configPath, username, password] = args

    try {
        // Read and parse config file
        const configContent = fs.readFileSync(configPath, 'utf8')
        const config = JSON.parse(configContent)

        if (!config.host || !config.database) {
            throw new Error('Config file must contain "host" and "database" properties')
        }

        // Create environment key
        const environment = `sql.${config.host}.${config.database}`

        // Store credentials using the credential manager
        await CredentialManager.setCredentials(environment, username, password)
    } catch (error) {
        console.error(`Error setting credentials: ${error.message}`)
        process.exit(1)
    }
}

setCredentials()
