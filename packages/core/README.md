# MAF Core

This package provides the core functionality and utilities for the MAF (Modular Automation Framework). It contains essential helper methods, template processing, and utilities that are used by other MAF packages and can be used independently in your projects.

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)

## Installation

```bash
npm install @ln-maf/core
```

## Quick Start

```javascript
const { fillTemplate, performJSONObjectTransform, MAFWhen, MAFSave } = require('@ln-maf/core')

// Template filling
const result = fillTemplate("Hello ${name}!", { name: "World" })
console.log(result) // "Hello World!"
```

## HTML Reports

On Node.js 22 or later, generate an HTML report from Cucumber JSON files in the repository-root `reports/` directory:

```bash
npx multiReport
```

The report is written to `reports/index.html`. The CLI loads the ESM-only reporter asynchronously and exits with a non-zero status if report generation fails.

Reports include:

- A compact feature/scenario summary, with charts and run metadata available in expandable sections.
- Named attachments with formatted JSON, copy/download controls, and step context.
- Movable, resizable attachment popups and compact evidence rows.
- Image/video files under `reports/assets/media/` instead of large inline media payloads.
- Downloads of the original Cucumber JSON files, which are not rewritten.

Use the MAF JSON formatter to preserve attachment names:

```bash
mkdir -p reports
npx cucumber-js -f @ln-maf/core/jsonFormatter.js:reports/report.json
npx multiReport
```

It extends Cucumber's JSON formatter with an optional attachment `name` field. Existing JSON reports remain supported; legacy API response/result wrappers are simplified only for display. Update custom Cucumber configurations from `-f json:...` to the command above and rerun tests to capture new attachment names.

The layout assets and formatter ship in `@ln-maf/core`; no modifications to the third-party reporter are required. Downstream projects should update both core and API packages for the new API evidence format. Share the entire report directory, not just `index.html`, so scripts, media, and source JSON downloads remain available.

## API Reference

### performJSONObjectTransform

Performs a transform on [{jsonObject}](../validations/JSONObject.md) parameters. This method converts MAF jsonObject parameters into usable JavaScript objects.

**Usage in custom step definitions:**

```javascript
const { MAFWhen, performJSONObjectTransform } = require('@ln-maf/core')

MAFWhen("run json path {string} on {jsonObject}", function (jPath, jsonObject) {
  const jp = require('jsonpath')
  const obj = performJSONObjectTransform.call(this, jsonObject)
  return jp.query(obj, jPath)
})
```

**Parameters:**

- `jsonObject` - A MAF jsonObject parameter (can be a file reference, item reference, or direct JSON)

**Returns:** The transformed JavaScript object

### MAFWhen

Creates a Cucumber `When` step definition where the return value is automatically stored and can be accessed with the keyword `it` in subsequent steps.

**Basic Usage:**

```javascript
const { MAFWhen } = require('@ln-maf/core')

MAFWhen("calculate {int} plus {int}", function (a, b) {
  return a + b  // This result gets stored as "it"
})
```

**In Feature Files:**

```gherkin
When calculate 5 plus 3
Then it is equal to 8
```

**Parameters:**

- `pattern` - Cucumber step pattern (string or regex)
- `implementation` - Function that implements the step logic
- `options` - Optional `{ attachResult: false }` for steps that emit their own evidence. The result is still stored as `lastRun`/`it`.

Defined results are attached once as `Step result`, without an extra `lastRun` wrapper. Steps returning `undefined` do not create an empty result attachment.

### MAFSave

Saves an object to the MAF global storage to be used by subsequent steps and JSON transforms.

**Usage:**

```javascript
const { MAFSave } = require('@ln-maf/core')

// In a step definition
MAFSave.call(this, "response", apiResponse)
MAFSave.call(this, "userId", user.id)
MAFSave.call(this, "config", { timeout: 5000, retries: 3 })
```

**Parameters:**

- `key` - String key to store the value under
- `value` - Any JavaScript value to store
- `options` - Optional `{ attach: false }` to save a value without attaching it again.

By default, the value is attached as `Value: <key>`, without an extra object wrapper. This does not change how saved items are referenced.

### tryAttach

Attaches evidence when automatic attachments are enabled. Objects, arrays, numbers, booleans, and `null` use `application/json`; strings use `text/plain`. Buffers retain their bytes and accept an explicit MIME type.

```javascript
const { tryAttach } = require('@ln-maf/core')

tryAttach.call(this, payload, { fileName: 'Request payload' })
tryAttach.call(this, logText, { mediaType: 'text/plain', fileName: 'Command output' })
tryAttach.call(this, screenshotBuffer, { mediaType: 'image/png', fileName: 'Screenshot' })
```

The existing string MIME argument is still supported. Set item `attach` to `"false"` to disable automatic evidence. Explicit attachment steps, such as attaching a blob, continue to attach when requested.

### readFile

Reads a file using the MAF directory configuration. Uses `this.results.directory` if configured, otherwise reads from the current directory.

**Usage:**

```javascript
const { readFile } = require('@ln-maf/core')

// In a step definition
const content = readFile.call(this, "test-data.json")
const config = readFile.call(this, "config/settings.yaml")
```

**Parameters:**

- `filename` - Path to the file to read

**Returns:** File contents as a string

### fillTemplate

Processes template literals in strings, similar to JavaScript template literals but with additional MAF-specific features.

**Basic Usage:**

```javascript
const { fillTemplate } = require('@ln-maf/core')

const result = fillTemplate("Hello ${name}!", { name: "World" })
console.log(result) // "Hello World!"

// With multiple variables
const template = "User ${user.name} has ${user.points} points"
const data = { user: { name: "John", points: 150 } }
const result = fillTemplate(template, data)
console.log(result) // "User John has 150 points"
```

**Advanced Usage:**

```javascript
// JavaScript expressions
const result = fillTemplate("Today is ${new Date().toISOString()}", {})

// Mathematical operations
const calc = fillTemplate("Total: ${price * quantity}", { price: 10, quantity: 3 })
console.log(calc) // "Total: 30"
```

**JSON Template Processing:**

```javascript
const { fillTemplate } = require('@ln-maf/core')

const jsonTemplate = {
  "url": "https://api.example.com/users/${userId}",
  "headers": {
    "Authorization": "Bearer ${token}"
  },
  "timeout": "${config.timeout}"
}

const data = {
  userId: 123,
  token: "abc123",
  config: { timeout: 5000 }
}

const result = fillTemplate(jsonTemplate, data)
// Result:
// {
//   "url": "https://api.example.com/users/123",
//   "headers": {
//     "Authorization": "Bearer abc123"
//   },
//   "timeout": "5000"
// }
```

**Parameters:**

- `template` - String or object containing template expressions
- `data` - Object containing values to substitute

**Returns:** Processed template with variables substituted

### Key Features

**Template Literal Processing:**

- Supports `${variable}` syntax for variable substitution
- Supports nested object access: `${user.profile.name}`
- Supports JavaScript expressions: `${Math.random()}`
- Supports array access: `${items[0].name}`

**JSON Safety:**

- All `"${expression}"` are automatically wrapped with `JSON.stringify()` to prevent invalid JSON
- Handles special characters and escaping automatically

**MAF Integration:**

- Works seamlessly with MAF's global storage system
- Integrates with jsonObject parameter types
- Supports file-based template loading

## ~~applyJSONToString~~ (Deprecated)

This method has been deprecated. Use `fillTemplate` instead.

## Examples

### Creating Custom Step Definitions

```javascript
const { MAFWhen, performJSONObjectTransform, MAFSave } = require('@ln-maf/core')

// Custom API step
MAFWhen("perform custom request with {jsonObject}", async function (requestConfig) {
  const config = performJSONObjectTransform.call(this, requestConfig)
  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: JSON.stringify(config.body)
  })
  const result = await response.json()
  
  MAFSave.call(this, "response", result)
  MAFSave.call(this, "statusCode", response.status)
  
  return result
})
```

### Template Processing Pipeline

```javascript
const { fillTemplate } = require('@ln-maf/core')

// Configuration template
const configTemplate = {
  "database": {
    "host": "${DB_HOST}",
    "port": "${DB_PORT}",
    "name": "${environment}_db"
  },
  "api": {
    "baseUrl": "https://${environment}.example.com",
    "timeout": "${config.timeout}"
  }
}

const variables = {
  DB_HOST: "localhost",
  DB_PORT: 5432,
  environment: "development",
  config: { timeout: 10000 }
}

const processedConfig = fillTemplate(configTemplate, variables)
console.log(processedConfig)
// Results in fully populated configuration object
```

---

[npm-image]: https://img.shields.io/npm/v/@ln-maf/core.svg
[npm-url]: https://www.npmjs.com/package/@ln-maf/core
