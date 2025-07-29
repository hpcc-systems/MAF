Feature: Validations: Assertions and Comparisons
  Background:
    Given set "directory" to "./test"

  Scenario: Numeric equivalence operations
    Given set "lastRun" to "5"
    Then it is not null
    And "5" >= "5"
    And "6" > "5"
    And "4" < "5"
    And "5" <= "5"
    And "5" = "5"
    And "2" != "5"

  Scenario: Null and not null checks
    Given set "bob" to "6"
    Then item "bob" is not null
    And item "undefinedItem" is null

  Scenario: String and object equality
    Given set "bob" to "6"
    And set "sally" to "7"
    Then "5" is not equal to "7"
    And "${sally}" is not equal to "${bob}"

  Scenario: JSON object equality
    Given set "a" to:
      """
      {
        "a": 5
      }
      """
    And set "b" to:
      """
      {
        "a": 5
      }
      """
    Then item "a" is equal to item "b"

  Scenario: JSON equivalence with multiline strings
    Given set "str" to:
      """
      I am a string"
      with new lines
      """
    And set "doubleStr" to:
      """
      ${str}
      Next Line
      """
    And set "newItem" to:
      """
      {
        "str": "${str}"
      }
      """
    Then item "newItem" is equal to:
      """
      {
        "str": "I am a string\"\nwith new lines"
      }
      """
    And item "doubleStr" is equal to:
      """
      I am a string"
      with new lines
      Next Line
      """

  Scenario: Contains operations
    Given set "test1" to "the quick brown fox jumped over the lazy dog"
    And set "test2" to:
      """
      {
        "firstname": "Robert",
        "lastname": "Paulson"
      }
      """
    And set "myItem" to "Banan"
    And set "test3" to:
      """
      [
        "Apple",
        "Banana",
        "Orange"
      ]
      """
    Then item "test1" contains "quick brown"
    And item "test2" contains "Robert"
    And item "test2" contains "lastname"
    And item "test3" contains "Ora"
    And item "test3" contains "${myItem}"
    And item "test3" does not contain "Kiwi"

  Scenario: Date validation - before now
    Given set "created_date" to "11/11/2019"
    Then item "created_date" is before now

  Scenario: Date validation - comparison between dates
    Then "11/11/2019" is before "11/12/2019"

  Scenario: Date validation - timestamp comparison
    Given set "created_date" to "${new Date().getTime()-1}"
    And set "created_date2" to "${new Date().getTime()}"
    Then item "created_date" is before item "created_date2"

  Scenario: Date validation - before now with timestamp
    Given set "created_date" to "${new Date().getTime()-1}"
    Then item "created_date" is before now

  Scenario: Date validation - after now
    Given set "created_date" to "${new Date().getTime()+10001}"
    Then item "created_date" is after now

  Scenario Outline: Date validation examples
    Given set "created_date" to "<created_date>"
    Then item "created_date" is <when> "<checked_date>"
    Examples:
      | created_date | when   | checked_date |
      | 11/11/2019   | before | 11/12/2019   |
      | 11/13/2019   | after  | 11/12/2019   |

  Scenario: Error response validation
    Given set "response" to:
      """
      {
        "referenceNumber": null,
        "results": null,
        "status": 400,
        "error": {
          "errorCode": -2,
          "errorMessage": "Invalid Request",
          "subErrorCodes": [
            {
              "subErrorCode": "0019",
              "subErrorMessage": "Zip code is required"
            }
          ]
        }
      }
      """
    Then item "response.error" is equal to:
      """
      {
        "errorCode": -2,
        "errorMessage": "Invalid Request",
        "subErrorCodes": [
          {
            "subErrorCode": "0019",
            "subErrorMessage": "Zip code is required"
          }
        ]
      }
      """
    And item "response.error" is not equal to:
      """
      {
        "errorCode": -3,
        "errorMessage": "Invalid Request",
        "subErrorCodes": [
          {
            "subErrorCode": "0019",
            "subErrorMessage": "Zip code is required"
          }
        ]
      }
      """

  Scenario: Luxon date library integration
    Given set "currentDate" to '${DateTime.now().toFormat("yyyy-MM-dd")}'
    Then item "currentDate" is equal to '${new Date().toISOString().slice(0,10)}'
    And item "currentDate" is not equal to '${DateTime.now().plus({days: 1}).toFormat("yyyy-MM-dd")}'

  Scenario: Comprehensive numeric comparisons
    Given set "num1" to "10"
    And set "num2" to "20"
    And set "num3" to "10"
    Then "${num2}" > "${num1}"
    And "${num2}" >= "${num1}"
    And "${num1}" < "${num2}"
    And "${num1}" <= "${num2}"
    And "${num1}" = "${num3}"
    And "${num1}" is not equal to "${num2}"

  Scenario: Boolean and edge case comparisons
    Given set "trueVal" to "true"
    And set "falseVal" to "false"
    And set "zeroVal" to "0"
    And set "oneVal" to "1"
    Then "${trueVal}" is not equal to "${falseVal}"
    And "${oneVal}" > "${zeroVal}"
    And "${zeroVal}" < "${oneVal}"

  Scenario: Does not deep equal assertion
    Given set "fruitList1" to:
      """
      [
        "Apple",
        "Banana",
        "Orange"
      ]
      """
    And set "fruitList2" to:
      """
      [
        "Kiwi",
        "Mango"
      ]
      """
    Then item "fruitList1" is not equal to item "fruitList2"

  Scenario: Does not deep equal assertion
    Given set "fruitList1" to:
      """
      [
        "Apple",
        "Banana",
        "Orange"
      ]
      """
    Then item "fruitList1" is not equal to:
      """
      "Banana"
      """

  Scenario: Array and string length validation
    Given set "testArray" to:
      """
      [
        "Apple",
        "Banana",
        "Orange"
      ]
      """
    And set "testString" to "Hello World"
    And set "emptyArray" to:
      """
      []
      """
    And set "testObject" to:
      """
      {
        "name": "John",
        "age": 30,
        "city": "New York"
      }
      """
    Then item "testArray" has a length of 3
    And item "testString" has a length of 11
    And item "emptyArray" has a length of 0
    And item "testObject" has a length of 3
    And item "testArray" has a length greater than 2
    And item "testArray" has a length less than 5
    And item "testString" has a length greater than 5
    And item "testString" has a length less than 20

  Scenario: Length validation with variables
    Given set "dynamicArray" to:
      """
      ["item1", "item2", "item3", "item4"]
      """
    And set "expectedLength" to "4"
    Then item "dynamicArray" has a length of 4
    And item "dynamicArray" has a length greater than 3
    And item "dynamicArray" has a length less than 6

  Scenario: Length validation edge cases
    And set "numberValue" to "12345"
    And set "booleanValue" to "true"
    Then item "numberValue" has a length of 5
    And item "booleanValue" has a length of 4
