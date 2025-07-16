Feature: Validations: Set Comparison Operations
  Background:
    When set "directory" to "./test"

  Scenario: Array set matching
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
