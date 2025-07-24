const setupDatabaseStepDefinitions = require('@ln-maf/default-sql')
const { Client } = require('pg')
setupDatabaseStepDefinitions({
    name: 'postgresql',
    connect: async (connectionInfo, username, password) => {
        const clientConfiguration = {
            ...(connectionInfo),
            user: username,
            password
        }
        const client = new Client(clientConfiguration)
        await client.connect()
        await client.query('SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;')
        return client
    },
    runQuery: async (connection, query) => {
        const res = await connection.query(query)
        return res.rows
    },
    disconnect: async (connection) => {
        await connection.end()
    }
})
