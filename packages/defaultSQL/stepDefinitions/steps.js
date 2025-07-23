const create = require('../index')
create({
    name: 'FAKE',
    connect: () => {
        // For FAKE database, just return a mock connection
        return { isFakeConnection: true }
    },
    runQuery: () => 'I AM NOT SQL',
    disconnect: () => {
        // No-op for fake connection
    }
})

const { Given } = require('@cucumber/cucumber')
Given('set environment variable {string} to {string}', function (str1, str2) {
    process.env[str1] = str2
})
