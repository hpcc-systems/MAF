# MAF - Modular Automation Framework

An expandable fast, easy to use automation framework built in the cucumber language.  Supports AWS S3/DynamoDB, API Testing, UI Testing, SQL Testing in a simple manner.  Allows the usage of modules in isolation as well as in an integrated fashion.  Utilizes the cucumber language to clearly articulate intent while preserving test data for further debugging and record-keeping.

## Installation
Dependencies
- node
- yarn

Clone this project and run `yarn` from the root directory.  For the quickest start add the HelloWorld API example.  By default, the HelloWorldAPI and HelloWorldSQL dependencies are included.  For other dependencies, you will need to read the required steps in their respective READMEs.

## Hello World API Example

> ./features/HelloWorldAPI.feature
```
Feature: View the text "Hello World"
  Scenario: Hello World
    When the request from json file "helloWorld.json" is performed
    Then status ok
    And "${response}" is equal to "Hello World"
```
>>  ./helloWorld.json
```
{
  "url": "http://www.mocky.io/v2/",
  "api": "5ec540242f00004cb1dc30dd",
  "method": "GET"
}
```

### The Generated report:
```
➜  cucumber-api git:(master) bash runFeature.sh helloWorld.feature
...

1 scenario (1 passed)
3 steps (3 passed)
0m00.360s


=====================================================================================
    Multiple Cucumber HTML report generated in:

    $HOME/cucumber-api/test/report/index.html
=====================================================================================
```

![ApiResult](./APIResult.png)


## Hello World SQL Example

This requires the setup of your sql environment.  To utilize this, please run `node sqlConfigure` and it will prompt you for needed credentials, etc. for SQL to run properly.    It will store the config in a `sqlConfig.json` file and it will store your credentials using `node-keytar` which uses your OS's secure password storage:
- Windows - Credential Vault
- MacOS - KeyChain
- Linux - libSecret

You will also need to update the sql query and update the validations to match.  You can copy the validations from the generated report to make sure it passes.

> features/HelloWorldSQL.feature
```
Feature: SQL Hello World
  Scenario: Run a query
      When the query "SELECT * FROM HelloWorld" is run
      Then it matches set from the file "helloWorldSQL.json"
```
>> ./helloWorldSQL.json
```
[
  {
    "id" : "1",
    "hello": "world"
  },
  {
    "id" : "2",
    "hello": "day"
  }
]
```
>> Table HelloWorld
```
| id | hello |
| 1  | world |
| 2  | day   |
```

## Step Definitions Master list
A list of all the step definitions we use and a link to some of the various steps can be found at:
https://***REMOVED***/***REMOVED***/qa/automation/stepdefinitionsreadme

This gives a master list of steps that can be used and a link to the individual projects.  To quickly view how some of the projects work, please clone them, run the tests and look at the results.  In general the projects use `multi-cucumber-html-reporter` but you can use a variety of reporting tools.  One of the main projects of interest would be the `cucumber-validations` and whichever module you would like to use for your project.

## Add a module
Please view [AddModule](./AddModule.md) for information on how to add a module.  This will allow the creation of new steps that can be used in your project.
