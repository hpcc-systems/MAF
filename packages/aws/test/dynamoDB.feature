Feature: DynamoDB
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
