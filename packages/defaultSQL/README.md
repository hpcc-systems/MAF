# Node Default SQL Setup
This module is created to allow other projects to easily create modules that perform sql using various platforms.  There are examples for mysql included.

[![npm package][npm-image]][npm-url] 
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

# Setup

To use this you must require this library after installing using npm.
```
npm i @ln-maf/defaultSQL
```

# Set up configs

Please view the FAKEConfig.js file for how a config can be created.  You will need to create a similar file in your module.  An example would be
```
var config=require('@ln-maf/defaultSQL/config')
config('SQLModule')
```

## Steps
Add a step definition file with the following line:
```
var create=require('@ln-maf/defaulSQL')
create({
    name: "ModuleName",
    connect: (username, password) => {
        return connection
    },
    runQuery: (connection) =>  "",
    disconnect: (connection) =>{}
})
```

## Given $MODULENAME config from [{jsonObject}](../validations/README.md)
Utilizes the sql system associated with the file provided.

## When $MODULENAME query from [{jsonObject}](../validations/JSONObject.md) is run
Runs a query from the provided item.  Allows templated args as per the global cucumber projects.  Stores the results in `this.results.lastRun`.  Usable in MAF as `${lastRun}` or the it keyword.  Supports a string, file or item whenever this is used.

[npm-image]:https://img.shields.io/npm/v/@ln-maf/defaultSQL.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/defaultSQL
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2FdefaultSQL
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2FdefaultSQL