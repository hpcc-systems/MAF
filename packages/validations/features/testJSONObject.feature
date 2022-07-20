
Feature: Core: Test the core json object
   Background:
     When set "directory" to "./test"
  Scenario: Test using file
    Given set "a" to 5
    And item "a" is written to file "testItem.txt"
    Then file "testItem.txt" is equal to "5"
    When set result to "17"
    And set "bla" to it
    Then it is equal to "17"
    Then item "bla" is equal to 17
    When set result to string "hello17"
    Then it is equal to "hello17"
