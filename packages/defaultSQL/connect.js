const CredentialManager = require('./credentialManager')

/**
 * Establishes a database connection using the provided database driver
 * This is a generic connector that works with any SQL database
 * @param {Object} connectionInfo - Database connection configuration
 * @param {string} connectionInfo.host - Database host
 * @param {number} connectionInfo.port - Database port
 * @param {string} connectionInfo.database - Database name
 * @param {string} databaseType - Type of database (e.g., 'mysql', 'postgresql', 'mssql')
 * @param {Function} createConnection - Function that creates the database connection
 * @returns {Promise<Object>} Connected database client
 */
const connect = async function (connectionInfo, databaseType, createConnection) {
    if (!connectionInfo) {
        throw new Error('Connection info is required')
    }

    if (!databaseType) {
        throw new Error('Database type is required')
    }

    if (!createConnection || typeof createConnection !== 'function') {
        throw new Error('createConnection function is required')
    }

    const { host, database } = connectionInfo
    if (!host || !database) {
        throw new Error('Connection info must include host and database')
    }

    try {
        // Get user credentials
        const environment = `${databaseType}.${host}.${database}`
        const credentials = await CredentialManager.getCredentials(environment)

        if (!credentials.username) {
            throw new Error(`No username found for environment: ${environment}`)
        }

        // Create connection using the provided function
        const connection = await createConnection({
            ...connectionInfo,
            user: credentials.username,
            username: credentials.username, // Some drivers use 'username' instead of 'user'
            password: credentials.password
        })

        return connection
    } catch (error) {
        throw new Error(`Failed to connect to ${databaseType}: ${error.message}`)
    }
}

module.exports = connect
