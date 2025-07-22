/**
 * Retri        const dbNameMatch = environment.match(/^([^.]*)/)ves database credentials from either keytar (secure storage) or environment variables
 * @param {string} environment - Environment identifier (e.g., 'sql.localhost.testdb')
 * @returns {Promise<{username: string, password: string}>} Database credentials
 */
const getCreds = async function (environment) {
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
        const keytar = require('keytar')
        const username = await keytar.getPassword(environment, 'username')
        const password = await keytar.getPassword(environment, 'password') || ''

        return { username, password }
    } catch (error) {
        throw new Error(`Failed to retrieve credentials from keytar: ${error.message}`)
    }
}

module.exports = getCreds
