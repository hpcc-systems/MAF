# Add custom modules
Creating custom modules is simple, but it is advisable to follow a couple of rules.  These rules are created to allow the data between modules to interact and to create a specific standard for the modules.

## Add a readme explaining how to install your project
Your readme should include how to install the project through npm/yarn and additionally the step files that need to be created to access your repo.  In general this will be something similar to:
```
require('cucumber-api')
```

## Returning data to be used
Data that needs to be used by other steps is stored in `this.results`.  Specifically, items are added to `this.results.lastRun` to be used by the variable `it`.

## Processing of Data
In general we use the `fillTemplate` project to ensure that variables can be replaced.  If the item is a json item, it will need the function `applyTemplateToJSON`.  Usages of both of these can be found at:

https://***REMOVED***/***REMOVED***/qa/automation/cucumber-modules/api/blob/master/index.js

This is used to process items like `${response}` or `${response[0].name}`

## Exporting your steps
Make sure to export your steps in a `index.js` file to allow it to be used by other projects.

## Test your steps
A feature file should be created in this project along with CI/CD to make sure your project builds and processes.  This will allow others to see how your project works and additionally provide some validation of your steps.
