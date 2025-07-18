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

  Scenario Outline: Test cleaning non-object items (line 113 guard clause)
    When set "testItem" to "<input>"
    And '${testItem}' is cleaned
    Then it is equal to "<expected>"
    Examples:
      | input | expected |
      | null  | null     |
      | ""    | ""       |
      | 123   | 123      |
      | true  | true     |

  Scenario: Test cleaning DynamoDB response with Item wrapper
    When set "testItem" to '{"Item":{"label":{"S":"test"},"score":{"N":"100"}}}'
    And '${testItem}' is cleaned
    Then it is equal to '{"label":"test","score":"100"}'

  Scenario: Test cleaning item with empty attribute object
    When set "testItem" to '{"label":{},"validAttr":{"S":"test"}}'
    And '${testItem}' is cleaned
    Then it is equal to '{"validAttr":"test"}'

  Scenario: Test conversion with nested object (MAP type)
    When '{"label":"_MapTest","nestedObj":{"key1":"value1","key2":"value2"}}' is converted to dynamo
    Then it is equal to '{"label":{"S":"_MapTest"},"nestedObj":{"M":"[object Object]"}}'

  Scenario: Test conversion with base64 binary data
    When '{"label":"_BinaryTest","binaryData":"SGVsbG8gV29ybGQ="}' is converted to dynamo
    Then it is equal to '{"label":{"S":"_BinaryTest"},"binaryData":{"B":"SGVsbG8gV29ybGQ="}}'

  Scenario: Test conversion with various data types including arrays and null
    When '{"label":"_TypeTest","nullValue":null,"arrayValue":[1,2,3],"undefinedLike":"undefined"}' is converted to dynamo
    Then it is equal to '{"label":{"S":"_TypeTest"},"nullValue":{"N":"null"},"arrayValue":{"S":"1,2,3"},"undefinedLike":{"S":"undefined"}}'

  Scenario: Test cleaning array with mixed attribute formats
    When set "arrayData" to '[{"label":{"S":"test1"},"score":{}},{"label":{"S":"test2"},"score":{"N":"50"}}]'
    And '${arrayData}' is cleaned
    Then it contains "test2"
    And it contains "50"

  Scenario: Test conversion with numeric strings and zero values
    When '{"label":"_NumericTest","zeroNumber":0,"stringNumber":"999","floatNumber":3.14}' is converted to dynamo
    Then it contains "zeroNumber"
    And it contains "stringNumber"
    And it contains "floatNumber"

  Scenario: Test conversion with special string values that look like numbers
    When '{"label":"_SpecialTest","stringThatLooksLikeNumber":"123abc","emptyString":"","actualNumber":42}' is converted to dynamo
    Then it contains "stringThatLooksLikeNumber"
    And it contains "emptyString"

  Scenario: Test conversion with boolean false and true
    When '{"label":"_BoolTest","falseBool":false,"trueBool":true,"stringFalse":"false"}' is converted to dynamo
    Then it contains "falseBool"
    And it contains "trueBool"
    And it contains "stringFalse"

  Scenario: Test cleaning with nested DynamoDB structures
    When set "complexItem" to '{"user":{"M":{"name":{"S":"John"},"age":{"N":"30"}}},"active":{"BOOL":true}}'
    And '${complexItem}' is cleaned
    Then it contains "user"
    And it contains "active"

  Scenario: Test pagination scenario with table operations
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "keyConditionExpression" to "label = :label"
    And set "limit" to "1"
    And set "expressionAttributeValues" to:
      """
      {
        ":label": {"S": "_Alpha"}
      }
      """
    And dynamodb query is performed

  Scenario: Test update item with return values
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "key" to '{"label":{"S":"_Test"}}'
    And set "updateExpression" to "SET score = :newScore"
    And set "returnValues" to "ALL_NEW"
    And set "expressionAttributeValues" to:
      """
      {
        ":newScore": {"N": "200"}
      }
      """
    And dynamodb update-item is performed

  Scenario: Test cleaning with completely empty attribute objects (line 126)
    When set "emptyAttrItem" to '{"validAttr":{"S":"valid"},"emptyAttr":{},"anotherEmpty":{}}'
    And '${emptyAttrItem}' is cleaned
    Then it is equal to '{"validAttr":"valid"}'

  Scenario: Test DynamoDB operations with different parameter combinations
    Given table "testtable" exists on dynamo
    And set "tableName" to "testtable"
    And set "keyConditionExpression" to "label = :label"
    And set "limit" to "10"
    And set "scanIndexForward" to "false"
    And set "expressionAttributeValues" to:
      """
      {
        ":label": {"S": "_Alpha"}
      }
      """
    And dynamodb query is performed
    And it is cleaned

  Scenario: Test operations with non-DynamoDB formatted JSON items
    When set "regularItem" to '{"name":"John","age":30,"active":true}'
    And '${regularItem}' is cleaned
    Then it is equal to '{"name":"John","age":30,"active":true}'

  Scenario: Test complex attribute cleaning scenarios
    When set "complexItem" to '{"attr1":{"S":"value1"},"attr2":{"N":"123"},"attr3":{"BOOL":true},"attr4":{"NULL":true},"attr5":{"SS":["val1","val2"]}}'
    And '${complexItem}' is cleaned
    Then it contains "value1"
    And it contains "123"
    And it contains "true"

  Scenario: Test conversion edge cases with special characters
    When '{"label":"_SpecialChars","specialString":"test@#$%","quotedString":"\"quoted\"","backslash":"\\test\\"}' is converted to dynamo
    Then it contains "specialString"
    And it contains "quotedString"
    And it contains "backslash"

  Scenario: Test array conversion and string number conversion edge cases
    When '{"label":"_EdgeCase","floatString":"3.14159","negativeNumber":-42,"sciNotation":"1e10","hexString":"0xFF"}' is converted to dynamo
    Then it contains "floatString"
    And it contains "negativeNumber"
    And it contains "sciNotation"

  Scenario: Test handling of undefined and function-like values
    When '{"label":"_UndefinedTest","stringUndefined":"undefined","stringFunction":"function(){}"}' is converted to dynamo
    Then it contains "stringUndefined"
    And it contains "stringFunction"
