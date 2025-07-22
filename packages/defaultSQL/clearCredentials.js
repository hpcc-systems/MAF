/**
 * Clears stored database credentials from secure storage
 * @param {string} environment - Environment identifier (e.g., 'sql.localhost.testdb')
 * @returns {Promise<void>}
 */
const clearCredentials = async function (environment) {
    if (!environment) {
        throw new Error('Environment parameter is required')
    }

    try {
        const keytar = require('keytar')

        // Clear both username and password
        await keytar.deletePassword(environment, 'username')
        await keytar.deletePassword(environment, 'password')

        console.log(`Credentials cleared for environment: ${environment}`)
    } catch (error) {
        throw new Error(`Failed to clear credentials: ${error.message}`)
    }
}

module.exports = clearCredentials
