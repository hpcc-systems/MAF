# Node Default SQL Setup (Utility Package)

This is a **utility package** that provides a comprehensive framework for creating SQL database modules that work with various database platforms (PostgreSQL, MySQL, MSSQL, etc.) in a Cucumber testing environment.

**Note**: This package is not meant to be used directly for database operations. Instead, use the database-specific packages like `@ln-maf/mysql` or `@ln-maf/postgresql` that build upon this utility package.

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

## Purpose

This utility package provides:

- **Database-agnostic framework**: Common patterns for any SQL database that has a Node.js driver
- **Secure credential management**: Supports multiple storage backends (environment variables, keytar, encrypted file storage)
- **Environment-based configuration**: Easy configuration management per environment
- **Cucumber integration**: Provides step definitions for database testing
- **CLI tools**: Command-line utilities for credential and configuration management

## For Database Package Developers

If you're creating a new database-specific package (e.g., for Oracle, SQLite, etc.), use this package as your foundation:

```bash
npm install @ln-maf/default-sql
```

## Basic Usage

### 1. Setting up Step Definitions

Create a step definition file in your project:

```javascript
const setupDatabaseStepDefinitions = require('@ln-maf/default-sql')

// For PostgreSQL
setupDatabaseStepDefinitions({
    name: "postgresql",
    connect: async (connectionInfo) => {
        const { Client } = require('pg')
        const client = new Client(connectionInfo)
        await client.connect()
        return client
    },
    runQuery: async (client, query) => {
        const result = await client.query(query)
        return result.rows
    },
    disconnect: async (client) => {
        await client.end()
    }
})

// For MySQL
setupDatabaseStepDefinitions({
    name: "mysql",
    connect: async (connectionInfo) => {
        const mysql = require('mysql2/promise')
        return await mysql.createConnection(connectionInfo)
    },
    runQuery: async (connection, query) => {
        const [rows] = await connection.execute(query)
        return rows
    },
    disconnect: async (connection) => {
        await connection.end()
    }
})
```

### 2. Configuration

#### Interactive Configuration

```bash
node -e "require('@ln-maf/default-sql').configureDatabase('postgresql')"
```

#### Programmatic Configuration

```javascript
const { configureDatabase } = require('@ln-maf/default-sql')
configureDatabase('postgresql')
```

#### Using Configuration Files

Create a config file (e.g., `postgresql.sqlConfig.json`):

```json
{
    "host": "localhost",
    "port": 5432,
    "database": "testdb"
}
```

### 3. Credential Management

#### Using CLI Tool

```bash
# Set credentials
node credentialCLI.js set postgresql.localhost.testdb myusername mypassword

# Get credentials
node credentialCLI.js get postgresql.localhost.testdb

# Clear credentials
node credentialCLI.js clear postgresql.localhost.testdb

# Check and prompt for credentials if needed
node credentialCLI.js check postgresql.localhost.testdb
```

#### Using Environment Variables

Set `USE_ENV_VARIABLES=TRUE` and provide:

- `POSTGRESQL_SQL_USERNAME`
- `POSTGRESQL_SQL_PASSWORD`

#### Programmatic Credential Management

```javascript
const { CredentialManager } = require('@ln-maf/default-sql')

// Set credentials
await CredentialManager.setCredentials('postgresql.localhost.testdb', 'username', 'password')

// Get credentials
const creds = await CredentialManager.getCredentials('postgresql.localhost.testdb')

// Clear credentials
await CredentialManager.clearCredentials('postgresql.localhost.testdb')
```

## Cucumber Step Definitions

### Given $MODULENAME config from {jsonObject}

Sets the database configuration for the specified module.

**Example:**

```gherkin
Given postgresql config from {"host": "localhost", "port": 5432, "database": "testdb"}
```

### When $MODULENAME query from {jsonObject} is run

Executes a SQL query and stores the result in `this.results.lastRun`.

**Examples:**

```gherkin
When postgresql query from "SELECT * FROM users" is run
When mysql query from {"query": "SELECT * FROM products WHERE id = ${productId}"} is run
```

The results are accessible in subsequent steps using `${lastRun}` or the `it` keyword.

## Advanced Usage

### Generic Database Connection

```javascript
const { connect } = require('@ln-maf/default-sql')

// Connect to any database
const connection = await connect(
    { host: 'localhost', port: 5432, database: 'mydb' },
    'postgresql',
    async (config) => {
        const { Client } = require('pg')
        const client = new Client(config)
        await client.connect()
        return client
    }
)
```

### Custom Credential Management

```javascript
const { CredentialManager } = require('@ln-maf/default-sql')

// Check if credentials exist and prompt if needed
await CredentialManager.checkCredentials('mydb.prod.server', true)
```

## File Structure

After reorganization, the module contains:

- `index.js` - Main module with step definitions and exports
- `credentialManager.js` - Unified credential management
- `config.js` - Database configuration management
- `connect.js` - Generic database connection utility
- `setCreds.js` - CLI tool for setting credentials
- `credentialCLI.js` - Comprehensive CLI for credential management

## Migration from Previous Versions

If you were using the old individual files:

- `checkCredentials.js`, `clearCredentials.js`, `userInfo.js` → Use `CredentialManager`
- `FAKEConfig.js` → Removed (was test code)
- All functionality is now available through the main module exports

## Environment Variables

- `USE_ENV_VARIABLES=TRUE` - Use environment variables instead of secure storage (keytar/file)
- `{DBNAME}_SQL_USERNAME` - Database username (when using env vars)  
- `{DBNAME}_SQL_PASSWORD` - Database password (when using env vars)

## Credential Storage Options

This package supports three methods for storing database credentials:

1. **Environment Variables** (Recommended for CI/CD)
   - Set `USE_ENV_VARIABLES=TRUE`
   - No installation dependencies required
   - Credentials not stored persistently

2. **Keytar** (System Keychain) - Optional
   - Install with: `npm install keytar`
   - Uses OS-native credential storage
   - Most secure for desktop development

3. **Encrypted File Storage** (Automatic Fallback)
   - Used automatically when keytar is not available
   - Stores encrypted credentials in `~/.maf-credentials/`
   - No additional dependencies required

See `KEYTAR_MIGRATION.md` for detailed migration information.

[npm-image]: https://img.shields.io/npm/v/@ln-maf/default-sql.svg
[npm-url]: https://www.npmjs.com/package/@ln-maf/default-sql
