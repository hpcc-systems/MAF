Feature: Validations: File Operations and I/O
  Background:
    When set "directory" to "./test"

  Scenario: Basic file writing and reading
    When set:
      | item          | externalReferenceId |
      | hello.json    | hello              |
    When set "item" to file "hello.json"
    And item "item" is written in json line delimited format to file "hello2.json"

  Scenario: File compression operations
    When set "item" to file "hello.json"
    And item "item" is written in json line delimited format to file "hello2.json"
    And the file "hello2.json" is gzipped
    And file "hello2.json.gz" is gzip unzipped to file "HELLO_DUPL.txt"

  Scenario: String to file operations
    When set:
      | item          | externalReferenceId |
      | hello.json    | hello              |
    And string "${externalReferenceId}" is written to file "helloWERAWE.txt"

  Scenario: Multi-line string to file
    And set "bla" to:
      """
      HELLO
      WORLD
      """
    And string "${bla}" is written to file "multiLine.txt"

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

  Scenario: lastRun to file writing
    When set result to "17"
    And it is written to file "hello.txt"
    And item "lastRun" is written to file "hello2.txt"
