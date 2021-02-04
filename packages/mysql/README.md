# Node Sql Setup

This module is created to allow other projects to easily utilize SQL when writing test cases.  Additionally, a utility function is used to test using this.

[![npm package][npm-image]][npm-url] 
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]


# Setup

To use this you must require this library after installing using npm.
```
npm i @ln-maf/mysql
```

# Set up configs

Keytar is used to store access to the username and password for sql.  
To setup an sql config please run the following from project root:
```
node node_modules/@ln-maf/mysql/config.js
```
Note: Please run the Setup step first.


## Steps
Add a step definition file with the following line:
```
require('@ln-maf/mysql)
```

## Given mysql config from [{jsonObject}](../validations/JSONObject.md)
Utilizes the sql system associated with the item provided.  By default will use `mysql.sqlConfig.json` in the root directory of the project if none is provided.

## When mysql query from [{jsonObject}](../validations/JSONObject.md) is run
Runs a query from the provided item.  Allows templated args as per the global cucumber projects.  Stores the results in `this.results.lastRun`.  Usable in cucubmer as `${lastRun}` or the it keyword.

[npm-image]:https://img.shields.io/npm/v/@ln-maf/mysql.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/mysql-sql
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Fmysql
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Fmysql