const userInfo = require('./userInfo')

/**
 * Establishes a PostgreSQL database connection
 * @param {Object} connectionInfo - Database connection configuration
 * @param {string} connectionInfo.host - Database host
 * @param {number} connectionInfo.port - Database port
 * @param {string} connectionInfo.database - Database name
 * @returns {Promise<Client>} Connected PostgreSQL client
 */
const connect = async function (connectionInfo) {
    if (!connectionInfo) {
        throw new Error('Connection info is required')
    }

    const { host, database } = connectionInfo
    if (!host || !database) {
        throw new Error('Connection info must include host and database')
    }

    try {
        const { Client } = require('pg')

        // Get user credentials
        const environment = `pgsql.${host}.${database}`
        const credentials = await userInfo(environment)

        if (!credentials.username) {
            throw new Error(`No username found for environment: ${environment}`)
        }

        // Create and connect client
        const client = new Client({
            ...connectionInfo,
            user: credentials.username,
            password: credentials.password
        })

        await client.connect()
        return client
    } catch (error) {
        throw new Error(`Failed to connect to PostgreSQL: ${error.message}`)
    }
}

module.exports = connect
