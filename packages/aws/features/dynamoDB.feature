Feature: AWS: DynamoDB
  Scenario Outline: Put item on DynamoDB Table
    Given table "testtable" exists on dynamo
    When "<item>" is converted to dynamo
    And set "item" to it
    And set "tableName" to "testtable"
    And dynamodb put-item is performed
    Examples:
      | item                                                    |
      | {"label":"_Alpha","some_number":86,"some_word":"Apple"} |
      | {"label":"_Beta","some_number":32,"some_word":"Banana"} |

  Scenario Outline: Item Query - DocString and overwriting global
    Given table "testtable" exists on dynamo
    When set "tableName" to "Non-existingTestTable"
    When perform dynamodb query:
      """
      {
        "keyConditionExpression": "label = :a",
        "tableName": "testtable",
        "expressionAttributeValues": {
          ":a": {
            "S": "<key>"
          }
        }
      }
      """
    Then "${lastRun.length}" is equal to "<count>"
    Examples:
      | key      | count |
      | _Alpha   | 1     |
      | _Beta    | 1     |
      | _Charlie | 0     |

  Scenario Outline: Item Query - Clean and ProjectionExpression
    Given table "testtable" exists on dynamo
    And set "keyConditionExpression" to "label = :theLabel"
    And set "expressionAttributeValues" to:
      """
      {
        ":theLabel": {
          "S": "<key>"
        }
      }
      """
    And set "tableName" to "testtable"
    And dynamodb query is performed
    And it is cleaned
    And it is equal to "<item>"
    And set "projectionExpression" to "some_number,some_word"
    And dynamodb query is performed
    And it is cleaned
    And it is equal to "<item2>"
    Examples:
      | key    | item                                                           | item2                                         |
      | _Alpha | [{"some_word": "Apple","label": "_Alpha","some_number": "86"}] | [{"some_word": "Apple","some_number": "86"}]  |
      | _Beta  | [{"some_word": "Banana","label": "_Beta","some_number": "32"}] | [{"some_word": "Banana","some_number": "32"}] |

  Scenario Outline: Item Update - With dynamo conversion
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "updateExpression" to "SET <attribute> = :a"
    And set "expressionAttributeValues" to:
      """
      {
        ":a": {
          "S": "<value>"
        }
      }
      """
    And "<item>" is converted to dynamo
    And set "key" to it
    And dynamodb update-item is performed
    When set "keyConditionExpression" to "label = :a"
    And set "expressionAttributeValues" to:
      """
      {
        ":a": {
          "S": "<key>"
        }
      }
      """
    And dynamodb query is performed
    And it is cleaned
    Then it is equal to "<newItem>"
    Examples:
      | key    | item               | attribute     | value   | newItem                                                                                   |
      | _Alpha | {"label":"_Alpha"} | some_word     | Orange  | [{"some_word": "Orange","label": "_Alpha","some_number": "86"}]                           |
      | _Beta  | {"label":"_Beta"}  | some_word     | Grapes  | [{"some_word": "Grapes","label": "_Beta","some_number": "32"}]                            |
      | _Beta  | {"label":"_Beta"}  | new_attribute | Balloon | [{"new_attribute": "Balloon","some_word": "Grapes","label": "_Beta","some_number": "32"}] |

  Scenario Outline: Delete Item on DynamoDB
    Given table "testtable" exists on dynamo
    When "<item>" is converted to dynamo
    And set "myKey" to it
    And perform dynamodb delete-item:
      """
      {
        "tableName":"testtable",
        "key": ${myKey}
      }
      """
    And '${lastRun.Attributes}' is cleaned
    And it is equal to "<deletedItem>"
    Examples:
      | item               | deletedItem                                                                             |
      | {"label":"_Alpha"} | {"some_word": "Orange","label": "_Alpha","some_number": "86"}                           |
      | {"label":"_Beta"}  | {"new_attribute": "Balloon","some_word": "Grapes","label": "_Beta","some_number": "32"} |

  Scenario: Test conversion with different data types
    Given table "testtable" exists on dynamo
    When '{"label":"_Test","isActive":true,"score":95,"data":"SGVsbG8gV29ybGQ="}' is converted to dynamo
    And set "item" to it
    And set "tableName" to "testtable"
    And dynamodb put-item is performed

  Scenario: Test query with filterExpression and scanIndexForward
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "keyConditionExpression" to "label = :label"
    And set "filterExpression" to "some_number > :minNumber"
    And set "scanIndexForward" to "true"
    And set "expressionAttributeValues" to:
      """
      {
        ":label": {"S": "_Alpha"},
        ":minNumber": {"N": "50"}
      }
      """
    And dynamodb query is performed

  Scenario: Test query with expressionAttributeNames
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "keyConditionExpression" to "#lbl = :label"
    And set "expressionAttributeNames" to:
      """
      {
        "#lbl": "label"
      }
      """
    And set "expressionAttributeValues" to:
      """
      {
        ":label": {"S": "_Alpha"}
      }
      """
    And dynamodb query is performed

  Scenario: Test dynamodb query from jsonObject
    Given table "testtable" exists on dynamo
    When dynamodb query from '{"tableName":"testtable","keyConditionExpression":"label = :label","expressionAttributeValues":{":label":{"S":"_Alpha"}}}' is performed

  Scenario: Test dynamodb put-item from jsonObject
    Given table "testtable" exists on dynamo
    When dynamodb put-item from '{"tableName":"testtable","item":{"label":{"S":"_JsonTest"},"value":{"S":"test"}}}' is performed

  Scenario: Test dynamodb update-item from jsonObject
    Given table "testtable" exists on dynamo
    When dynamodb update-item from '{"tableName":"testtable","key":{"label":{"S":"_JsonTest"}},"updateExpression":"SET #v = :val","expressionAttributeNames":{"#v":"value"},"expressionAttributeValues":{":val":{"S":"updated"}}}' is performed

  Scenario: Test dynamodb delete-item from jsonObject
    Given table "testtable" exists on dynamo
    When dynamodb delete-item from '{"tableName":"testtable","key":{"label":{"S":"_JsonTest"}}}' is performed

  Scenario: Test cleaning different JSON formats
    Given table "testtable" exists on dynamo
    When set "testItem" to '{"Item":{"label":{"S":"test"}}}'
    And '${testItem}' is cleaned
    Then it is equal to '{"label":"test"}'

  Scenario: Test perform dynamodb put-item with docstring
    Given table "testtable" exists on dynamo
    When perform dynamodb put-item:
      """
      {
        "tableName": "testtable",
        "item": {
          "label": {"S": "_DocStringTest"},
          "description": {"S": "test item"}
        }
      }
      """

  Scenario: Test perform dynamodb update-item with docstring
    Given table "testtable" exists on dynamo
    When perform dynamodb update-item:
      """
      {
        "tableName": "testtable",
        "key": {"label": {"S": "_DocStringTest"}},
        "updateExpression": "SET description = :desc",
        "expressionAttributeValues": {
          ":desc": {"S": "updated description"}
        }
      }
      """

  Scenario: Test object conversion with nested objects
    Given table "testtable" exists on dynamo
    When '{"label":"_NestedTest","simpleString":"test"}' is converted to dynamo
    And set "item" to it
    And set "tableName" to "testtable"
    And dynamodb put-item is performed

  Scenario: Test query with additional parameters but no indexName
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "keyConditionExpression" to "label = :label"
    And set "expressionAttributeValues" to:
      """
      {
        ":label": {"S": "_Alpha"}
      }
      """
    And dynamodb query is performed

  Scenario: Test cleaning array of items
    Given table "testtable" exists on dynamo
    When set "arrayData" to '[{"label":{"S":"test1"}},{"label":{"S":"test2"}}]'
    And '${arrayData}' is cleaned
    Then it contains "test1"

  Scenario: Test operations with results not initialized
    Given table "testtable" exists on dynamo
    When perform dynamodb query:
      """
      {
        "tableName": "testtable",
        "keyConditionExpression": "label = :label",
        "expressionAttributeValues": {
          ":label": {"S": "_Alpha"}
        }
      }
      """

  Scenario: Test update with expressionAttributeNames
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "key" to '{"label":{"S":"_Test"}}'
    And set "updateExpression" to "SET #score = :newScore"
    And set "expressionAttributeNames" to:
      """
      {
        "#score": "score"
      }
      """
    And set "expressionAttributeValues" to:
      """
      {
        ":newScore": {"N": "100"}
      }
      """
    And dynamodb update-item is performed

  Scenario: Test conversion with different data types including string numbers
    Given table "testtable" exists on dynamo
    When '{"label":"_NumberTest","stringNumber":"123","realNumber":456,"boolTrue":true,"boolFalse":false}' is converted to dynamo
    And set "item" to it
    And set "tableName" to "testtable"
    And dynamodb put-item is performed
