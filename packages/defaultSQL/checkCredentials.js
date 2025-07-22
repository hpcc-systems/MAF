const util = require('util')
const prompt = require('prompt')

/**
 * Checks if credentials exist for an environment and prompts for them if needed
 * @param {string} environment - Environment identifier (e.g., 'sql.localhost.testdb')
 * @param {boolean} skipIfNotRequired - Skip prompting if credentials already exist
 * @returns {Promise<void>}
 */
const checkCredentials = async function (environment, skipIfNotRequired = false) {
    if (!environment) {
        throw new Error('Environment parameter is required')
    }

    // Skip credential check when using environment variables
    if (process.env.USE_ENV_VARIABLES === 'TRUE') {
        console.log('Using environment variables for credentials')
        return
    }

    try {
        const keytar = require('keytar')

        /**
         * Check if a password exists for a service/account combination
         * @param {string} service - Service name
         * @param {string} account - Account name
         * @returns {Promise<boolean>}
         */
        const hasPassword = async (service, account) => {
            const password = await keytar.getPassword(service, account)
            return password !== null
        }

        const credentialsExist = await hasPassword(environment, 'username')

        // Skip if credentials exist and skipIfNotRequired is true
        if (!credentialsExist === false && skipIfNotRequired) {
            console.log(`Credentials already exist for environment: ${environment}`)
            return
        }

        // Define prompt schema
        const schema = {
            properties: {
                username: {
                    description: `Please enter your username for the ${environment} environment`,
                    pattern: /^[a-zA-Z\d_-]+$/,
                    message: 'Username should contain only letters, digits, underscores and hyphens',
                    required: !credentialsExist
                },
                password: {
                    description: 'Please enter your password',
                    hidden: true,
                    required: false
                }
            }
        }

        // Prompt for credentials
        prompt.start()
        const get = util.promisify(prompt.get.bind(prompt))
        const result = await get(schema)

        // Store credentials if provided
        if (result.username) {
            console.log(`Storing username for environment: ${environment}`)
            await keytar.setPassword(environment, 'username', result.username)

            if (result.password) {
                await keytar.setPassword(environment, 'password', result.password)
                console.log('Password stored successfully')
            }
        }
    } catch (error) {
        throw new Error(`Failed to check/set credentials: ${error.message}`)
    }
}

module.exports = checkCredentials
