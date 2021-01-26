# Validation Cucumber Steps
This module is created to allow other projects to easily validate JSON utilizing a set of steps.

## Set up
Install with `npm i @ln-maf/validations`
Add a step file with the following code:
```
module.exports=require('cucumber-validations')
```

Cucumber autocompletion
Add the following in to `.vscode/settings.json` to get autocomplete for the steps.
```
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
            "node_modules/cucumber-validations/features/stepDefinitions/steps.js",
    ]
}
```

# Step Definitions
This library implements some step definitions and adheres to the global cucumber implementation for various internals.
## `When set {string} to `[{jsonObject}](./JSONObject.md)
This will set an item to a json object.  This will be stored in `this.results.${itemName}` and will be accessible in other global cucumber project steps through `${itemName}`
Examples:
config.json contains:
```
{
  "url" : "http://google.com",
  "meh": "Test"
}
```
After running one of the following: 

`When set "hello" to file "config.json"`

`When set "hello" to '{"url":"http://google.com", "meh":"Test"}'`

```
When set "lastRun" to:
"""
{
  "url" : "http://google.com",
  "meh": "Test"
}
"""
And set "hello" to it 
```

or

```
When set "jsonItem" to:
"""
{
  "url" : "http://google.com",
  "meh": "Test"
}
"""
And set "hello" to item "jsonItem"
```

Then `${hello}` will equal the JSON object:
```
{
  "url" : "http://google.com",
  "meh": "Test"
}
```

## `When set {string} to {int}`
This will set an item to the integer associated with it.  The object will then be stored in `this.results.${itemName}` and will be accessible in other global cucumber projects steps through `${itemName}`
For example:
```
When set "hi" to 3
Then item "hi" is equal to 3
```

## `When set {string} to: {docString}`
Sets an item to a doc string.
For example:
```
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
"a":3
}
"""
```


## `When wait {int} milliseconds`
Waits the provided number of milliscends.


## `Then {string} is {when} now`
The type when supports two values: (before)|(after).  The string value accepts utc timestamp or a string with the date and attempts to parse it using Date.parse(string) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse for more information.

## `Then {string} is {when} {string}`
The type when supports two values: (before)|(after).  The string values accepts utc timestamp or a string with the date and attempts to parse it using Date.parse(string) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse for more information.
An example would be
```
Then "11/11/2019" is before "11/12/2019"
```

## `Then it is equal to {string}`
Equivalent to 'Then "${lastRun}" is equal to {string}

## `Then item {string} is equal to: {docString}`
Checks if an item is equal to a docString.
For Example:
```
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
"a":3
}
"""
```


## `Then {string} is equal to {string}`
Confirms that two strings when analyzed are equal.
Example:
```
 Given set "item" to "hi"
 Then "${item}" is equal to "hi"
```
or
```
Then "hi" is equal to "hi"
```
NOTE:  You can also use "it" to reference the item: "${lastRun}"

## `Then item {string} is equal to {int}`
Confirms that json item is equal to the specified integer. 
Example:
```
When set "a" to "3"
Then item "a" is equal to 3
When set "a" to 3
Then item "a" is equal to 3
```

## `Then it is not equal to {string}`
Checks that "lastRun" is not the supplied item

## `Then item {string} is not equal to null`
Checks that supplied item is not null

## `Then {string} is not equal to {string}`
Checks that two items are not equal.


## `When run json path {string} on item {string}`
Runs a [json path](https://github.com/json-path/JsonPath) on a defined variable.  It then stores the result in `this.results.lastRun`.  This can be used as `${lastRun}`.

## `When JSON key {string} is removed from {string}`
Removes the JSON key/value from the JSON Object provided.

Example:
```
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
Removes the JSON key from the JSON Object contained in lastRun. Similar to `JSON key {string} is removed from {string}`
but the variable used to delete from is `lastRun`

## `When JSON key {string} is extracted from {string}`
Returns the JSON key from a variable to `lastRun`

Example:
```
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
Returns the JSON key from the JSON Object in lastRun as lastRun.
Similar to `When JSON key {string} is extracted from {string}`
but the variable used to extract from is `lastRun`

## `When JSON keys {string} are extracted from {string}`
Returns the JSON keys from a variable to `lastRun`.  The keys are supplied as a JSON Array of strings.  Scoping into arrays is not supported.
For example `[ "arrayTest[0]" ]` will not work.

Example:
```
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
Returns the JSON keys from the JSON Object in lastRun as lastRun. Similar to `JSON keys {string} are extracted from {string}`
but the variable used to extract from is `lastRun`

## `Then element {string} exists in item {string}`
Validates if the element exists in the item.

Example:
```
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
Validates if the element does not exist in the item. The opposite of `Then element {string} exists in item {string}`

## `Then elements {string} exist in item {string}`
Validates if all the elements exists in the item. Each element should be comma separated (`,`). Brackets (`[]`) are optional 

Example:
```
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
Will pass if all the elements do not exist in the item. The opposite of `Then elements {string} exist in item {string}`

## `Then it matches the set {string}`
Equivalent to 'Then the set "lastRun" matches the set {string}'

## `Then the set {string} matches the set {string}`
Validates that two arrays defined at the given strings have all of the same values in any order and removing all duplicates.

## `Then the set {string} matches the set from file {string}`
Validates that two arrays defined at the given strings have all of the same values in any order and removing all duplicates.
Obtains one of the arrays through a file.

## `Given xPath namespace is {string}`
Sets the xPath namespace to the provided string.

Example:
```
Given xPath namespace is '{ "soap": "http://schemas.xmlsoap.org/soap/envelope/", "ln":"http://ln-maf.com" }'
```

## `Given xPath namespace is {docString}`
Same as above but uses a doc string

Example:
```
Given xPath namespace is
"""
{ "soap": "http://schemas.xmlsoap.org/soap/envelope/", "ln":"http://ln-maf.com" }
"""
```

## `When run xPath {string} on item {string}`
Runs an xPath on the defined item.  Utilizes the above specified xPath namespaces.  Runs a json path on a defined variable.  It then stores the result in this.results.lastRun.  This can be used as ${lastRun}.

## `When {string} is applied to item {string} on JSON path {string}`
Replaces the values of all found JSON keys in a item, using the JSON path to identify the keys.

Example:
```
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

## `When {string} is written to file {string} on JSON path {string}`

Replaces the values of all found JSON keys in a file, using the JSON path to identify the keys.

Example:

file.json contains:
```
{
  "url": "http://google.com",
  "meh": "Test"
}
```
After running: `When "SomethingElse" is written to file "file.json" on JSON path "$.meh"`

file.json will now contain
```
{
  "url": "http://google.com",
  "meh": "SomethingElse"
}
```

## `When item {string} is written to file {string}`
Writes an item to a file.

## `When it is written to file {string}`
Is equivalent to 'When item "lastRun" is written to file {string}'

## `When set:`
Takes in a datatable object and sets all of the values.  If the datatable has multiple values it will be treated as an array, otherwise it will be treated as just a single object
Example:
```
When set:
|username|pass|
|User|Pass|
|User2|2Pass|
Then "${username[0]}" is equal to "User"
Then "${username[1]}" is equal to "User2"
```
or
```
|username|pass|
|User|Pass|
Then "${username}" is equal to "User"
```

## `When set config from json file {string}`
Sets a config from a json file.  If the json file is just a json object, it will iterate through all of the keys and store them.
Example:
```
When set config from json file "config.json"
Then "${meh}" is equal to "Test"
```
Where config.json is equal to:
```
{
  "url" : "http://google.com",
  "meh": "Test"
}
```
## `When sign using jwt: {docstring}`
Requires a header and private key to be set (unless using an algorithm that doesn't require a private key)
Example:
```
    Given set "privateKey" to
"""
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
"""
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
Encrypts a provided item using jwt.  Exactly like the doc string encryption above but does the item instead.

## `When make json keys for item {string} lower case`
Makes all the JSON keys in the item lowercase letters

Example:
```
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

Flattens the JSON object, removing root keys with losing any values

Example:
```
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

## `When json item {string} is numberifyed`
Converts any numbers in string format into number format

Example:
```
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
Trims the string of all string values in the JSON.
Trimming includes removing leftover whitespace and newlines

Example:
```
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

## When apply parameters
Allows usage of the cucumber-js commandline arguments specifically related to the cli option `--world-parameters`.  You can read more at: https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md

## When set examples
Will set the examples from a scenario outline.  Will not be able to set items that use other examples in them.  Additionally this will read the feature file associated every time and can be somewhat slow if the file is large.
In the below example, the "Expected" column would not be set as part of the examples.
Example:
```
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
```
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
```
and
```
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

### Then {jsonObject} contains {string}
Checks if the `jsonObject` contains the string anywhere. The jsonObject is turned into one string and performs an include on the entire string

For example:
```
Given set "test1" to "the quick brown fox jumped over the lazy dog"
Then item "test1" contains "quick brown"
Given set "test2" to:
"""
{
  "firstname" : "Robert",
  "lastname" : "Paulson"
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

### Then {jsonObject} does not contain {string}
Checks if the `jsonObject`  does not contain the string. The opposite of `Then {jsonObject} contains {string}`
