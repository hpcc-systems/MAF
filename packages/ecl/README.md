# MAF - ECL Module
This module is created to allow other projects to perform ECL actions though MAF / Cucumber step definitions.

[![npm package][npm-image]][npm-url] 
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)

## Set up
1. Install ECL Tools using the [Bare Metal, Non-Containerized Platform](https://hpccsystems.com/download/#h-bare-metal-non-containerized-platform) for your Operating System
2. Make sure that the `ecl` command is in the PATH. On MacOS, the path is `/opt/HPCCSystems/x.x.x/clienttools/bin`. See [ECL Client Tools Documentation](https://hpccsystems.com/training/documentation/ecl-ide-and-client-tools/) for more details / instructions for your system
3. Install npm MAF module by running `npm i @ln-maf/ecl`
4. Add a new step import file `import.js` in the features folder with the following code:
```
require('@ln-maf/ecl')
```

## Global MAF ECL Variables

- url: The url to use for the api request. Should be a string including the protocol. ex: 'https://google.com'
- api: The api to use for the api request. Should be a string. ex: 'driver/users/1'
- body: The body to use for the api request. Should be a string.
- jsonBody: The json body to use for the api request. It must be in a valid JSON object format
- urlEncodedBody: The url encoded body to use for the api request. It will be appended to the url
- headers: The headers to use for the api request. Should be a JSON object
- method: The method to use for the api request. Should be a string. ex: 'GET', 'POST', 'PUT', 'DELETE'

# Step Definitions

## `Given url {string}`

[npm-image]:https://img.shields.io/npm/v/@ln-maf/api.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/api