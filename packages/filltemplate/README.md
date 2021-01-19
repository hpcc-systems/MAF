# Fill template
Fills the template literals how js would handle them.  Allows use of template literal in a string.  

## Installation
Install it with
```
yarn add git+ssh://git@***REMOVED***:***REMOVED***/qa/helpers/filltemplate.git
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
