#!/usr/bin/env node

/**
 * Sets database credentials in secure storage (keytar)
 * Usage: node setCreds.js <configFile> <username> <password>
 */
const fs = require('fs')

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

        // Store credentials securely
        const keytar = require('keytar')
        await keytar.setPassword(environment, 'username', username)
        await keytar.setPassword(environment, 'password', password)

        console.log(`Credentials stored successfully for environment: ${environment}`)
    } catch (error) {
        console.error(`Error setting credentials: ${error.message}`)
        process.exit(1)
    }
}

setCredentials()
