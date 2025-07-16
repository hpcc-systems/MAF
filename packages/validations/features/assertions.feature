Feature: Validations: Assertions and Comparisons
  Background:
    When set "directory" to "./test"

  Scenario: Numeric equivalence operations
    Given set "lastRun" to "5"
    Then it is not null
    And "5" >= "5"
    And "6" > "5"
    And "4" < "5"
    And "5" <= "5"
    And "5" = "5"

  Scenario: Null and not null checks
    Given set "bob" to "6"
    Then item "bob" is not null
    And item "undefinedItem" is null

  Scenario: String and object equality
    Then "5" is not equal to "7"
    Given set "bob" to "6"
    And set "sally" to "7"
    Then "${sally}" is not equal to "${bob}"

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

  Scenario: Date validation - before now
    Given set "created_date" to "11/11/2019"
    Then item "created_date" is before now

  Scenario: Date validation - comparison between dates
    Then "11/11/2019" is before "11/12/2019"

  Scenario: Date validation - timestamp comparison
    Given set "created_date" to "${new Date().getTime()-1}"
    Given set "created_date2" to "${new Date().getTime()}"
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
    When set "response" to:
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
