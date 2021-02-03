# API Cucumber Steps
This module is created to allow other projects to easily perform API requests, utilizing a set of steps.

## Set up
1. Install by running `npm i @ln-maf/api`

2. Add a new step file in the features folder with the following code:
```
require('@ln-maf/api')
```

# Step Definitions
This library implements some step definitions and adheres to the global cucumber implementation for various internals.

## `Given url {string}`
Assigns a string to the url item

## `Given api {string}`
Assigns a string to the api item

## `Given request {string}`
Defines the body for a given request

## `Given headers {string}`
Takes a string of headers.  These should represent a json object.

## `When api request from [{jsonObject}](../validations/JSONObject.md) is performed`
Performs a request based on the json file and given values.  An example json file would be:
```
{
    "api": "driver/users/1",
    "method": "POST",
    "headers": {
      "Accept": "application/json",
      "X-Api-Service-Version": "2.0",
      "Content-Type": "application/json",
      "X-AliasRequired": false
    },
    "jsonBody": {
      "clientNumber" : "111",
      "email": "1@1.com"
      "mobilePhone":"1"
    }
  }
```
Additionally, you can provide variables in the template literal form which would take from variables that have been set. 
The body parameters that are accepted are:
```
"body": "Expects Text"
"jsonBody": { "expects": "jsonObject"}
"urlEncodedBody": { "expects": "jsonObject"}
```
The headers parameter expects a json object and the method is required.  It accepts any http method.

After the request is performed, the results will be stored in `this.results.lastRun`, consistent with the global cucumber testing standard.
This can be accessed in other tests following this standard with the template literal `${lastRun}`

Additionally, the response will be stored as `this.results.response` as well to allow easier access to the response directly.

The api form also support apiParams to allow you to pass a json object in as a url encoded api request.
An example would be:
```
{ 
  "api": "/driver/user/${userID}/stats",
  "apiParams": {
    "nocache": "1579901950296",
    "stats": "1,2,5,6"
  },
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,es;q=0.8",
    "authorization": "Bearer ${a_t}",
    "content-type": "application/json;charset=UTF-8"
  },
  "method": "GET"
}
```

### How to perform a multi-part request
The request supports and additional body type of: formBody.  This supports arrays(untested) and will append it to element + [].  
As of now the only portion of this that is tested and is not included in this CI is the file.  Hopefully this will be tested in more detail soon.

An example would be:
```
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

## `When perform api request: {docString}`
Performs using a doc string instead of a file.  Please see `When api request {string} is performed`

Example:
```
When perform api request:
"""
{
  "url" : "http://google.com",
  "method": "GET"
}
"""
```

## `When api request from [{jsonObject}](../validations/JSONObject.md) is performed with: {dataTable}`
Performs an api request using a json file. `dataTable` contains the values that are replaced within the request.  This will assign the variables in dataTable globally.

Example:
Assuming badge.json is:
```
{
    "api": "/user/${userID}/badges",
    "headers": {
        "accept": "application/json",
        "accept-language": "en-US,en;q=0.9,es;q=0.8",
        "authorization": "Bearer ${a_t}",
        "content-type": "application/json;charset=UTF-8",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
    },
    "body": null,
    "method": "GET"
}
```
Then the "${userID}" would be replaced with 123456 in the below.
```
When api request "badge.json" is performed with:
        |userID|
        |123456|
```

## `When api request from item {string} is performed`
Performs an api request using an existing item.

```
When set "testConfig" to:
"""
  {
    "url":"http://google.com",
    "method": "GET"
  }
"""
And api request from item "testConfig" is performed
```

## `When method post`
Performs a post using the defined values listed above and stores the result in `this.results.lastRun` which can be accessed with `${lastRun}`

## `When method get`
Performs a post using the defined values listed above and stores the result in `this.results.lastRun` which can be accessed with `${lastRun}`

## `Then the status is not ok`
Makes sure that `this.results.lastRun.status` is not between 200 and 299.

## `Then status not ok`
Makes sure that `this.results.lastRun.status` is not between 200 and 299.

## `Then the status is ok`
Makes sure that `this.results.lastRun.status` is between 200 and 299.

## `Then status ok`
Makes sure that `this.results.lastRun` is between 200 and 299.

## `Then status {int}`
Makes sure that `this.results.lastRun.status` is equal to the integer specified.
