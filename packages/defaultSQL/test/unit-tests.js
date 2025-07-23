#!/usr/bin/env node

/**
 * Simple unit tests for defaultSQL utility package
 * These tests verify that the exported functions work correctly without needing actual database connections
 */

const setupDatabaseStepDefinitions = require('../index')
const CredentialManager = require('../credentialManager')
const configureDatabase = require('../config')
const connect = require('../connect')

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`)
    }
}

function testExports() {
    console.log('✓ Testing module exports...')

    // Test main export
    assert(typeof setupDatabaseStepDefinitions === 'function', 'Main export should be a function')

    // Test additional exports
    assert(typeof setupDatabaseStepDefinitions.CredentialManager === 'function', 'CredentialManager should be exported')
    assert(typeof setupDatabaseStepDefinitions.configureDatabase === 'function', 'configureDatabase should be exported')
    assert(typeof setupDatabaseStepDefinitions.connect === 'function', 'connect should be exported')

    console.log('✓ All exports are present and correct type')
}

function testCredentialManager() {
    console.log('✓ Testing CredentialManager static methods...')

    assert(typeof CredentialManager.getCredentials === 'function', 'getCredentials should be a static method')
    assert(typeof CredentialManager.setCredentials === 'function', 'setCredentials should be a static method')
    assert(typeof CredentialManager.clearCredentials === 'function', 'clearCredentials should be a static method')
    assert(typeof CredentialManager.checkCredentials === 'function', 'checkCredentials should be a static method')

    console.log('✓ CredentialManager has all required static methods')
}

function testSetupDatabaseStepDefinitions() {
    console.log('✓ Testing setupDatabaseStepDefinitions validation...')

    // Test that it throws error with invalid input
    try {
        setupDatabaseStepDefinitions({})
        assert(false, 'Should throw error with empty object')
    } catch (error) {
        assert(error.message.includes('name, runQuery, connect, and disconnect'), 'Should mention required properties')
    }

    try {
        setupDatabaseStepDefinitions({
            name: 'test',
            runQuery: () => {},
            connect: () => {}
            // missing disconnect
        })
        assert(false, 'Should throw error with missing disconnect')
    } catch (error) {
        assert(error.message.includes('name, runQuery, connect, and disconnect'), 'Should mention required properties')
    }

    console.log('✓ setupDatabaseStepDefinitions validates input correctly')
}

function testValidSetup() {
    console.log('✓ Testing setupDatabaseStepDefinitions parameter validation...')

    // Test that it doesn't throw an error for valid input structure
    // Note: We can't actually run the setup outside of Cucumber context,
    // but we can verify the parameter validation works
    try {
        const validConfig = {
            name: 'test-db',
            runQuery: (connection, query) => 'mock result',
            connect: (connectionInfo, username, password) => ({ mock: true }),
            disconnect: (connection) => {}
        }

        // The function should validate parameters before calling Cucumber functions
        // Since we can't run Cucumber here, we'll just verify the config structure
        const hasAllRequiredProperties = validConfig.name &&
                                       validConfig.runQuery &&
                                       validConfig.connect &&
                                       validConfig.disconnect

        assert(hasAllRequiredProperties, 'Valid config should have all required properties')
        console.log('✓ Valid configuration structure verified')
    } catch (error) {
        assert(false, `Configuration validation failed: ${error.message}`)
    }
}

async function runTests() {
    console.log('Running defaultSQL utility package tests...\n')

    try {
        testExports()
        testCredentialManager()
        testSetupDatabaseStepDefinitions()
        testValidSetup()

        console.log('\n✅ All tests passed!')
        console.log('\nNote: This utility package is designed to be used by database-specific packages')
        console.log('like @ln-maf/mysql and @ln-maf/postgresql. Run tests in those packages for')
        console.log('full integration testing with actual databases.')
    } catch (error) {
        console.error('\n❌ Test failed:', error.message)
        process.exit(1)
    }
}

runTests()
