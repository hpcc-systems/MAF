# Add Custom Modules

Creating custom modules for MAF is straightforward when you follow the established patterns. This guide provides step-by-step instructions for creating a new module that integrates seamlessly with the MAF ecosystem.

## Module Structure

A typical MAF module follows this directory structure:

```text
packages/your-module/
├── package.json          # Module configuration and dependencies
├── index.js             # Main entry point that imports step definitions
├── README.md            # Installation and usage documentation
├── LICENSE              # License file (typically Apache-2.0)
├── CHANGELOG.md         # Version history
├── stepDefinitions/     # Cucumber step definitions
│   └── yourSteps.js
├── features/            # Feature files for testing your module
│   └── *.feature
└── test/               # Test utilities and setup
    └── report/         # Generated test reports
```

## Step 1: Create Package Structure

1. **Create your module directory:**

   ```bash
   mkdir packages/your-module
   cd packages/your-module
   ```

2. **Initialize package.json:**

   ```json
   {
     "name": "@ln-maf/your-module",
     "publishConfig": {
       "access": "public"
     },
     "version": "1.0.0",
     "description": "Description of your MAF module",
     "main": "index.js",
     "scripts": {
       "test": "mkdir -p test/report && npx cucumber-js -f json:test/report/your-module.json --require \"stepDefinitions/*.js\" features/$FEATURE_FILE && npx multiReport && mkdir -p ../../test/report && cp -r test/report/* ../../test/report",
       "test:coverage": "mkdir -p test/report && npx nyc --reporter=lcov --reporter=text --report-dir=../../coverage npx cucumber-js -f json:test/report/your-module.json --require \"stepDefinitions/*.js\" features/$FEATURE_FILE && npx multiReport && mkdir -p ../../test/report && cp -r test/report/* ../../test/report"
     },
     "license": "Apache-2.0",
     "dependencies": {
       "dependency1": "^1.0.0"
     },
     "peerDependencies": {
       "@cucumber/cucumber": ">= 12.0.0",
       "@ln-maf/core": ">= 4.0.0"
     },
     "devDependencies": {
       "@cucumber/cucumber": "^12.0.0",
       "@ln-maf/core": "file:../core",
       "@ln-maf/validations": "file:../validations",
       "multiple-cucumber-html-reporter": "3.7.0",
       "nyc": "^17.0.0"
     },
     "repository": {
       "type": "git",
       "url": "git+https://github.com/hpcc-systems/MAF.git"
     },
     "keywords": [
       "cucumber-js",
       "testing",
       "gherkin",
       "cucumber-steps"
     ],
     "bugs": {
       "url": "https://github.com/hpcc-systems/MAF/issues"
     }
   }
   ```

## Step 2: Create the Main Entry Point

Create `index.js` that imports your step definitions:

```javascript
require('./stepDefinitions/yourSteps.js')
```

## Step 3: Implement Step Definitions

Create `stepDefinitions/yourSteps.js` following MAF patterns:

```javascript
const { MAFWhen, MAFSave, performJSONObjectTransform, fillTemplate } = require('@ln-maf/core')
const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber')

// Set a reasonable timeout for your operations
setDefaultTimeout(30 * 1000)

// Example: Given step for configuration
Given('my service is configured with {jsonObject}', async function (config) {
    // Use performJSONObjectTransform to handle template variables
    const processedConfig = performJSONObjectTransform(config, this.results)
    
    // Store configuration for later use
    this.results.serviceConfig = processedConfig
})

// Example: When step that performs an action and stores results
MAFWhen('I perform action with {jsonObject}', async function (actionData) {
    // Process the input data
    const processedData = performJSONObjectTransform(actionData, this.results)
    
    // Perform your operation
    const result = await performYourOperation(processedData)
    
    // Store the result for use in subsequent steps
    this.results.lastRun = result
    this.results.actionResult = result
    
    return result
})

// Example: Helper function for your operations
async function performYourOperation(data) {
    // Your implementation here
    return { success: true, data: data }
}
```

## Step 4: Create Test Features

Create `features/yourModule.feature` to test your steps:

```gherkin
Feature: Your Module Testing
  Background:
    Given my service is configured with:
    """
    {
      "endpoint": "http://localhost:3000",
      "timeout": 5000
    }
    """

  Scenario: Basic functionality test
    When I perform action with:
    """
    {
      "action": "test",
      "data": "sample"
    }
    """
    Then item "lastRun.success" is equal to true
    And item "lastRun.data.action" is equal to "test"

  Scenario: Template variable usage
    When set "testValue" to "dynamic_data"
    And I perform action with:
    """
    {
      "action": "template_test",
      "data": "${testValue}"
    }
    """
    Then item "lastRun.data.data" is equal to "dynamic_data"
```

## Step 5: Create Documentation

Create a comprehensive `README.md`:

```markdown
# Your Module Name

Brief description of what your module does and which systems/services it integrates with.

[![npm package][npm-image]][npm-url] 
[![Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-your-module.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-your-module.yml)

## Installation

```bash
npm install @ln-maf/your-module
```

## Setup

Add the module to your step definitions file:

```javascript
require('@ln-maf/your-module')
```

## Configuration

If your module requires configuration, explain how to set it up here.

## Available Steps

### Given Steps

- `Given my service is configured with {jsonObject}` - Configures the service

### When Steps  

- `When I perform action with {jsonObject}` - Performs an action

### Then Steps

- Use standard validation steps from `@ln-maf/validations`

## Examples

```gherkin
Feature: Example Usage
  Scenario: Basic usage
    Given my service is configured with:
    """
    {
      "setting": "value"
    }
    """
    When I perform action with:
    """
    {
      "action": "test"
    }
    """
    Then item "lastRun.success" is equal to true
```

[npm-image]: https://img.shields.io/npm/v/@ln-maf/your-module.svg
[npm-url]: https://www.npmjs.com/package/@ln-maf/your-module
```

## Best Practices

### Data Storage and Retrieval

1. **Store results consistently:**

   ```javascript
   // Always store the main result in lastRun for template access
   this.results.lastRun = result
   
   // Store in named properties for specific access
   this.results.myModuleResult = result
   ```

1. **Use MAFWhen for operations that return data:**

   ```javascript
   MAFWhen('I do something', async function() {
       const result = await doSomething()
       this.results.lastRun = result
       return result
   })
   ```

### Data Processing

1. **Always use performJSONObjectTransform:**

   ```javascript
   const processedData = performJSONObjectTransform(inputData, this.results)
   ```

2. **Handle template variables in strings:**

   ```javascript
   const processedString = fillTemplate(inputString, this.results)
   ```

### Error Handling

```javascript
MAFWhen('I perform risky operation', async function() {
    try {
        const result = await riskyOperation()
        this.results.lastRun = result
        return result
    } catch (error) {
        this.results.lastError = error.message
        throw error
    }
})
```

## Testing Your Module

1. **Test locally:**

   ```bash
   cd packages/your-module
   npm test
   ```

2. **Test with coverage:**

   ```bash
   npm run test:coverage
   ```

3. **Test from MAF root:**

   ```bash
   npm test -w packages/your-module
   ```

## Integration with MAF Monorepo

1. **Update main package.json:** Add your module to the workspace configuration
2. **Add CI/CD:** Create `.github/workflows/package-your-module.yml`
3. **Update main README:** Add your module to the available modules list
4. **Add to lerna:** Your module will be automatically included in Lerna operations

## Publishing

Once your module is ready:

1. **Test thoroughly:** Ensure all tests pass
2. **Update CHANGELOG.md:** Document your changes
3. **Version appropriately:** Follow semantic versioning
4. **Publish to npm:** Use Lerna for coordinated releases

```bash
# From MAF root
lerna publish
```
