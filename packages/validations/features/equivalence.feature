Feature: Equivalence testing
  Scenario: Last item not null
    Given set "lastRun" to "5"
    Then it is not null
    And "5" >= "5"
  Scenario: Check an item is not null
    Given set "bob" to "6"
    Then item "bob" is not null
  Scenario: Check a value is not equal to another value
    Then "5" is not equal to "7"
  Scenario: Check fill template with items not equal
    Given set "bob" to "6"
    And set "sally" to "7"
    Then "${sally}" is not equal to "${bob}"
  Scenario: Check if Json contains string
    Given set "test1" to "the quick brown fox jumped over the lazy dog"
    Then item "test1" contains "quick brown"
    Given set "test2" to:
    """
    {
      "firstname" : "Robert",
      "lastname" : "Paulson"
    }
    """
    Then item "test2" contains "Robert"
    And item "test2" contains "lastname"
    When set "myItem" to "Banan"
    Given set "test3" to:
    """
    [
      "Apple",
      "Banana",
      "Orange"
    ]
    """
    Then item "test3" contains "Ora"
    And item "test3" contains "${myItem}"
    And item "test3" does not contain "Kiwi"
