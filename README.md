# MAF - Modular Automation Framework

An expandable, fast, and easy-to-use automation framework built with the Cucumber language. MAF supports API testing and SQL testing in a simple manner, allows the usage of modules in isolation as well as in an integrated fashion, and utilizes the Cucumber language to clearly articulate intent while preserving test data for further debugging and record-keeping. The framework allows the integration of custom modules and provides a core to enable simple integration between components.

📊 **[View Example Report](https://maf-test-reports.web.app/)**

## Status

[![npm package][npm-image]][npm-url]
[![Testing Status](https://github.com/hpcc-systems/MAF/actions/workflows/Test.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/Test.yml)

### Module Test Status

| Module | Status |
|--------|--------|
| API | [![API Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml) |
| AWS | [![AWS Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml) |
| MySQL | [![MySQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml) |
| SFTP | [![SFTP Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-sftp.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-sftp.yml) |
| PostgreSQL | [![PostgreSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml) |
| DefaultSQL | [![DefaultSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml) |
| Preprocessor | [![Preprocessor Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-preprocessor.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-preprocessor.yml) |
| Validations | [![Validations Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml) |

## Installation

### Prerequisites

- Node.js v22 or greater

### Setup

1. Create a new npm project:

    ```bash
    npm init
    ```

2. Install any of the required dependencies for testing:

    ```bash
    npm i @cucumber/cucumber
    npm i @ln-maf/aws
    npm i @ln-maf/validations
    npm i @ln-maf/api
    npm i @ln-maf/mysql
    npm i @ln-maf/core
    ```

    (Optional) Install multiple-cucumber-html-reporter for reporting

    ```bash
    npm i multiple-cucumber-html-reporter
    ```

3. Create a features directory and step definitions:

   ```bash
   mkdir features
   ```

   Create `imports.js` with the following content:

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
       "test": "npx cucumber-js -f json:test/report/report.json $EXTRAS"
     }
   }
   ```

5. Create the test report directory:

   ```bash
   mkdir -p test/report
   ```

Now you can run `npm test` to execute tests and `npx multiReport` to generate an HTML report.

## Important Concepts

### Items

MAF uses a global storage system called `items` to share data between test steps. Think of it as a shared memory where you can store values with names (keys) and retrieve them later in any step.

#### How Items Work

When you store data using MAF, it gets saved in a global `results` object that persists throughout your entire test scenario. This allows you to:

- **Store data** from API responses, database queries, or manual assignments
- **Access data** in subsequent steps using the stored item name
- **Pass data** between different types of operations (API → Database → Validation)

#### Storing Items

**Basic Assignment:**

```gherkin
When set "name" to "John"
When set "age" to 25
When set "isActive" to true
```

**From API Responses:**

```gherkin
When perform api request:
"""
{
  "url": "https://api.example.com/users/1",
  "method": "GET"
}
"""
# The response automatically gets stored as item "response"
```

**From Database Queries:**

```gherkin
When mysql query from string "SELECT name FROM users WHERE id = 1" is run
# The query results get stored as item "queryResult"
```

#### Accessing Items

**Direct Item Comparison:**

```gherkin
Then item "name" is equal to "John"
Then item "age" is equal to 25
Then item "isActive" is equal to true
```

**Template Literals (Variable Substitution):**

```gherkin
# Using ${itemName} syntax to inject stored values
Then "${name} Doe" is equal to "John Doe"
Then "User ${name} is ${age} years old" is equal to "User John is 25 years old"
```

**In API Requests:**

```gherkin
When set "userId" to 123
When perform api request:
"""
{
  "url": "https://api.example.com/users/${userId}",
  "method": "GET"
}
"""
```

**In SQL Queries:**

```gherkin
When set "userEmail" to "john@example.com"
When mysql query from string "SELECT * FROM users WHERE email = '${userEmail}'" is run
```

#### Advanced Item Usage

**Complex Objects:**

```gherkin
When set "user" to:
"""
{
  "name": "John",
  "email": "john@example.com",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
"""

# Access nested properties
Then item "user.name" is equal to "John"
Then item "user.preferences.theme" is equal to "dark"
```

**JavaScript Expressions:**

```gherkin
When set "tomorrow" to "${new Date(Date.now() + 86400000).toISOString().split('T')[0]}"
When set "randomId" to "${Math.floor(Math.random() * 1000)}"
When set "calculation" to "${5 * 10 + 2}"
```

#### Common Patterns

**Data Pipeline Example:**

```gherkin
# Step 1: Create a user via API
When set "newUser" to:
"""
{
  "name": "Jane Smith",
  "email": "jane@example.com"
}
"""
When perform api request:
"""
{
  "url": "https://api.example.com/users",
  "method": "POST",
  "body": "${newUser}"
}
"""

# Step 2: Extract the created user ID from response
When set "userId" to "${response.id}"

# Step 3: Verify in database
When mysql query from string "SELECT * FROM users WHERE id = ${userId}" is run
Then item "queryResult[0].email" is equal to "jane@example.com"

# Step 4: Update the user
When perform api request:
"""
{
  "url": "https://api.example.com/users/${userId}",
  "method": "PUT",
  "body": {
    "name": "Jane Johnson"
  }
}
"""

# Step 5: Verify the update
Then item "response.name" is equal to "Jane Johnson"
```

The first example uses a [{jsonObject}](packages/validations/JSONObject.md) to reference stored items. The second example uses template literals to inject values directly into strings. Both approaches are provided by the [validations](packages/validations/README.md) module.

### JavaScript Injection

You can inline JavaScript code in feature files, removing the need to create full step definitions for common functions:

```gherkin
# If today was January 16, 2024
When set "currentDate" to "${DateTime.now().toFormat('yyyy-MM-dd')}"
Then item "currentDate" is equal to "2024-01-16"
```

**Note:** Only simple functions that don't require external dependencies should be inlined. Luxon is available in the core module (moment is deprecated), so you can use Luxon functions like `DateTime.now().toFormat('yyyy-MM-dd')` in feature files.

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

## Available Modules

The framework includes several modules that can be used independently or together:

- **[Core](packages/core/README.md)** - Core functionality and utilities. Essential for setting up custom cucumber steps using the `MAFWhen` function. Also handles template literal parsing for easy variable access within strings.

- **[Validations](packages/validations/README.md)** [![Validations Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-validations.yml) - Helper cucumber steps for setting objects and performing validations. Includes steps like `Then item "a" is equal to 5` and `When "Hello World" is base64 encoded`.

- **[API](packages/api/README.md)** [![API Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-api.yml) - Cucumber steps for performing API calls and testing.

- **[AWS](packages/aws/README.md)** [![AWS Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-aws.yml) - Cucumber steps for AWS services including S3, DynamoDB, SQS, Lambda, ECS, and CloudWatch.

- **[MySQL](packages/mysql/README.md)** [![MySQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-mysql.yml) - Cucumber steps for MySQL database testing.

- **[PostgreSQL](packages/postgresql/README.md)** [![PostgreSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-postgresql.yml) - Cucumber steps for PostgreSQL database testing.

- **[DefaultSQL](packages/defaultSQL/README.md)** [![DefaultSQL Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-default-sql.yml) - Common SQL functionality used to create other SQL modules. Reference implementation for creating new SQL database modules.

- **[SFTP](packages/sftp/README.md)** [![SFTP Tests](https://github.com/hpcc-systems/MAF/actions/workflows/package-sftp.yml/badge.svg)](https://github.com/hpcc-systems/MAF/actions/workflows/package-sftp.yml) - SFTP file transfer capabilities for testing file operations.

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
