# Node Sql Setup

This module is created to allow other projects to easily utilize SQL when writing test cases.  Additionally, a utility function is used to test using this.

[![npm package][npm-image]][npm-url] 
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]


# Setup

To use this you must require this library after installing using npm.
```
npm i @ln-maf/postgresql
```

# Set up configs

Keytar is used to store access to the username and password for sql. Alternatively, Environment Variables Can be used as well. The following environment variables are used:
- POSTGRESQL_SQL_USERNAME: Your username for postgresql
- POSTGRESQL_SQL_PASSWORD: Your password for postgresql
- USE_ENV_VARIABLES: Set to `TRUE` to use environment variables instead of keytar.
```
To setup an sql config please run the following from your project root:
```
node node_modules/@ln-maf/postgresql/config.js
```
Or create a JSON with the name `postgresql.sqlConfig.json` in the root directory of your project.  The following is an example of the JSON:
```
{
    "sql": {
        "host": "localhost",
        "port": 5432,
        "database": "database"
    }
}
```
Note: Please run the Setup step first.


## Steps
Add a step definition file with the following line:
```
require('@ln-maf/postgresql)
```

## Given postgresql config from [{jsonObject}](../validations/JSONObject.md)
Utilizes the sql system associated with the item provided.  By default will use `postgresql.sqlConfig.json` in the root directory of the project if none is provided.

## When postgresql query from [{jsonObject}](../validations/JSONObject.md) is run
Runs a query from the provided item.  Allows templated args as per the global cucumber projects.  Stores the results in `this.results.lastRun`.  Usable in cucubmer as `${lastRun}` or the it keyword.

[npm-image]:https://img.shields.io/npm/v/@ln-maf/postgresql.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/postgresql-sql
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Fpostgresql
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Fpostgresql