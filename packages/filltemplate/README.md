# Fill template
Fills the template literals similar to how js would handle them.  Allows use of template literal in a string.  There are a couple of key differences with how they are processed by fillTemplate.

## Installation
Install it with
```
npm i @ln-maf/filltemplate
```
## Usage
```
var fillTemplate=require('fillTemplate')
fillTemplate.fillTemplate("Hello ${name}", { name: "World" })
var jsonObj={ hello: "${name}" }
fillTemplate.applyTemplateToJSON(jsonObj, { name: "World" })
console.log(jsonObj)
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
to the `jsonObj`


## Differences
All `"${JS_COMMAND_HERE}"` are replaced with `${JSON.stringify(command)}`.  This automatically escapes some characters to prevent invalid json within json files.

The items are evaled on within each bracket.  You can see some of the examples within the features subfolder of this project.