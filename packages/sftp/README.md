# MAF - SFTP Module

This module provides SFTP step definitions for testing file servers, enabling automated testing of file transfers and server operations.

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

## Dependencies

This module is dependent on the following npm modules:

- ssh2-sftp-client

## Setup

1. Install by running `npm i @ln-maf/sftp`

2. Add a new step file in the features folder with the following code:

```js
require('@ln-maf/sftp')
```

## Configuration

The SFTP module uses connection configuration that can be provided through:

- Environment variables (SSH_AUTH_SOCK for agent authentication)
- Global MAF variables stored in `this.results`:
  - `host` or `hostname`: The SFTP server hostname
  - `port`: The SFTP server port
  - `username`: The username for authentication
  - `password`: The password for authentication

**Note:** Username and host are required for SFTP operations.

## Step Definitions

### `When list of files from remote server directory {string} is received`

Retrieves a list of files from the specified remote server directory.

**Parameters:**

- `serverDirectory` (string): The path to the remote directory

**Returns:** Array of filenames found in the directory

**Example:**

```gherkin
When list of files from remote server directory "/uploads" is received
```

### `When file {string} is downloaded from server as file {string}`

Downloads a specific file from the remote server to a local location.

**Parameters:**

- `serverFile` (string): The full path to the file on the remote server
- `file` (string): The local filename where the file will be saved

**Returns:** The local file path where the file was downloaded

**Example:**

```gherkin
When file "/uploads/data.txt" is downloaded from server as file "downloaded_data.txt"
```

### `When latest file from server directory {string} is downloaded as file {string}`

Downloads the most recently modified file from the specified remote directory.

**Parameters:**

- `remoteDirectory` (string): The path to the remote directory
- `file` (string): The local filename where the file will be saved

**Returns:** The name of the file that was downloaded

**Example:**

```gherkin
When latest file from server directory "/uploads" is downloaded as file "latest_upload.txt"
```

### `When file {string} is put in server folder {string}`

Uploads a local file to the specified remote server directory.

**Parameters:**

- `file` (string): The local filename to upload
- `serverDirectory` (string): The remote directory path where the file will be placed

**Returns:** The remote file path where the file was uploaded

**Example:**

```gherkin
When file "test_data.txt" is put in server folder "/uploads/"
```

## Global MAF Variables

The SFTP module integrates with MAF's global variable system and supports template literals:

- **host/hostname**: SFTP server address
- **port**: SFTP server port (optional)
- **username**: Authentication username (required)
- **password**: Authentication password (required)

[npm-image]:https://img.shields.io/npm/v/@ln-maf/sftp.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/sftp
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Fsftp
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Fsftp
