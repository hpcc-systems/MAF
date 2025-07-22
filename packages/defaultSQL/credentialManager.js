const util = require('util')
const prompt = require('prompt')

/**
 * Comprehensive credential management for database connections
 * Handles storing, retrieving, checking, and clearing credentials
 * Supports multiple storage backends: environment variables, keytar (optional), and file-based storage
 */
class CredentialManager {
    /**
     * Get the credential storage backend
     * @returns {Object} Credential storage backend with keytar-compatible interface
     */
    static getCredentialStore() {
        // Try keytar first if available (backward compatibility)
        try {
            return require('keytar')
        } catch {
            // Fall back to file-based storage if keytar is not available
            const FileCredentialStore = require('./fileCredentialStore')
            return new FileCredentialStore()
        }
    }

    /**
     * Retrieves database credentials from either keytar (secure storage) or environment variables
     * @param {string} environment - Environment identifier (e.g., 'sql.localhost.testdb')
     * @returns {Promise<{username: string, password: string}>} Database credentials
     */
    static async getCredentials(environment) {
        if (!environment) {
            throw new Error('Environment parameter is required')
        }

        // Use environment variables when USE_ENV_VARIABLES is set to 'TRUE'
        if (process.env.USE_ENV_VARIABLES === 'TRUE') {
            const dbNameMatch = environment.match(/^([^.]*)/)
            if (!dbNameMatch) {
                throw new Error(`Invalid environment format: ${environment}. Expected format: 'dbname.host.database'`)
            }

            const dbName = dbNameMatch[1].toUpperCase()
            const usernameKey = `${dbName}_SQL_USERNAME`
            const passwordKey = `${dbName}_SQL_PASSWORD`

            return {
                username: process.env[usernameKey],
                password: process.env[passwordKey]
            }
        }

        // Use keytar for secure credential storage
        try {
            const credentialStore = CredentialManager.getCredentialStore()
            const username = await credentialStore.getPassword(environment, 'username')
            const password = await credentialStore.getPassword(environment, 'password') || ''

            return { username, password }
        } catch (error) {
            throw new Error(`Failed to retrieve credentials from storage: ${error.message}`)
        }
    }

    /**
     * Checks if credentials exist for an environment and prompts for them if needed
     * @param {string} environment - Environment identifier (e.g., 'sql.localhost.testdb')
     * @param {boolean} skipIfNotRequired - Skip prompting if credentials already exist
     * @returns {Promise<void>}
     */
    static async checkCredentials(environment, skipIfNotRequired = false) {
        if (!environment) {
            throw new Error('Environment parameter is required')
        }

        // Skip credential check when using environment variables
        if (process.env.USE_ENV_VARIABLES === 'TRUE') {
            console.log('Using environment variables for credentials')
            return
        }

        try {
            const credentialStore = CredentialManager.getCredentialStore()

            /**
             * Check if a password exists for a service/account combination
             * @param {string} service - Service name
             * @param {string} account - Account name
             * @returns {Promise<boolean>}
             */
            const hasPassword = async (service, account) => {
                const password = await credentialStore.getPassword(service, account)
                return password !== null
            }

            const credentialsExist = await hasPassword(environment, 'username')

            // Skip if credentials exist and skipIfNotRequired is true
            if (credentialsExist && skipIfNotRequired) {
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
                await credentialStore.setPassword(environment, 'username', result.username)

                if (result.password) {
                    await credentialStore.setPassword(environment, 'password', result.password)
                    console.log('Password stored successfully')
                }
            }
        } catch (error) {
            throw new Error(`Failed to check/set credentials: ${error.message}`)
        }
    }

    /**
     * Sets database credentials in secure storage
     * @param {string} environment - Environment identifier
     * @param {string} username - Database username
     * @param {string} password - Database password
     * @returns {Promise<void>}
     */
    static async setCredentials(environment, username, password) {
        if (!environment || !username) {
            throw new Error('Environment and username parameters are required')
        }

        try {
            const credentialStore = CredentialManager.getCredentialStore()
            await credentialStore.setPassword(environment, 'username', username)
            
            if (password) {
                await credentialStore.setPassword(environment, 'password', password)
            }

            console.log(`Credentials stored successfully for environment: ${environment}`)
        } catch (error) {
            throw new Error(`Failed to set credentials: ${error.message}`)
        }
    }

    /**
     * Clears stored database credentials from secure storage
     * @param {string} environment - Environment identifier (e.g., 'sql.localhost.testdb')
     * @returns {Promise<void>}
     */
    static async clearCredentials(environment) {
        if (!environment) {
            throw new Error('Environment parameter is required')
        }

        try {
            const credentialStore = CredentialManager.getCredentialStore()

            // Clear both username and password
            await credentialStore.deletePassword(environment, 'username')
            await credentialStore.deletePassword(environment, 'password')

            console.log(`Credentials cleared for environment: ${environment}`)
        } catch (error) {
            throw new Error(`Failed to clear credentials: ${error.message}`)
        }
    }
}

module.exports = CredentialManager
