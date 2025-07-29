# MAF - API Module

This module is created to allow other projects to easily perform API requests, utilizing a set of steps.

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)

## Dependencies

This module is dependent on the following npm modules:

- fetch-blob
- node-fetch
- form-data
- fetch-to-curl

## Set up

1. Install by running `npm i @ln-maf/api`

2. Add a new step file in the features folder with the following code:

```js
require('@ln-maf/api')
```

## Global MAF API Variables

- url: The url to use for the api request. Should be a string including the protocol. ex: '<https://google.com>'
- api: The api to use for the api request. Should be a string. ex: 'driver/users/1'
- body: The body to use for the api request. Should be a string.
- jsonBody: The json body to use for the api request. It must be in a valid JSON object format
- urlEncodedBody: The url encoded body to use for the api request. It will be appended to the url
- headers: The headers to use for the api request. Should be a JSON object. Note that the default headers are remove if this is used. The default headers are documented here in the [node-fetch](https://www.npmjs.com/package/node-fetch#default-headers) documentation.
- method: The method to use for the api request. Should be a string. ex: 'GET', 'POST', 'PUT', 'DELETE'

## Step Definitions

### `When api request from`[{jsonObject}](../validations/JSONObject.md)`is performed`

Performs a request based on the json file and given values.  An example json file would be:

```js
{
    "api": "driver/users/1",
    "method": "POST",
    "headers": {
      "Accept": "application/json",
      "X-Api-Service-Version": "2.0",
      "Content-Type": "application/json",
      "X-AliasRequired": false
    },
    "body": {
      "clientNumber" : "111",
      "email": "1@1.com"
      "mobilePhone":"1"
    }
  }
```

After the request is performed, the results will be stored in `${lastRun}` consistent with the global cucumber testing standard, and in `${response}`.
This can be accessed in other tests following this standard with the template literal `${lastRun}` or `${response}`.

### `When api request is performed`

Performs a request based on the global variables set. The global variables are listed above.

### `When perform api request: {docString}`

Performs using a doc string instead of a file.  Please see `When api request {string} is performed`

Example:

```feature
When perform api request:
"""
{
  "url" : "http://google.com",
  "method": "GET"
}
"""
```

#### How to perform a multi-part request

The request supports and additional body type of: formBody.  This supports arrays(untested) and will append it to element + [].  
As of now the only portion of this that is tested and is not included in this CI is the file.  Hopefully this will be tested in more detail soon.

An example would be:

```js
{
    "api": "/driver/upload?ft=1&fn=${outputFilename}",
    "headers": {
        "X-Api-Key": "${apiKey}",
        "X-File-Format": "DECRYPTED",
        "X-File-Format-Version": "4.0",
        "accept": "application/json",
        "accept-encoding": "gzip",
        "accept-language": "en-US,en;q=0.9",
        "authorization": "Bearer ${a_t}",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-api-service-version": "1.0"
    },
    "formBody": {
      "file": {
        "type": "file",
        "fileName": "${outputFilename}"
      },
      "stringParam": "string",
      "numParam": 3,
      "blobParam": {
        "type": "base64blob",
        "base64blob": "SEVMTE8gV09STEQ="
      },
      "stringArray": ["hello", "world"],
      "fileArray": [
        {
          "type": "file",
          "fileName": "${outputFilename}"
        },
        {
          "type": "file",
          "fileName": "${outputFilename2}"
        }
      ]
    },
    "method": "POST"
}
```

### `Then the status is ok`

Makes sure that `response.status` is between 200 and 299.

### `Then the status is not ok`

Makes sure that `response.status` is not between 200 and 299.

### `Then the status is {int}`

Makes sure that `response.status` is equal to the integer specified.

[npm-image]:https://img.shields.io/npm/v/@ln-maf/api.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/api
