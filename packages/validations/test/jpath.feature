Feature: Validations : Json Path Testing
  Background:
    When set "directory" to "packages/validations"

  Scenario: When set array value it is able to validate in the area
    When set "item" to file "file.json"
    When set "expected" to '["joe", "jeff"]'
    And run json path '$..name' on item 'item'
    Then set "item" to it
    Then the set "lastRun" matches the set "expected"
    Then the set "lastRun" matches the set from file "expected.json"
    Then it matches the set from file "expected.json"
    Then it matches the set "expected"
    Then item "item" is equal to:
    """
    ["jeff","joe"]
    """
    And it is written to file "hello.txt"
    And item "item" is written to file "hello2.txt"
  Scenario: Apply json path to item
    Given set "meh" to
    """
{
  "url": "http://google.com",
  "arrayTest": [
    "Testing1",
    "Testing2",
    "Testing3"
  ]
}
    """
  And set "expected" to
"""
{
  "url": null,
  "arrayTest": [
    "Testing1",
    "Testing2",
    "Testing3"
  ]
}
"""
  When set "meh.url" to "null"
  Then item "expected" is equal to item "meh"
  
  Scenario: Change JSON value in file
    When "SomethingElse" is written to file "newconfig.json" on JSON path "$.meh" 
    And set config from json file "newconfig.json"
    Then "${meh}" is equal to "SomethingElse"
    When "Test" is written to file "newconfig.json" on JSON path "$.meh"
    And set config from json file "newconfig.json"
    Then "${meh}" is equal to "Test"
  Scenario: Compare two items for equality
    Given set "a" to
    """
    {
      "a":5
    }
    """
    And set "b" to
    """
    {
      "a":5
    }
    """
   Then item "a" is equal to item "b"
