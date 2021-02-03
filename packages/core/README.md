# MAF Core
This contains several helper methods that can be useed by other packages.

## performJSONObjectTransform - performs a transform on `[{jsonObject}](../validations/JSONObject.md)`
When a MAF method receives a json object from a file or some other area, the performJSONObjectTransform converts it appropriately.  An example call with the `MAFWhen` command would be:
```
MAFWhen("run json path {string} on {jsonObject}", function (jPath, jsonObject) {
  var jp = require('jsonpath')
  var obj = performJSONObjectTransform.call(this, jsonObject)
  return jp.query(obj, jPath)
})
```

## MAFWhen
Creates a Cucumber `When`, but the return value is stored in the lastRun value which can be accessed with the keyword `it`.
Please see above for an example.

## MAFSave
Saves an object to maf to be used by the json transform.
```
  MAFSave.call(this, "response", res.response)
```

## readFile
Reads the file using the directory setup within maf or no directory if not set up.  Uses `this.results.directory`

## applyJSONToString  - #deprecated
Converts a string to apply the fillTemplate 

## Fill template
Fills the template literals similar to how js would handle them.  Allows use of template literal in a string.  There are a couple of key differences with how they are processed by fillTemplate.

### Usage
```
var {fillTemplate}=require('@ln-maf/core')
fillTemplate("Hello ${name}", { name: "World" })
```

For example: 
```
fillTemplate("Hello ${name}", { name: "World" })
```
Would return:
```
Hello world
```

Additionally supports the method `applyTemplateToJSON`
This iterates through the entire json object applying filter to each of them.

For Example:

```
var jsonObj={ hello: "${name}" }
applyTemplateToJSON(jsonObj, { name: "World" })
```
Would apply:
```
{
  "hello" : "World"
}
```
to the `jsonObj`.


### Differences
All `"${JS_COMMAND_HERE}"` are replaced with `${JSON.stringify(command)}`.  This automatically escapes some characters to prevent invalid json within json files.

