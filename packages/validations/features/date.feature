Feature: Date validation
  Background:
    When set "directory" to "packages/validations"

  Scenario: Validate date "11/11/2019" is before now
  Given set "created_date" to "11/11/2019"
  Then item "created_date" is before now

  Scenario: Validate date "11/11/2019" is before now
  Then "11/11/2019" is before "11/12/2019"

  Scenario: Validate date now-1 is before now
    Given set "created_date" to "${new Date().getTime()-1}"
    Given set "created_date2" to "${new Date().getTime()}"
    Then item "created_date" is before item "created_date2"

  Scenario: Validate date now-1 is before now
    Given set "created_date" to "${new Date().getTime()-1}"
    Then item "created_date" is before now

  Scenario Outline: Validate date "<created_date>" is <when> "<checked_date>"
  Given set "created_date" to "<created_date>"
  Then item "created_date" is <when> "<checked_date>"
  Examples:
    |created_date|when|checked_date|
    |11/11/2019 | before | 11/12/2019|
    |11/13/2019 | after | 11/12/2019|
  Scenario Outline: Validate when set item to value "<value>" then it's equal to that value
    Given set "<item>" to "<value>"
    Then "${<item>}" is equal to "<value>"
  Examples:
    |item|value|
    |item|hi|


  Scenario: When set array value it is able to validate in the area
    When set "item" to file "file.json"
    Then "${item[1].name}" is equal to "joe"
