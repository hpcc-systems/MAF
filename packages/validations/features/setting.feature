Feature: Validations: Setting variables
  Background:
    When set "directory" to "./test"

  Scenario: Check that we can identify a null or undefined element
    When set result to "15"
    Then it is equal to "15"
    When set "a" to 3
    Then item "a" is not null
    And item "b" is null
  Scenario: Check that we can identify a null or undefined element
    When set result to "15"
    Then it is equal to "15"
    When set "a" to 3
    Then item "a" is not null
    And item "b" is null

  Scenario:  Set config as the first step
    When set config from json file "newConfig2.json"
    And set "hello" to "${environment}"
  Scenario:  Set config as the first step
    When set config from json file "newConfig2.json"
    And set "hello" to "${environment}"

  Scenario: Set an empty string
    When set "hi" to ""
    Then "${hi}" is equal to ""
  Scenario: Set an empty string
    When set "hi" to ""
    Then "${hi}" is equal to ""

  Scenario: Testing json item saves
    When set "hi" to "{}"
    Then item "hi" is equal to "{}"
    When set "well.hello.there" to "me?"
    Then item "well.hello.there" is equal to "me?"
    And item "well.hello" is equal to '{ "there": "me?" }'
    And item "well" is equal to '{ "hello": { "there": "me?" } }'

    When set "hi" to '{ "hello": { "there": "General Kenobi!" } }'
    Then item "hi" is equal to '{ "hello": { "there": "General Kenobi!" } }'
    When set "hi.hello.there" to "General Kenobi!"
    Then item "hi" is equal to '{ "hello": { "there": "General Kenobi!" } }'
    When set "hi.over.here" to "I see you!"
    Then item "hi" is equal to '{ "hello": { "there": "General Kenobi!" }, "over": { "here": "I see you!" } }'
    And item "well" is equal to '{ "hello": { "there": "me?" } }'

  Scenario: Testing array saves
    When set "hi" to "[]"
    Then item "hi" is equal to "[]"
    When set "hi[0]" to "hello"
    Then item "hi[0]" is equal to "hello"

  Scenario: Miscellaneous
    When set "hi" to 3
    Then item "hi" is equal to "3"
    When set "hi" to "{}"
    And item "hi" is not equal to item "hello"

  Scenario: Setting to item
    When set:
      | username | pass  |
      | User     | Pass  |
      | User2    | 2Pass |
    Then "${username[0]}" is equal to "User"
    Then "${username[1]}" is equal to "User2"
    And set:
      | username | pass |
      | User     | Pass |
    Then "${username}" is equal to "User"
    When set "hi" to "hello"
    And set "item2" to item "hi"
    Then "${item2}" is equal to "hello"
  Scenario: Setting item from file
    When set "param" to "meh"
    When set config from json file "config.json"
    When set config from json item "deepMeh2"
    Then "${deep3}" is equal to "Testing3"
    Then "${meh}" is equal to "Test"
  Scenario: Set json with number varaible
    When set "num" to "5"
    When set "hi" to
      """
      {
      "num": ${num}
      }
      """

  Scenario: Check two json objects
    When set "a" to "3"
    And set "item" to:
      """
      {
      "a": ${a}
      }
      """
    Then item "item" is equal to:
      """
      {
        "a": 3
      }
      """
    And set "a" to '"hi"'
    And set "item" to:
      """
      {
        "a": "${a}"
      }
      """
    Then item "item" is equal to:
      """
      {
        "a": "\"hi\""
      }
      """
  Scenario: Check two json objects
    When set "a" to "3"
    And set "item" to:
      """
      {
      "a": ${a}
      }
      """
    Then item "item" is equal to:
      """
      {
        "a": 3
      }
      """
    And set "a" to '"hi"'
    And set "item" to:
      """
      {
        "a": "${a}"
      }
      """
    Then item "item" is equal to:
      """
      {
        "a": "\"hi\""
      }
      """

  Scenario Outline: Set the examples
    Given parameters are:
      """
      {
        "hello": "world"
      }
      """
    When apply parameters
    Then 5 = 5
  Scenario Outline: Set the examples
    Given parameters are:
      """
      {
        "hello": "world"
      }
      """
    When apply parameters
    Then 5 = 5
