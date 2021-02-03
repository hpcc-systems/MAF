Feature: defaultSQL : Test the default SQL Package
   Background:
     When set "directory" to "test"

  Scenario: Run a query
      And FAKE query from string "SELECT * FROM driveruser limit 1" is run

  Scenario: Set the config
      Given FAKE config from string '{ "host": "newwefr",  "port": "1234",  "database": "wearwea"}'
      And FAKE query from string "SELECT * FROM driveruser limit 1" is run
  Scenario: Set env variables
      Given set environment variable "USE_ENV_VARIABLES" to "TRUE"
      And FAKE query from string "SELECT * FROM driveruser limit 1" is run
      Given set environment variable "USE_ENV_VARIABLES" to "FALSE"
