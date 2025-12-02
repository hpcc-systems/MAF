Feature: Validations: File Operations and I/O
  Background:
    Given set "directory" to "./test"

  Scenario: Basic file writing and reading
    When set:
      | item       | externalReferenceId |
      | hello.json | hello               |
    When set "item" to file "hello.json"
    And item "item" is written in json line delimited format to file "hello2.json"

  Scenario: File compression operations
    When set "item" to file "hello.json"
    And item "item" is written in json line delimited format to file "hello2.json"
    And the file "hello2.json" is gzipped
    And file "hello2.json.gz" is gzip unzipped to file "HELLO_DUPL.txt"

  Scenario: String to file operations
    When set:
      | item       | externalReferenceId |
      | hello.json | hello               |
    And string "${externalReferenceId}" is written to file "helloWERAWE.txt"

  Scenario: Multi-line string to file
    Given set "bla" to:
      """
      HELLO
      WORLD
      """
    When string "${bla}" is written to file "multiLine.txt"

  Scenario: JSON path file modification
    When "SomethingElse" is written to file "newconfig.json" on JSON path "$.meh"
    And set config from json file "newconfig.json"
    Then "${meh}" is equal to "SomethingElse"
    When "Test" is written to file "newconfig.json" on JSON path "$.meh"
    And set config from json file "newconfig.json"
    Then "${meh}" is equal to "Test"

  Scenario: Item to file writing
    Given set "a" to 5
    When item "a" is written to file "testItem.txt"
    Then file "testItem.txt" is equal to "5"

  Scenario: JSON path item modification
    Given set "testObject" to:
      """
      {
        "name": "John",
        "age": 30,
        "address": {
          "city": "New York",
          "zip": "10001"
        }
      }
      """
    When "Jane" is applied to item "testObject" on JSON path "$.name"
    Then item "testObject" contains "Jane"
    When "35" is applied to item "testObject" on JSON path "$.age"
    Then item "testObject" contains "35"
    When "Boston" is applied to item "testObject" on JSON path "$.address.city"
    Then item "testObject" contains "Boston"

  Scenario: JSON path item modification with empty string value
    Given set "testObject" to:
      """
      {
        "name": "John",
        "value": "test"
      }
      """
    When "" is applied to item "testObject" on JSON path "$.name"
    Then item "testObject" contains '""'

  Scenario: JSON path item modification with object value
    Given set "testObject" to:
      """
      {
        "name": "John",
        "nested": {}
      }
      """
    When '{"city": "Boston", "state": "MA"}' is applied to item "testObject" on JSON path "$.nested"
    Then item "testObject" contains "Boston"
    And item "testObject" contains "MA"

  Scenario: JSON path item modification with invalid JSON value
    Given set "testObject" to:
      """
      {
        "name": "John",
        "value": "test"
      }
      """
    When "invalid json {" is applied to item "testObject" on JSON path "$.value"
    Then item "testObject" contains "invalid json {"

  Scenario: JSON object written to file as string
    Given set "testObject" to "simple string value"
    When item "testObject" is written to file "stringTest.txt"
    Then file "stringTest.txt" is equal to "simple string value"

  Scenario: lastRun to file writing
    When set result to "17"
    And it is written to file "hello.txt"
    And item "lastRun" is written to file "hello2.txt"

  Scenario: Append JSON items as line-delimited to file
    When set:
      | name  | value |
      | item1 | data1 |
      | item2 | data2 |
    And set "batch1" to "${name.map((n, i) => ({name: n, value: value[i]}))}"
    And item "batch1" is written in json line delimited format to file "appendTest2.json"
    And set "existingData" to file "appendTest2.json"
    And set:
      | name  | value |
      | item3 | data3 |
      | item4 | data4 |
    And set "batch2" to "${name.map((n, i) => ({name: n, value: value[i]}))}"
    And set "combined" to "${[...existingData, ...batch2]}"
    And item "combined" is written in json line delimited format to file "appendTest2.json"
    Then file "appendTest2.json" contains "item1"
    And file "appendTest2.json" contains "item2"
    And file "appendTest2.json" contains "item3"
    And file "appendTest2.json" contains "item4"
