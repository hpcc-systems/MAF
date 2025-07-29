#!/usr/bin/env node

/**
 * Command-line interface for managing database credentials
 * Usage:
 *   node credentialCLI.js set <environment> <username> [password]
 *   node credentialCLI.js get <environment>
 *   node credentialCLI.js clear <environment>
 *   node credentialCLI.js check <environment>
 */

const CredentialManager = require('./credentialManager')

async function main() {
    const args = process.argv.slice(2)
    
    if (args.length < 2) {
        console.log('Usage:')
        console.log('  credentialCLI.js set <environment> <username> [password]')
        console.log('  credentialCLI.js get <environment>')
        console.log('  credentialCLI.js clear <environment>')
        console.log('  credentialCLI.js check <environment>')
        process.exit(1)
    }

    const [command, environment, username, password] = args

    try {
        switch (command) {
        case 'set': {
            if (!username) {
                console.error('Username is required for set command')
                process.exit(1)
            }
            await CredentialManager.setCredentials(environment, username, password)
            break
        }
        case 'get': {
            const credentials = await CredentialManager.getCredentials(environment)
            console.log(`Username: ${credentials.username ? '[SET]' : '[NOT SET]'}`)
            console.log(`Password: ${credentials.password ? '[SET]' : '[NOT SET]'}`)
            break
        }
        case 'clear': {
            await CredentialManager.clearCredentials(environment)
            break
        }
        case 'check': {
            await CredentialManager.checkCredentials(environment)
            break
        }
        default: {
            console.error(`Unknown command: ${command}`)
            process.exit(1)
        }
        }
    } catch (error) {
        console.error(`Error: ${error.message}`)
        process.exit(1)
    }
}

main()
