# JSON Object {jsonObject}
The json object allows us to support multiple inputs that will resolve to a json object. A json object is inclusive of strings and integers.  It does automatic parsing of the template arguments and uses the `convertToJSONObject` function in `cucumber-validations/helpers.js`.  Whenever json object is used, it will allow reading from file, another item, a string or the item "lastRun" using "it".  *{jsonObject}* includes the steps `item {string}`, `it`, `{string}`, `{int}` and `file {string}` to complete the step function.  To utilize jsonObject in your own steps please use the convertToJSONObject function and use the parsed jsonObject.

## Equivalence:
The following show how `{jsonObject}` can be used

Specifically `Then {jsonObject}` is equivalent to:

### Then item {string}
Allows access to a previously defined js object.

For example:
```
When set "a" to 5
Then item "a" is equal to 5
```

### Then string {string}
Allows access to a string.

For example:
```
Then string "5" is equal to "5"
```

### Then {string}
Allows access to a string.
For example:
```
Then "5" is equal to "5"
```

### Then file {string}
Allows access to a file.
For example:

```
When "hello" is written to file "bla"
Then file "hello" is equal to "bla"
```

### Then {int}
Allows access to an int.

For example:
```
Then 5 is equal to 5
```

