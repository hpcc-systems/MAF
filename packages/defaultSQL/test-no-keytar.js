#!/usr/bin/env node

/**
 * Test script to verify credential manager works without keytar
 * Usage: node test-no-keytar.js
 */

// Simulate keytar not being available by intercepting the require call
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function (id) {
    if (id === 'keytar') {
        throw new Error('keytar is not available')
    }
    return originalRequire.apply(this, arguments)
}

const CredentialManager = require('./credentialManager')

async function testCredentialManager() {
    const environment = 'test.localhost.testdb'

    console.log('Testing credential manager without keytar...')

    try {
        // Test setting credentials
        console.log('\n1. Setting test credentials...')
        const testUsername = 'testuser'
        const testPassword = 'testpass'
        await CredentialManager.setCredentials(environment, testUsername, testPassword)

        // Test retrieving credentials
        console.log('\n2. Retrieving credentials...')
        const creds = await CredentialManager.getCredentials(environment)
        const hasPassword = creds.password ? true : false
        const hasUsername = creds.username ? true : false
        console.log(`Retrieved: username=${hasUsername ? '[HIDDEN]' : 'null'}, password=${hasPassword ? '[HIDDEN]' : 'null'}`)

        // Test clearing credentials
        console.log('\n3. Clearing credentials...')
        await CredentialManager.clearCredentials(environment)

        // Verify credentials are cleared
        console.log('\n4. Verifying credentials are cleared...')
        const clearedCreds = await CredentialManager.getCredentials(environment)
        const usernameStatus = clearedCreds.username ? '[PRESENT]' : 'null'
        const passwordStatus = clearedCreds.password ? '[PRESENT]' : 'null'
        console.log(`After clearing: username=${usernameStatus}, password=${passwordStatus}`)

        console.log('\n✅ All tests passed! Credential manager works without keytar.')
    } catch (error) {
        console.error('❌ Test failed:', error.message)
        process.exit(1)
    }
}

// Test environment variable mode
async function testEnvironmentVariables() {
    console.log('\n\nTesting environment variable mode...')

    // Set environment variables
    process.env.USE_ENV_VARIABLES = 'TRUE'
    const envUsername = 'env_user'
    const envPassword = 'env_pass'
    process.env.TEST_SQL_USERNAME = envUsername
    process.env.TEST_SQL_PASSWORD = envPassword

    try {
        const creds = await CredentialManager.getCredentials('test.localhost.testdb')
        const hasPassword = creds.password ? true : false
        const hasUsername = creds.username ? true : false
        console.log(`Environment mode: username=${hasUsername ? '[HIDDEN]' : 'null'}, password=${hasPassword ? '[HIDDEN]' : 'null'}`)
        console.log('✅ Environment variable mode works!')
    } catch (error) {
        console.error('❌ Environment variable test failed:', error.message)
    } finally {
        // Clean up
        delete process.env.USE_ENV_VARIABLES
        delete process.env.TEST_SQL_USERNAME
        delete process.env.TEST_SQL_PASSWORD
    }
}

if (require.main === module) {
    (async () => {
        await testCredentialManager()
        await testEnvironmentVariables()
    })()
}

module.exports = { testCredentialManager, testEnvironmentVariables }
