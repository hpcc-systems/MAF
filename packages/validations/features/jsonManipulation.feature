Feature: Validations: JSON Manipulation and Processing
  Background:
    When set "directory" to "./test"

  Scenario: JSON key extraction
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
                  "subErrorCode": "1101",
                  "subErrorMessage": "Phone Number is required"
                }
              ]
            }
      }
      """
    When JSON key "subErrorCodes[0].subErrorCode" is extracted from item "response.error"
    And it is equal to "1101"
    When JSON key "subErrorCodes[0].subErrorMessage" is extracted from item "response.error"
    And it is equal to "Phone Number is required"
    When JSON key "doesnotexist" is extracted from item "response"
    And it is equal to "null"

  Scenario: JSON element existence checking
    When set "Data" to:
      """
      {
        "a": "apple",
        "b": "banana",
        "c": "cherry"
      }
      """
    Then element "a" exists in item "Data"
    When JSON key "a" is extracted from item "Data"
    Then it is equal to "apple"
    And elements '["a", "b"]' exist in item "Data"
    And elements 'a, b' exist in item "Data"

  Scenario: JSON key removal
    When set "Data" to:
      """
      {
        "a": "apple",
        "b": "banana",
        "c": "cherry"
      }
      """
    When JSON key "a" is removed from "Data"
    Then "${Data.b}" is equal to "banana"
    And element "a" does not exist in item "Data"
    And elements '[d]' do not exist in item "Data"

  Scenario: Complex JSON key deletion
    When set "TestJSON" to:
      """
      {
        "meh": "test",
        "deepMeh": {
          "deep1": "value1",
          "deep2": "value2"
        }
      }
      """
    And JSON key "meh" is removed from item "TestJSON"
    And set "lastRun" to item "TestJSON"
    And JSON key "deepMeh.deep1" is removed from it

  Scenario: JSON path operations
    When set "item" to file "file.json"
    When set "expected" to '["joe", "jeff"]'
    And run json path '$..name' on item 'item'
    Then set "item" to it
    Then the set "lastRun" matches the set "expected"
    Then the set "lastRun" matches the set from file "expected.json"
    Then it matches the set from file "expected.json"
    Then it matches the set "expected"

  Scenario: JSON path value modification
    Given set "meh" to:
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
    And set "expected" to:
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

  Scenario: JSON transformations - lowercase keys
    When set "TestJSON" to:
      """
      {
        "CamelCase": "value",
        "UPPERCASE": "value2"
      }
      """
    When make json keys for item "TestJSON" lower case

  Scenario: JSON transformations - flatten
    When set "TestJSON" to:
      """
      {
        "level1": {
          "level2": {
            "value": "test"
          }
        }
      }
      """
    When json item "TestJSON" is flattened

  Scenario: JSON transformations - numberify
    When set "data" to:
      """
      {
      "Alpha": "123",
      "Beta": {
          "Beta_21": "456",
          "Beta_22": "some_word"
          },
      "Charley": {
          "Charley_21": "45.6",
          "Charley_22": 24.9
          },
      "Delta": "1.2.3"
      }
      """
    When json item "data" is numberifyed

  Scenario: JSON transformations - trim
    When set "TestJSON" to:
      """
      {
        "field1": "  trimmed  ",
        "field2": "  also trimmed  "
      }
      """
    When json item "TestJSON" is trimmed

  Scenario: JSON multiple key extraction
    When set "TestJSON" to:
      """
      {
        "name": "John",
        "age": 30,
        "city": "New York"
      }
      """
    When JSON keys '["name", "age"]' are extracted from "TestJSON"

  Scenario: JSON key extraction with array handling
    When set "arrayData" to:
      """
      {
        "items": [
          {"id": 1, "name": "first"},
          {"id": 2, "name": "second"}
        ]
      }
      """
    When JSON key "items[0].id" is extracted from item "arrayData"
    And it is equal to "1"
    When JSON key "items[1].name" is extracted from item "arrayData"
    And it is equal to "second"

  Scenario: JSON path extraction with nested objects
    When set "nestedData" to:
      """
      {
        "level1": {
          "level2": {
            "level3": "deep value"
          }
        }
      }
      """
    When JSON key "level1.level2.level3" is extracted from item "nestedData"
    And it is equal to "deep value"

  Scenario: JSON key removal operations
    When set "testData" to:
      """
      {
        "name": "John",
        "age": 30,
        "email": "john@example.com"
      }
      """
    When JSON key "age" is removed from item "testData"
    Then element "age" does not exist in item "testData"
    And element "name" exists in item "testData"

  Scenario: JSON manipulation operations
    When set "jsonData" to:
      """
      {
        "Name": "ALICE",
        "AGE": "25",
        "Address": {
          "CITY": "Boston",
          "ZIP": "02101"
        }
      }
      """
    When make json keys for item "jsonData" lower case
    Then element "name" exists in item "jsonData"
    And element "age" exists in item "jsonData"
    When json item "jsonData" is flattened
    When json item "jsonData" is numberifyed
    When json item "jsonData" is trimmed
