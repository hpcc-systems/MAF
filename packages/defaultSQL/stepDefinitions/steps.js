const create = require('../index')
create({
    name: 'FAKE',
    connect: (connectionInfo, username, password) => {
        // For FAKE database, just return a mock connection
        return { isFakeConnection: true }
    },
    runQuery: (connection, query) => 'I AM NOT SQL',
    disconnect: (connection) => {
        // No-op for fake connection
    }
})

const { Given } = require('@cucumber/cucumber')
Given('set environment variable {string} to {string}', function (str1, str2) {
    process.env[str1] = str2
})
