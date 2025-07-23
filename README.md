# MAF - Modular Automation Framework

An expandable, fast, and easy-to-use automation framework built with the Cucumber language. MAF supports API testing and SQL testing in a simple manner, allows the usage of modules in isolation as well as in an integrated fashion, and utilizes the Cucumber language to clearly articulate intent while preserving test data for further debugging and record-keeping. The framework allows the integration of custom modules and provides a core to enable simple integration between components.

📊 **[View Example Report](https://maf-test-reports.web.app/)**

## Status

[![npm package][npm-image]][npm-url]
[![Testing Status](https://github.com/hpcc-systems/MAF/actions/workflows/Test.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/Test.yml)
[![Dependencies](https://david-dm.org/hpcc-systems/MAF.svg)](https://david-dm.org/hpcc-systems/MAF)

### Module Test Status

| Module | Status |
|--------|--------|
| API | [![API Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml) |
| AWS | [![AWS Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml) |
| MySQL | [![MySQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml) |
| PostgreSQL | [![PostgreSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml) |
| DefaultSQL | [![DefaultSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml) |
| Preprocessor | [![Preprocessor Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-preprocessor.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-preprocessor.yml) |
| Validations | [![Validations Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml) |

## Installation

### Prerequisites

- Node.js

### Setup

1. Create a new npm project:

   ```bash
   npm init
   ```

2. Install the required dependencies:

   ```bash
   npm i @cucumber/cucumber
   npm i @ln-maf/aws
   npm i @ln-maf/validations
   npm i @ln-maf/api
   npm i @ln-maf/mysql
   npm i @ln-maf/core
   npm i multiple-cucumber-html-reporter
   ```

3. Create a features directory and step definitions:

   ```bash
   mkdir features
   ```

   Create `features/steps.js` with the following content:

   ```javascript
   require('@ln-maf/core/parameter_types')
   require('@ln-maf/aws')
   require('@ln-maf/validations')
   require('@ln-maf/api')
   require('@ln-maf/mysql')
   ```

4. Configure your `package.json` to use Cucumber:

   ```json
   {
     "scripts": {
       "test": "cucumber-js -f json:test/report/report.json $EXTRAS"
     }
   }
   ```

5. Create the test report directory:

   ```bash
   mkdir -p test/report
   ```

Now you can run `npm test` to execute tests and `npx report` to generate an HTML report.

## Important Concepts

### Items

MAF stores information as items in a global object called `results`. This allows for easy access to information across steps.

**Example:**

```gherkin
When set "name" to "John"
```

Now there is an item called "name" that has the string value of "John" and can be accessed in other steps. You can validate that the name is "John" in the following ways:

```gherkin
Then item "name" is equal to "John"
```

Or using template literals:

```gherkin
Then "${name} Doe" is equal to "John Doe"
```

The first example uses a [{jsonObject}](packages/validations/JSONObject.md) to infer the item. The second example uses a template literal to access the global `results` variable. Both step definitions are provided by the [validations](packages/validations/README.md) module.

### JavaScript Injection

You can inline JavaScript code in feature files, removing the need to create full step definitions for common functions:

```gherkin
# If today was January 16, 2024
When set "currentDate" to "${moment().format('YYYY-MM-DD')}"
Then item "currentDate" is equal to "2024-01-16"
```

**Note:** Only simple functions that don't require external dependencies should be inlined. Luxon is available in the core module (moment is deprecated), so you can use Luxon functions in feature files.

## Examples

### Hello World API Example

Create `features/HelloWorldAPI.feature`:

```gherkin
Feature: View the text "Hello World"
  Scenario: Hello World
    When perform api request:
    """
    {
      "url": "http://www.mocky.io/v2/",
      "api": "5ec540242f00004cb1dc30dd",
      "method": "GET"
    }
    """
    Then status ok
    And item "response" is equal to "Hello World"
```

### Generated Report Example

```bash
➜  mafMonoRepo git:(master) bash runFeature.sh helloWorld.feature
...

1 scenario (1 passed)
3 steps (3 passed)
0m00.360s


=====================================================================================
    Multiple Cucumber HTML report generated in:

    $HOME/mafMonoRepo/test/report/index.html
=====================================================================================
```

![API Result](./APIResult.png)

### Hello World MySQL Example

This requires setting up your SQL environment. To use this:

1. Install the MySQL module: `npm i @ln-maf/mysql`
2. Run `npx mysql-configure` to set up credentials
   - It will store the config in a `sqlConfig.json` file
   - Credentials are stored using `node-keytar` in your OS's secure password storage:
     - **Windows**: Credential Vault
     - **macOS**: Keychain
     - **Linux**: libSecret

Create `features/HelloWorldSQL.feature`:

```gherkin
Feature: SQL Hello World
  Scenario: Run a query
      When mysql query from string "SELECT * FROM HelloWorld" is run
      Then it matches set from the file "helloWorldSQL.json"
```

Create `helloWorldSQL.json`:

```json
[
  {
    "id": "1",
    "hello": "world"
  },
  {
    "id": "2",
    "hello": "day"
  }
]
```

**Sample Table Structure:**

| id | hello |
|----|-------|
| 1  | world |
| 2  | day   |

### Variable Usage Example

Variables can be used within almost any step using template literals:

Create `features/HelloWorldAPI.feature`:

```gherkin
Feature: View the text "Hello World"
  Scenario: Hello World
    Given set "url" to "https://mocky.io/v2/"
    Given set "exampleLiteral" to "${5+5}Works?"
    When api request from file "helloWorld.json" is performed
    Then status ok
    And "${response}" is equal to "Hello World"
```

Create `helloWorld.json`:

```json
{
  "url": "${url}",
  "api": "5ec540242f00004cb1dc30dd",
  "method": "GET"
}
```

## Available Modules

The framework includes several modules that can be used independently or together:

- **[Core](packages/core/README.md)** - Core functionality and utilities. Essential for setting up custom cucumber steps using the `MAFWhen` function. Also handles template literal parsing for easy variable access within strings.

- **[Validations](packages/validations/README.md)** [![Validations Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml) - Helper cucumber steps for setting objects and performing validations. Includes steps like `Then item "a" is equal to 5` and `When "Hello World" is base64 encoded`.

- **[API](packages/api/README.md)** [![API Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml) - Cucumber steps for performing API calls and testing.

- **[AWS](packages/aws/README.md)** [![AWS Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml) - Cucumber steps for AWS services including S3, DynamoDB, SQS, Lambda, ECS, and CloudWatch.

- **[MySQL](packages/mysql/README.md)** [![MySQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml) - Cucumber steps for MySQL database testing.

- **[PostgreSQL](packages/postgresql/README.md)** [![PostgreSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml) - Cucumber steps for PostgreSQL database testing.

- **[DefaultSQL](packages/defaultSQL/README.md)** [![DefaultSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml) - Common SQL functionality used to create other SQL modules. Reference implementation for creating new SQL database modules.

- **[SFTP](packages/sftp/README.md)** - SFTP file transfer capabilities for testing file operations.

- **[Preprocessor](packages/preprocessor/README.md)** [![Preprocessor Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-preprocessor.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-preprocessor.yml) - Feature file preprocessing that adds information to feature files before execution.

## Developer Notes

### Monorepo Structure

MAF is organized as a monorepo using Lerna for package management. This structure allows for:

- **Independent versioning**: Each package can have its own version number
- **Cross-package dependencies**: Packages can depend on each other within the monorepo
- **Unified testing**: Run tests across all packages with a single command
- **Coordinated releases**: Version and publish related packages together

The monorepo contains the following packages:

- `@ln-maf/core` - Core functionality and utilities
- `@ln-maf/api` - API testing capabilities
- `@ln-maf/aws` - AWS services integration (S3, DynamoDB, SQS, Lambda, ECS, CloudWatch)
- `@ln-maf/validations` - Data validation and assertion steps
- `@ln-maf/mysql` - MySQL database testing
- `@ln-maf/postgresql` - PostgreSQL database testing
- `@ln-maf/defaultSQL` - Common SQL functionality
- `@ln-maf/sftp` - SFTP file transfer capabilities
- `@ln-maf/preprocessor` - Feature file preprocessing

### Adding a Module

For information on how to add a module, see [AddModule](./AddModule.md). This guide will help you create new step definitions that can be used in your project.

### Testing Modules

#### Using npm Workspaces

- `npm test -w packages/PACKAGE_NAME` - Test a specific package (e.g., `npm test -w packages/api`)

#### Using Lerna Commands

- `npm test` or `lerna run test` - Run tests across all packages in parallel
- `lerna run test --scope=@ln-maf/PACKAGE_NAME` - Test a specific package using Lerna
- `lerna run test:coverage` - Run coverage tests across all packages (if available)
- `lerna run test --stream` - Run tests with streaming output for better debugging

#### Other Useful Lerna Commands

- `lerna bootstrap` - Install dependencies and link cross-dependencies
- `lerna clean` - Remove node_modules from all packages
- `lerna ls` - List all packages in the monorepo
- `lerna changed` - Show packages that have changed since last release
- `lerna version` - Version packages that have changed
- `lerna publish` - Publish packages to npm registry

### Running Localstack

All modules can be tested locally without external dependencies, except for the AWS module. To test AWS locally, you can use a [localstack](https://github.com/localstack/localstack) Docker container.

**Current Version:** 4.6.0

**Note:** The localstack container requires access to the Docker socket to test Lambda functions.

#### Starting Localstack

```bash
docker run -d --name localstack -p 4566:4566 -v /var/run/docker.sock:/var/run/docker.sock localstack/localstack:4.6.0
```

**Command explanation:**

- `-d`: Run the container in detached mode
- `--name localstack`: Name the container "localstack"
- `-p 4566:4566`: Expose port 4566 of the container to port 4566 of the host
- `-v /var/run/docker.sock:/var/run/docker.sock`: Mount the Docker socket for Lambda support
- `localstack/localstack:4.6.0`: The image and version to use

#### Initialize Services

You can initialize or reinitialize services in localstack using the `initLocalstack.tf` file:

```bash
terraform destroy -auto-approve && terraform apply -auto-approve
```

---

[npm-image]: https://img.shields.io/npm/v/@ln-maf/core.svg
[npm-url]: https://www.npmjs.com/search?q=ln-maf
