
# Validation Cucumber Steps

This module allows other projects to easily validate JSON using a set of Cucumber step definitions.

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

## Table of Contents

- [Setup](#setup)
- [Step Definitions](#step-definitions)
  - [Data Setting Steps](#data-setting-steps)
  - [Assertion Steps](#assertion-steps)
  - [JSON Manipulation Steps](#json-manipulation-steps)
  - [File Operation Steps](#file-operation-steps)
  - [Encoding and Crypto Steps](#encoding-and-crypto-steps)
  - [XML Processing Steps](#xml-processing-steps)
  - [Blob Operation Steps](#blob-operation-steps)
  - [Set Comparison Steps](#set-comparison-steps)
  - [Utility Steps](#utility-steps)

[![npm package][npm-image]][npm-url]
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]

## Setup

Install:

```sh
npm i @ln-maf/validations
```

Add a step file with:

```js
require('cucumber-validations');
```

### Cucumber Autocompletion

Add the following to `.vscode/settings.json` for step autocompletion:

```json
{
  "cucumberautocomplete.stepsInvariants": true,
  "cucumberautocomplete.smartSnippets": true,
  "cucumberautocomplete.customParameters": [
    {
      "parameter": "{jsonObject}",
      "value": "(it|item {string}|file {string}|{string})"
    }
  ],
  "cucumberautocomplete.steps": [
    "node_modules/cucumber-validations/features/stepDefinitions/steps.js"
  ]
}
```

## Step Definitions

This library implements step definitions and adheres to the global cucumber implementation for various internals.

### Data Setting Steps

## `When set {string} to` [{jsonObject}](./JSONObject.md)

Sets an item to a JSON object. The object is stored in `this.results.${itemName}` and accessible in other global Cucumber steps as `${itemName}`.

**Example:**
`config.json` contains:

```json
{
  "url" : "http://google.com",
  "meh": "Test"
}
```

After running one of the following:

```feature
When set "hello" to file "config.json"
When set "hello" to '{"url":"http://google.com", "meh":"Test"}'
When set "lastRun" to:
"""
{
  "url": "http://google.com",
  "meh": "Test"
}
"""
And set "hello" to it
When set "jsonItem" to:
"""
{
  "url": "http://google.com",
  "meh": "Test"
}
"""
And set "hello" to item "jsonItem"
```

Then `${hello}` will equal:

```json
{
  "url": "http://google.com",
  "meh": "Test"
}
```

## `When set {string} to {int}`

Sets an item to the given integer. The value is stored in `this.results.${itemName}` and accessible as `${itemName}`.

**Example:**

```feature
When set "hi" to 3
Then item "hi" is equal to 3
```

## `When set {string} to: {docString}`

Sets an item to a doc string value.

**Example:**

```feature
When set "a" to "3"
And set "item" to:
"""
{
  "a": ${a}
}
"""
Then item "item" is equal to:
"""
{
  "a": 3
}
"""
```

## `When set config from json {jsonObject}`

Sets config from a JSON object. If the object contains keys, all keys are stored as individual variables.

**Example:**

```feature
When set config from json file "config.json"
Then "${meh}" is equal to "Test"
```

Where `config.json` is:

```json
{
  "url": "http://google.com",
  "meh": "Test"
}
```

## `When set:`

Takes in a datatable object and sets all values. If the datatable has multiple values, it is treated as an array; otherwise, as a single object.

**Example:**

```feature
When set:
|username|pass|
|User|Pass|
|User2|2Pass|
Then "${username[0]}" is equal to "User"
Then "${username[1]}" is equal to "User2"
```

Or:

```feature
|username|pass|
|User|Pass|
Then "${username}" is equal to "User"
```

## `When parameters are:`

Sets parameters from a docString for testing command line arguments.

**Example:**

```feature
When parameters are:
"""
{
  "testParam": "testValue"
}
"""
```

### Assertion Steps

## `Then {jsonObject} {validationsEquivalence} {jsonObject}`

Compares two numeric values using comparison operators like `is greater than`, `is less than`, etc.

**Example:**

```feature
When set "a" to 5
And set "b" to 3
Then item "a" is greater than item "b"
```

## `Then {string} is {when} now`

Checks if the string is before or after the current time. The `when` parameter supports `before` or `after`. The string value accepts UTC timestamp or a date string and uses [Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).

## `Then {string} is {when} {string}`

Checks if one date string is before or after another.

**Example:**

```feature
Then "11/11/2019" is before "11/12/2019"
```

## `Then it is equal to {string}`

Equivalent to `Then "${lastRun}" is equal to {string}`.

## `Then item {string} is equal to: {docString}`

Checks if an item is equal to a docString.

**Example:**

```feature
When set "a" to "3"
And set "item" to:
"""
{
  "a": ${a}
}
"""
Then item "item" is equal to:
"""
{
  "a": 3
}
"""
```

## `Then {string} is equal to {string}`

Confirms that two strings are equal.

**Example:**

```feature
Given set "item" to "hi"
Then "${item}" is equal to "hi"
Then "hi" is equal to "hi"
```

You can also use "it" to reference the item: `${lastRun}`.

## `Then {jsonObject} is not equal to:`

Checks if a JSON object is not equal to a docString.

**Example:**

```feature
When set "item" to "different value"
Then item "item" is not equal to:
"""
expected value
"""
```

## `Then {jsonObject} is equal to:`

Checks if a JSON object is equal to a docString.

**Example:**

```feature
When set "item" to "expected value"
Then item "item" is equal to:
"""
expected value
"""
```

## `Then item {string} is equal to {int}`

Confirms that a JSON item is equal to the specified integer.

**Example:**

```feature
When set "a" to "3"
Then item "a" is equal to 3
When set "a" to 3
Then item "a" is equal to 3
```

## `Then it is not equal to {string}`

Checks that `lastRun` is not equal to the supplied item.

## `Then {jsonObject} is null`

Checks that the JSON object is null.

**Example:**

```feature
Then item "emptyItem" is null
```

## `Then {jsonObject} is not null`

Checks that the JSON object is not null.

**Example:**

```feature
Then item "dataItem" is not null
```

## `Then item {string} is not equal to null`

Checks that the supplied item is not null.

## `Then {string} is not equal to {string}`

Checks that two items are not equal.

### JSON Manipulation Steps

## `When run json path {string} on item {string}`

Runs a [JSONPath](https://github.com/json-path/JsonPath) on a defined variable and stores the result in `this.results.lastRun`.

## `When JSON key {string} is removed from {string}`

Removes the JSON key/value from the provided JSON object.

**Example:**

```feature
When set "Data" to
"""
{
    "a":"apple",
    "b":"banana"
}
"""
When JSON key "a" is removed from "Data"
Then "${Data.b}" is equal to "banana"
And element "a" does not exist in item "Data"
```

## `When JSON key {string} is removed from it`

Removes the JSON key from the JSON object in `lastRun`. Similar to above, but uses `lastRun`.

## `When JSON key {string} is extracted from {string}`

Extracts the JSON key from a variable and stores it in `lastRun`.

**Example:**

```feature
When set "Data" to
"""
{
    "a":"apple",
    "b":"banana"
}
"""
When JSON key "a" is extracted from "Data"
Then it is equal to "apple" 
```

## `When JSON key {string} is extracted from it`

Extracts the JSON key from the JSON object in `lastRun` and stores it in `lastRun`.

## `When JSON keys {string} are extracted from {string}`

Extracts multiple JSON keys from a variable and stores them in `lastRun`. Keys are supplied as a JSON array of strings. Scoping into arrays is not supported (e.g., `["arrayTest[0]"]` will not work).

**Example:**

```feature
When set "TestJSON" to
"""
{
  "url": "http://google.com",
  "meh": "Test",
  "meh2": "Another Test",
  "deepMeh": {
      "deep1": "Testing1",
      "deep2": "Testing2"
  },
  "deepMeh2": {
      "deep3": "Testing3",
      "deep4": "Testing4"
  },
  "arrayTest": [
      "Testing1",
      "Testing2",
      "Testing3"
  ]
}
"""
And JSON keys '["meh","deepMeh","deepMeh2.deep3", "arrayTest"]' are extracted from "TestJSON"
And set "expected" to:
"""
{
    "meh": "Test",
    "deepMeh": {
    "deep1": "Testing1",
    "deep2": "Testing2"
    },
    "deepMeh2": {
    "deep3": "Testing3"
    },
    "arrayTest": [
    "Testing1",
    "Testing2",
    "Testing3"
    ]
}
"""
Then item "expected" is equal to item "lastRun"
```

## `When JSON keys {string} are extracted from it`

Extracts multiple JSON keys from the JSON object in `lastRun` and stores them in `lastRun`.

## `Then element {string} exists in item {string}`

Validates that the element exists in the item.

**Example:**

```feature
When set "TestJSON" to
"""
{
    "a":"apple",
    "b":"banana"
}
"""
Then element "a" exists in item "TestJSON"
```

## `Then element {string} does not exist in item {string}`

Validates that the element does not exist in the item (opposite of above).

## `Then elements {string} exist in item {string}`

Validates that all elements exist in the item. Elements should be comma-separated; brackets (`[]`) are optional.

**Example:**

```feature
When set "TestJSON" to
"""
{
    "a":"apple",
    "b":"banana",
    "c":"cherry",
}
"""
Then elements "[a,b,c]" exist in item "TestJSON"
```

## `Then elements {string} do not exist in item {string}`

Passes if all elements do not exist in the item (opposite of above).

### Blob Operation Steps

## `When blob is read from file {string}`

Reads binary data (blob) from a file.

**Example:**

```feature
When blob is read from file "image.png"
And set "imageData" to it
```

## `When blob item {string} is written to file {string}`

Writes blob data to a file.

**Example:**

```feature
When blob item "imageData" is written to file "output.png"
```

## `When blob item {string} is attached`

Attaches blob data to the test report (for visual validation).

**Example:**

```feature
When blob item "screenshot" is attached
```

## `Then blob item {string} is equal to file {string}`

Compares blob data with the contents of a file.

**Example:**

```feature
Then blob item "actualImage" is equal to file "expected.png"
```

### Set Comparison Steps

## `Then it matches the set {string}`

Equivalent to `Then the set "lastRun" matches the set {string}`.

## `Then the set {string} matches the set {string}`

Validates that two arrays have the same values (any order, duplicates removed).

## `Then it matches the set from file {string}`

Equivalent to `Then the set "lastRun" matches the set from file {string}`.

## `Then the set {string} matches the set from file {string}`

Validates that two arrays have the same values (any order, duplicates removed). One array is loaded from a file.

### XML Processing Steps

## `Given xPath namespace is {string}`

Sets the xPath namespace to the provided string.

**Example:**

```feature
Given xPath namespace is '{ "soap": "http://schemas.xmlsoap.org/soap/envelope/", "ln":"http://ln-maf.com" }'
```

## `Given xPath namespace is {docString}`

Same as above, but uses a doc string.

**Example:**

```feature
Given xPath namespace is
"""
{ "soap": "http://schemas.xmlsoap.org/soap/envelope/", "ln":"http://ln-maf.com" }
"""
```

## `When add xPath namespace {string} = {string}`

Adds a single xPath namespace mapping.

**Example:**

```feature
When add xPath namespace "custom" = "http://example.com/namespace"
```

## `When run xPath {string} on item {string}`

Runs an xPath on the defined item using the specified xPath namespaces. Stores the result in `this.results.lastRun`.

## `When {string} is applied to item {string} on JSON path {string}`

Replaces the values of all found JSON keys in an item, using the JSON path to identify the keys.

**Example:**

```feature
Given set "meh" to:
"""
{
  "url": "http://google.com",
  "arrayTest": [
    "Testing1",
    "Testing2",
    "Testing3"
  ]
}
"""
And set "expected" to:
"""
{
  "url": null,
  "arrayTest": [
    "Testing1",
    "Testing2",
    "Testing3"
  ]
}
"""
When "null" is applied to item "meh" on JSON path "$.url"
Then item "expected" is equal to item "meh"
```

### File Operation Steps

## `When {string} is written to file {string} on JSON path {string}`

Replaces the values of all found JSON keys in a file, using the JSON path to identify the keys.

**Example:**

file.json contains:

```json
{
  "url": "http://google.com",
  "meh": "Test"
}
```

After running: `When "SomethingElse" is written to file "file.json" on JSON path "$.meh"`

file.json will now contain

```json
{
  "url": "http://google.com",
  "meh": "SomethingElse"
}
```

## `When item {string} is written to file {string}`

Writes an item to a file.

## `When {jsonObject} is written to file {string}`

Writes a JSON object to a file. If the object is a JavaScript object, it will be stringified.

**Example:**

```feature
When set "data" to:
"""
{
  "name": "test",
  "value": 123
}
"""
When item "data" is written to file "output.json"
```

## `When {jsonObject} is written in json line delimited format to file {string}`

Writes a JSON array to a file in JSON Line Delimited format (each array item on a separate line).

**Example:**

```feature
When set "data" to:
"""
[
  {"name": "item1"},
  {"name": "item2"}
]
"""
When item "data" is written in json line delimited format to file "output.jsonl"
```

## `When the file {string} is gzipped`

Compresses a file using gzip compression.

**Example:**

```feature
When the file "large-data.txt" is gzipped
```

## `When file {string} is gzip unzipped to file {string}`

Decompresses a gzipped file to a new file.

**Example:**

```feature
When file "compressed.gz" is gzip unzipped to file "uncompressed.txt"
```

## `When it is written to file {string}`

Equivalent to `When item "lastRun" is written to file {string}`.

## `When set config from json file {string}`

Sets config from a JSON file. If the file contains a JSON object, all keys are stored.

**Example:**

```feature
When set config from json file "config.json"
Then "${meh}" is equal to "Test"
```

Where `config.json` is:

```json
{
  "url": "http://google.com",
  "meh": "Test"
}
```

### Encoding and Crypto Steps

## `When {jsonObject} is base64 encoded`

Encodes a JSON object or string to base64 format.

**Example:**

```feature
When set "data" to "Hello World"
When item "data" is base64 encoded
And set "encodedData" to it
```

## `When {jsonObject} is base64 decoded`

Decodes a base64 encoded string back to its original format.

**Example:**

```feature
When item "encodedData" is base64 decoded
And set "decodedData" to it
```

## `When the value {string} is base64 decoded and resaved`

Decodes a base64 value and saves it back to the same variable.

**Example:**

```feature
When set "encoded" to "SGVsbG8gV29ybGQ="
When the value "encoded" is base64 decoded and resaved
```

## `When generate rsa key`

Generates an RSA private key for JWT signing.

**Example:**

```feature
When generate rsa key
And set "privateKey" to it
```

## `When sign using jwt: {docstring}`

Requires a header and private key to be set (unless using an algorithm that doesn't require a private key).

**Example:**

```feature
   When generate rsa key
   And set "privateKey" to it
   And set "header" to
   """
{
  "alg": "RS256",
  "ver": "GTP-1.0",
  "keyId": 1
}
   """
When sign using jwt:
"""
{ "soap": "http://schemas.xmlsoap.org/soap/envelope/", "repo": "MAF" }
"""
```

## `When sign item {string} using jwt`

Encrypts a provided item using JWT. Same as above, but operates on the item.

## `When make json keys for item {string} lower case`

Makes all JSON keys in the item lowercase.

**Example:**

```feature
When set "data" to:
"""
{
  "Alpha": "apple",
  "BETA": "banana",
  "Charley": "coconut",
}
"""
When make json keys for item "data" lower case
Then item "data" is equal to:
"""
{
  "alpha": "apple",
  "beta": "banana",
  "charley": "coconut",
}
"""
```

## `When json item {string} is flattened`

Flattens the JSON object, removing root keys without losing any values.

**Example:**

```feature
When set "data" to:
"""
{
"Alpha": {
    "Alpha_2": "Apple"
    },
"Beta": "Banana",
"Charley": {
    "Charley_2": {
        "Charley_3": "Coconut"
        }
    },
"Delta": { 
    "Delta_21" : "Durian1",
    "Delta_22" : "Durian2"
    }
}
"""
When json item "data" is flattened
Then item "data" is equal to:
"""
{
"Alpha_2": "Apple",
"Beta": "Banana",
"Charley_3": "Coconut",
"Delta_21": "Durian1",
"Delta_22": "Durian2"
}
"""
```

## `When json item {string} is numberified`

Converts any numbers in string format into number format.

**Example:**

```feature
When set "data" to:
"""
{
"Alpha": "123",
"Beta": {
    "Beta_21": "456",
    "Beta_22": "some_word"
    },
"Charley": {
    "Charley_21": "45.6",
    "Charley_22": 24.9
    },
"Delta": "1.2.3"
}
"""
When json item "data" is numberifyed
Then item "data" is equal to:
"""
{
"Alpha": 123,
"Beta": {
  "Beta_21": 456,
  "Beta_22": "some_word"
    },
"Charley": {
  "Charley_21": 45.6,
  "Charley_22": 24.9
    },
"Delta": "1.2.3"
}
"""
```

## `When json item {string} is trimmed`

Trims all string values in the JSON (removes whitespace and newlines).

**Example:**

```feature
When set "data" to:
"""
{
"Alpha": {
    "Alpha_2": "Apple   "
    },
"Beta": "_Banana_",
"Charley": "Spaces are kept in between words",
"Delta": { 
    "Delta_21" : "   But spaces at the beginning and end are removed   ",
    "Delta_22" : "\nSo are new lines\n"
    }
}
"""
When json item "data" is trimmed
Then item "data" is equal to:
"""
{
"Alpha": {
  "Alpha_2": "Apple"
},
"Beta": "_Banana_",
"Charley": "Spaces are kept in between words",
"Delta": {
  "Delta_21": "But spaces at the beginning and end are removed",
  "Delta_22": "So are new lines"
    }
}
"""
```

### Utility Steps

## `When wait {int} milliseconds`

Waits the provided number of milliseconds.

**Example:**

```feature
When wait 5000 milliseconds
```

## `When apply parameters`

Allows usage of the cucumber-js CLI option `--world-parameters`. See [docs](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md).

## `Given set examples`

Sets the examples from a scenario outline. Items using other examples cannot be set. Reads the feature file each time (may be slow for large files).

**Example:**

```feature
    Scenario Outline: Testing
        When set examples
        Then "<Expected>" is equal to "<ExpectedResult>"
        @phone
        Examples:
            | Phone | Expected | ExpectedResult |
            | 1     | ${Phone} | 1              |

        @next
        Examples:
            | Next | Expected | ExpectedResult |
            | 2    | ${Next}  | 2              |
```

Result:

```feature
@phone
Scenario: Testing
When set examples
"""
{
  "Phone": "1",
  "ExpectedResult": "1"
}
"""
Then "${Phone}" is equal to "1"

@next
Scenario: Testing
When set examples
"""
{
  "Next": "2",
  "ExpectedResult": "2"
}
"""
Then "${Next}" is equal to "2"
```

## `Then [{jsonObject}](./JSONObject.md) contains {string}`

Checks if the `jsonObject` contains the string anywhere. The object is converted to a string and checked for inclusion.

**Example:**

```feature
Given set "test1" to "the quick brown fox jumped over the lazy dog"
Then item "test1" contains "quick brown"
Given set "test2" to:
"""
{
  "firstname": "Robert",
  "lastname": "Paulson"
}
"""
Then item "test2" contains "Robert"
And item "test2" contains "lastname"
Given set "test3" to:
"""
[
  "Apple",
  "Banana",
  "Orange"
]
"""
Then item "test3" contains "Oran"
```

## `Then [{jsonObject}](../validations/JSONObject.md) does not contain {string}`

Checks if the `jsonObject` does not contain the string (opposite of above).

[npm-image]: https://img.shields.io/npm/v/@ln-maf/validations.svg
[npm-url]: https://www.npmjs.com/package/@ln-maf/validations
[dep-image]: https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Fvalidations
[dep-url]: https://david-dm.org/hpcc-systems/MAF?path=packages%2Fvalidations
