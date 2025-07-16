Feature: Validations: Data Manipulation and Variable Setting
  Background:
    When set "directory" to "./test"

  Scenario: Basic variable setting
    When set "item" to "hello"
    Then "${item}" is equal to "hello"

  Scenario: Setting variables to different types
    When set "hi" to 3
    Then item "hi" is equal to 3
    When set "hi" to ""
    Then "${hi}" is equal to ""

  Scenario: Setting JSON objects
    When set "hi" to "{}"
    Then item "hi" is equal to "{}"
    When set "hi" to '{ "hello": { "there": "General Kenobi!" } }'
    Then item "hi" is equal to '{ "hello": { "there": "General Kenobi!" } }'

  Scenario: Setting nested JSON properties
    When set "well.hello.there" to "me?"
    Then item "well.hello.there" is equal to "me?"
    And item "well.hello" is equal to '{ "there": "me?" }'
    And item "well" is equal to '{ "hello": { "there": "me?" } }'

  Scenario: Setting complex nested objects
    When set "hi.hello.there" to "General Kenobi!"
    Then item "hi" is equal to '{ "hello": { "there": "General Kenobi!" } }'
    When set "hi.over.here" to "I see you!"
    Then item "hi" is equal to '{ "hello": { "there": "General Kenobi!" }, "over": { "here": "I see you!" } }'

  Scenario: Setting array values
    When set "hi" to "[]"
    Then item "hi" is equal to "[]"
    When set "hi[0]" to "hello"
    Then item "hi[0]" is equal to "hello"

  Scenario: Setting with docString
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

  Scenario: Setting using data table
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

  Scenario: Setting item from another item
    When set "hi" to "hello"
    And set "item2" to item "hi"
    Then "${item2}" is equal to "hello"

  Scenario: Setting from file
    When set "item" to file "file.json"
    Then "${item[1].name}" is equal to "joe"

  Scenario: Setting configuration from JSON file
    When set config from json file "newConfig2.json"
    And set "hello" to "${environment}"

  Scenario: Setting configuration from JSON item
    When set "param" to "meh"
    When set config from json file "config.json"
    When set config from json item "deepMeh2"
    Then "${deep3}" is equal to "Testing3"
    Then "${meh}" is equal to "Test"

  Scenario: Setting result values
    When set result to "15"
    Then it is equal to "15"
    When set result to string "hello17"
    Then it is equal to "hello17"
    When set result to "17"
    And set "bla" to it
    Then it is equal to "17"
    Then item "bla" is equal to 17

  Scenario: Setting with JSON number variables
    When set "num" to "5"
    When set "hi" to:
      """
      {
      "num": ${num}
      }
      """

  Scenario: Template filling
    When set "versionNum" to 3
    And set "vNum" to "$100.00"
    When set "version" to "v3"
    When set "request" to:
      """
      {
        "version": "${version}",
        "versionNumber": ${versionNum},
        "price": "${vNum}"
      }
      """

  Scenario: Template string execution
    Given set "numVal" to 5
    When run templateString
      """
      {
      "bob": ${numVal}
      }
      """

  Scenario: CSV to JSON conversion (requires test.csv file)
    # When convert csv file "test.csv" to json

  Scenario: Setting examples from scenario outline
    When set examples

  Scenario: Apply parameters
    Given parameters are:
      """
      {
        "hello": "world"
      }
      """
    When apply parameters

  Scenario Outline: Template variable examples
    Given set "<item>" to "<value>"
    Then "${<item>}" is equal to "<value>"
    Examples:
      | item | value |
      | item | hi    |
