# Add custom modules
Creating custom modules is simple, but it is advisable to follow a couple of rules.  These rules are created to allow the data between modules to interact and to create a specific standard for the modules.

## Add a readme explaining how to install your project
Your readme should include how to install the project through npm/yarn and additionally the step files that need to be created to access your repo.  In general this will be something similar to:
```
require('@ln-maf/api')
```

## Returning data to be used
The easiest way to add new data is to use `MAFWhen` as documented in the [core](packages/core/README.md).  This leads to a very simple example that can easily be used.

Data that needs to be used by other steps is stored in `this.results`.  Specifically, items are usually added to `this.results.lastRun` to be used by the variable `it`.

## Processing of Data
It is advisable to use the:
`performJSONObjectTransform` documented in the [core](packages/core/README.md) to retrieve various values.  This will automatically replace various portions of the incoming item and allow it to just be used.

If you have a more complex use-case we generally use the [filltemplate](packages/filltemplate/README.md) project to ensure that variables can be replaced.   

This is used to process items like `${response}` or `${response[0].name}`.

## Exporting your steps
Make sure to export your steps in a `index.js` file to allow it to be used by other projects.

## Test your steps
A feature file should be created in this project along with CI/CD to make sure your project builds and processes.  This will allow others to see how your project works and additionally provide some validation of your steps.
