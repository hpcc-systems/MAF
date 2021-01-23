# MAF Core
This contains several helper methods that can be useed by other packages.

## performJSONObjectTransform
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

## MAFSave
Saves an object to maf to be used by the json transform.
```
  MAFSave.call(this, "response", res.response)
```

## readFile
Reads the file using the directory setup within maf or no directory if not set up.  Uses `this.results.directory`

## applyJSONToString  - #deprecated
Converts a string to apply the fillTemplate 