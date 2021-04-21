# Cucumber-pre-processor
This project will preprocess feature files to allow more input variables to be supplied.  This can be supplied through javascript, a csv/psv/json array file or a mixture of these.  This will hopefully allow it to be easier to maintain larger test sets.  This requires typescript to install some of the cucumber modules. And to currently run it, you must do `node exec.js` an example command for running a specific feature with this would be:
```
mkdir -p test/report
npx preprocessor
npx cucumber-js -f json:test/report/cucumber_report.json --require "features/**/*.js" tmp/features/$*; 
val=$?
node multiReport.js; 
openPy $PWD/test/report/undefined/index.html
exit $val
```

[![npm package][npm-image]][npm-url] 
[![GitHub Actions](https://github.com/hpcc-systems/MAF/workflows/Build/badge.svg)](https://github.com/hpcc-systems/MAF/actions)
[![Dependencies][dep-image]][dep-url]



## Installation
Install with `npm i @ln-maf/preprocessor.git`
An apply.js file needs to exist in the root of the project.  Doing this will make the below keywords accessible, but if you would like to add more you can do so by creating your own steps in the apply.js file.

## Running/configuration
To add apply keywords, the apply steps must be required in the root of your project in './apply.js' Additionally, feature files must be in features.  The resulting output will be in '/tmp/features'.

## Apply
A new keyword that is used as a preprocessor in the feature files.  Anytime the word "Apply" is seen it will modify the feature file and output what is expected based on the Apply step provided in the "steps" file.  This will replace either using a string or a json array object.  This supports both Cucumber and Regex expressions and is used in the same way as a Given step is added in Cucumber. 

## Current steps
This is a list of steps provided at least in part as a demo for this. 
### `Apply combinations for json file {string}`
This will apply combinations for the provided json file.  For example if the json file is
```
{
  "VIN": ["empty", "invalid", "valid"],
  "VRN": ["empty", "invalid", "valid"],
}
```
The result would be:
```
|  VRN	|  VIN	|
|  empty	|  empty	|
|  invalid	|  empty	|
|  valid	|  empty	|
|  empty	|  invalid	|
|  invalid	|  invalid	|
|  valid	|  invalid	|
|  empty	|  valid	|
|  invalid	|  valid	|
|  valid	|  valid	|
```
  
### `Apply CSV File {string}`
This would convert a csv file into examples with the header included.  

If the supplied csv file is:
```
VIN,VRN
empty,empty
```
This would become:
```
|  VIN	|  VRN	|
|  empty	|  empty	|
```


### `Apply CSV File {string} with filter {string}`
Applies a javascript filter to the CSV file.  If the function is defined in the steps, it can also be used.
Example:
If the supplied CSV file is:
```
VIN,VRN
empty,empty
valid,valid
```	

And the filter is:
```
(i)=>i.VIN==="valid"
```
Then this would become:
```
|  VIN	|  VRN	|
|  valid	|  valid	|
```
[npm-image]:https://img.shields.io/npm/v/@ln-maf/preprocessor.svg
[npm-url]:https://www.npmjs.com/package/@ln-maf/preprocessor
[dep-image]:https://david-dm.org/hpcc-systems/MAF.svg?path=packages%2Fpreprocessor
[dep-url]:https://david-dm.org/hpcc-systems/MAF?path=packages%2Fpreprocessor
