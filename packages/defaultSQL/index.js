const { Given } = require('@cucumber/cucumber')
const { readFile } = require('@ln-maf/core')
const { MAFWhen, performJSONObjectTransform } = require('@ln-maf/core')

/**
 * Sets up database step definitions for a given SQL module
 * @param {Object} moduleInfo - Module configuration
 * @param {string} moduleInfo.name - Name of the database module (e.g., 'postgresql', 'mysql')
 * @param {Function} moduleInfo.runQuery - Function to execute SQL queries
 * @param {Function} moduleInfo.connect - Function to establish database connection
 * @param {Function} moduleInfo.disconnect - Function to close database connection
 */
const setupDatabaseStepDefinitions = function (moduleInfo) {
    const { name, runQuery, connect, disconnect } = moduleInfo

    if (!name || !runQuery || !connect || !disconnect) {
        throw new Error('moduleInfo must contain name, runQuery, connect, and disconnect functions')
    }

    // Step definition: Execute a database query
    MAFWhen(`${name} query from {jsonObject} is run`, async function (query) {
        try {
            // Get connection info from context or config file
            let connectionInfo = this.results?.[`${name}ConnectionInfo`]
            if (!connectionInfo) {
                const configFile = `${name}.sqlConfig.json`
                connectionInfo = JSON.parse(readFile(configFile, this))
            }

            // Transform the query with context variables
            const transformedQuery = performJSONObjectTransform.call(this, query)

            // Get user credentials
            const userInfoObtainer = require('./userInfo')
            const environment = `${name}.${connectionInfo.host}.${connectionInfo.database}`
            const userInfo = await userInfoObtainer(environment)

            if (!userInfo.username) {
                throw new Error(`No username found for environment: ${environment}`)
            }

            // Execute query
            const connection = await connect(connectionInfo, userInfo.username, userInfo.password)
            const result = await runQuery(connection, transformedQuery)
            await disconnect(connection)

            return result
        } catch (error) {
            throw new Error(`Failed to execute ${name} query: ${error.message}`)
        }
    })

    // Step definition: Set database configuration
    Given(`${name} config from {jsonObject}`, function (configString) {
        try {
            const config = performJSONObjectTransform.call(this, configString)

            // Validate config has required properties
            if (!config.host || !config.database) {
                throw new Error('Database config must contain "host" and "database" properties')
            }

            // Store config in test context
            this.results = this.results || {}
            this.results[`${name}ConnectionInfo`] = config
        } catch (error) {
            throw new Error(`Failed to set ${name} config: ${error.message}`)
        }
    })
}

module.exports = setupDatabaseStepDefinitions
