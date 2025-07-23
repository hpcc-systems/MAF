Feature: Validations: Set Comparison Operations
  Background:
    Given set "directory" to "./test"

  Scenario: Array set matching
    Given set "item" to file "file.json"
    And set "expected" to '["joe", "jeff"]'
    When run json path '$..name' on item 'item'
    And set "item" to it
    Then the set "lastRun" matches the set "expected"
    And the set "lastRun" matches the set from file "expected.json"
    And it matches the set from file "expected.json"
    And it matches the set "expected"
    And item "item" is equal to:
      """
      [
        "jeff",
        "joe"
      ]
      """

  Scenario: Set comparison between variables
    When set "set1" to '["apple", "banana", "cherry"]'
    And set "set2" to '["cherry", "apple", "banana"]'
    Then the set "set1" matches the set "set2"

  Scenario: Set comparison with file (requires expected.json)
    # When set "mySet" to '["value1", "value2", "value3"]'
    # Then the set "mySet" matches the set from file "expected.json"
