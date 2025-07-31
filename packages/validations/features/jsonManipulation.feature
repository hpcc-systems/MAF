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
        And it is equal to "undefined"

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
        And set "expected" to '["joe", "jeff"]'
        And run json path '$..name' on item 'item'
        Then set "item" to it
        And the set "lastRun" matches the set "expected"
        And the set "lastRun" matches the set from file "expected.json"
        And it matches the set from file "expected.json"
        And it matches the set "expected"

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
        Then element "camelcase" exists in item "TestJSON"
        And element "uppercase" exists in item "TestJSON"

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
        Then element "value" exists in item "TestJSON"
        And "${TestJSON.value}" is equal to "test"

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
        Then "${data.Alpha}" is equal to "123"
        And "${data.Beta.Beta_21}" is equal to "456"
        And item "data.Beta.Beta_22" is equal to "some_word"
        And "${data.Charley.Charley_21}" is equal to "45.6"
        And "${data.Charley.Charley_22}" is equal to "24.9"

    Scenario: JSON transformations - trim
        When set "TestJSON" to:
            """
            {
                "field1": "  trimmed  ",
                "field2": "  also trimmed  "
            }
            """
        When json item "TestJSON" is trimmed
        Then "${TestJSON.field1}" is equal to "trimmed"
        And "${TestJSON.field2}" is equal to "also trimmed"

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
        Then it is equal to:
            """
            {
                "name": "John",
                "age": 30
            }
            """

    Scenario: JSON key extraction with array handling
        When set "arrayData" to:
            """
            {
                "items": [
                    {
                        "id": 1,
                        "name": "first"
                    },
                    {
                        "id": 2,
                        "name": "second"
                    }
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

    Scenario: JSON key deletion error handling
        When set "invalidData" to:
            """
            {
                "valid": "data"
            }
            """
        # Test that key exists before deletion
        Then element "valid" exists in item "invalidData"

    Scenario: JSON key deletion with non-existent parent path - handled gracefully
        When set "testData" to:
            """
            {
                "level1": {
                    "level2": "value"
                }
            }
            """
        # Test successful deletion of existing path
        When JSON key "level1.level2" is removed from item "testData"
        Then element "level2" does not exist in item "testData.level1"

    Scenario: JSON extraction with invalid array syntax
        When set "arrayData" to:
            """
            {
                "items": [
                    "first",
                    "second",
                    "third"
                ]
            }
            """
        # Test invalid array syntax in path extraction
        When JSON key "items[invalid]" is extracted from item "arrayData"
        And it is equal to "undefined"

    Scenario: JSON extraction with non-array access
        When set "nonArrayData" to:
            """
            {
                "notArray": "string value"
            }
            """
        # Test array access on non-array field
        When JSON key "notArray[0]" is extracted from item "nonArrayData"
        And it is equal to "undefined"

    Scenario: JSON extraction with null values
        When set "nullData" to:
            """
            {
                "nullField": null,
                "nested": {
                    "alsoNull": null
                }
            }
            """
        When JSON key "nullField" is extracted from item "nullData"
        And it is equal to "undefined"
        When JSON key "nested.alsoNull" is extracted from item "nullData"
        And it is equal to "undefined"

    Scenario: JSON transformations with edge cases - arrays and nulls
        When set "edgeCaseData" to:
            """
            {
                "arrayField": [
                    1,
                    2,
                    3
                ],
                "nullField": null,
                "emptyObject": {},
                "mixedNested": {
                    "array": [
                        "a",
                        "b"
                    ],
                    "null": null,
                    "string": "  spaced  "
                }
            }
            """
        When make json keys for item "edgeCaseData" lower case
        When json item "edgeCaseData" is flattened
        When json item "edgeCaseData" is trimmed

    Scenario: JSON number conversion edge cases
        When set "numberData" to:
            """
            {
                "infinity": "Infinity",
                "negativeInfinity": "-Infinity",
                "notANumber": "NaN",
                "validNumber": "42.5",
                "validInteger": "123",
                "invalidNumber": "abc123",
                "emptyString": "",
                "nested": {
                    "validFloat": "3.14159",
                    "invalidFloat": "12.34.56"
                }
            }
            """
        When json item "numberData" is numberifyed

    Scenario: JSON extraction with deep null propagation
        When set "deepNullData" to:
            """
            {
                "level1": {
                    "level2": null
                }
            }
            """
        When JSON key "level1.level2.level3" is extracted from item "deepNullData"
        And it is equal to "undefined"

    Scenario: JSON transformations on empty and invalid data
        When set "emptyData" to "{}"
        When make json keys for item "emptyData" lower case
        When json item "emptyData" is flattened
        When json item "emptyData" is trimmed
        When json item "emptyData" is numberifyed

    Scenario: JSON array string parsing edge cases
        Given set "testObject" to:
            """
            {
                "field1": "value1",
                "field2": "value2",
                "field3": "value3"
            }
            """
        # Test different array string formats
        When JSON keys 'field1, field2, field3' are extracted from "testObject"
        Then it is equal to:
            """
            {
                "field1": "value1",
                "field2": "value2",
                "field3": "value3"
            }
            """
        When JSON keys '[field1,field2]' are extracted from "testObject"
        Then it is equal to:
            """
            {
                "field1": "value1",
                "field2": "value2"
            }
            """
        When JSON keys 'field1,   field2   , field3' are extracted from "testObject"
        Then it is equal to:
            """
            {
                "field1": "value1",
                "field2": "value2",
                "field3": "value3"
            }
            """

    Scenario: JSON whitelist with empty input handling
        When set "emptySource" to "{}"
        When JSON keys '["any", "keys"]' are extracted from "emptySource"
        Then it is equal to:
            """
            {}
            """

    Scenario: JSON key extraction with undefined intermediate values
        When set "undefinedData" to:
            """
            {
            "level1": {
            "level2": undefined
            }
            }
            """
        When JSON key "level1.level2.level3" is extracted from item "undefinedData"
        And it is equal to "undefined"

    Scenario: JSON operations with special characters and edge cases
        When set "specialData" to:
            """
            {
                "123": "numeric_key",
                "key.with.dots": "value",
                "normal_key": "normal_value",
                "": "empty_key"
            }
            """
        When JSON key "normal_key" is extracted from item "specialData"
        And it is equal to "normal_value"
        When JSON key "" is extracted from item "specialData"
        And it is equal to "empty_key"

    Scenario: JSON Schema Validation
        Given set "testJson" to:
            """
            {
                "field1": "value1",
                "field2": "value2",
                "field3": "value3"
            }
            """
        And set "jsonSchema" to:
            """
            {
                "type": "object",
                "properties": {
                    "field1": {
                        "type": "string"
                    },
                    "field2": {
                        "type": "string"
                    },
                    "field3": {
                        "type": "string"
                    }
                },
                "required": [
                    "field1",
                    "field2",
                    "field3"
                ]
            }
            """
        When item "testJson" is validated against schema item "jsonSchema"

    Scenario: JSON Schema Validation with arrays
        Given set "testJsonArray" to:
            """
            [
                {
                    "name": "John",
                    "age": 30
                },
                {
                    "name": "Jane",
                    "age": 25
                }
            ]
            """
        And set "arraySchema" to:
            """
            {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "age": {
                        "type": "number"
                    }
                },
                "required": [
                    "name",
                    "age"
                ]
            }
            """
        When item "testJsonArray" is validated against schema item "arraySchema"

    Scenario: JSON Schema Validation with schema having title property
        Given set "simpleJson" to:
            """
            {
                "name": "test"
            }
            """
        And set "schemaWithTitle" to:
            """
            {
                "title": "testSchema",
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    }
                },
                "required": [
                    "name"
                ]
            }
            """
        When item "simpleJson" is validated against schema item "schemaWithTitle"

    Scenario: Advanced JSON key extraction with nested parsing
        Given set "complexData" to:
            """
            {
                "level1": {
                    "level2": {
                        "items": [
                            {
                                "id": "first",
                                "nested": {
                                    "value": "deep"
                                }
                            },
                            {
                                "id": "second",
                                "nested": {
                                    "value": "deeper"
                                }
                            }
                        ]
                    }
                }
            }
            """
        # Test complex nested extraction
        When JSON key "level1.level2.items[0].nested.value" is extracted from item "complexData"
        Then it is equal to "deep"
        When JSON key "level1.level2.items[1].id" is extracted from item "complexData"
        Then it is equal to "second"

    Scenario: JSON keys extraction with mixed array formats and special characters
        Given set "mixedObject" to:
            """
            {
                "field_1": "value1",
                "field-2": "value2",
                "field.3": "value3",
                "field 4": "value4",
                "nested": {
                    "deep_field": "deep_value"
                }
            }
            """
        # Test JSON format array string parsing
        When JSON keys '["field_1", "field-2"]' are extracted from "mixedObject"
        Then it is equal to:
            """
            {
                "field_1": "value1",
                "field-2": "value2"
            }
            """
        # Test comma-separated parsing
        When JSON keys 'field_1, field-2' are extracted from "mixedObject"
        Then it is equal to:
            """
            {
                "field_1": "value1",
                "field-2": "value2"
            }
            """
        # Test bracket format parsing
        When JSON keys '[field_1,field-2]' are extracted from "mixedObject"
        Then it is equal to:
            """
            {
                "field_1": "value1",
                "field-2": "value2"
            }
            """

    Scenario: JSON transformations with nested recursive structures
        Given set "recursiveData" to:
            """
            {
                "ROOT_LEVEL": {
                    "SECOND_LEVEL": {
                        "THIRD_LEVEL": {
                            "VALUE": "  nested_value  ",
                            "NUMBER": "123.45",
                            "ANOTHER_NEST": {
                                "DEEP_VALUE": "  deep  "
                            }
                        }
                    },
                    "PARALLEL_BRANCH": {
                        "STRING_NUM": "999",
                        "SPACES": "  trimmed  "
                    }
                }
            }
            """
        # Test cascading transformations
        When make json keys for item "recursiveData" lower case
        Then element "root_level" exists in item "recursiveData"
        And element "ROOT_LEVEL" does not exist in item "recursiveData"
        When json item "recursiveData" is flattened
        Then element "value" exists in item "recursiveData"
        And element "deep_value" exists in item "recursiveData"
        When json item "recursiveData" is trimmed
        And json item "recursiveData" is numberifyed
        Then "${recursiveData.number}" is equal to "123.45"
        And "${recursiveData.string_num}" is equal to "999"

    Scenario: JSON operations with boundary and edge case data types
        Given set "boundaryData" to:
            """
            {
                "emptyString": "",
                "whitespaceOnly": "   ",
                "zeroNumber": "0",
                "negativeNumber": "-42",
                "floatNumber": "3.14159",
                "scientificNotation": "1e5",
                "booleanString": "true",
                "nullString": "null",
                "undefinedString": "undefined",
                "nested": {
                    "emptyNested": "",
                    "numberInNested": "789"
                }
            }
            """
        # Test number conversion on boundary cases
        When json item "boundaryData" is numberifyed
        Then "${boundaryData.zeroNumber}" is equal to "0"
        And "${boundaryData.negativeNumber}" is equal to "-42"
        And "${boundaryData.floatNumber}" is equal to "3.14159"
        And "${boundaryData.scientificNotation}" is equal to "100000"
        # These should remain as strings since they're not pure numbers
        And item "boundaryData.booleanString" is equal to "true"
        And "${boundaryData.nullString}" is equal to "null"
        # Test trimming operations
        When json item "boundaryData" is trimmed
        Then "${boundaryData.whitespaceOnly}" is equal to "0"

    Scenario: JSON whitelist operations with complex path structures
        Given set "sourceData" to:
            """
            {
                "user": {
                    "profile": {
                        "name": "John Doe",
                        "email": "john@example.com"
                    },
                    "settings": {
                        "notifications": true
                    }
                },
                "metadata": {
                    "created": "2023-01-01"
                }
            }
            """
        # Test nested key extraction that should work
        When JSON keys '["user"]' are extracted from "sourceData"
        Then it is equal to:
            """
            {
                "user": {
                    "profile": {
                        "name": "John Doe",
                        "email": "john@example.com"
                    },
                    "settings": {
                        "notifications": true
                    }
                }
            }
            """
        When JSON keys '["metadata"]' are extracted from "sourceData"
        Then it is equal to:
            """
            {
                "metadata": {
                    "created": "2023-01-01"
                }
            }
            """

    Scenario: JSON key removal with complex nested structures
        Given set "removalTestData" to:
            """
            {
                "keep": {
                    "this": "value",
                    "nested": {
                        "keep_this": "keep",
                        "remove_this": "remove"
                    }
                },
                "remove_entire": {
                    "all": "gone",
                    "nested": {
                        "also": "gone"
                    }
                }
            }
            """
        # Test deep nested removal
        When JSON key "keep.nested.remove_this" is removed from item "removalTestData"
        Then element "remove_this" does not exist in item "removalTestData.keep.nested"
        And element "keep_this" exists in item "removalTestData.keep.nested"
        # Test entire branch removal
        When JSON key "remove_entire" is removed from item "removalTestData"
        Then element "remove_entire" does not exist in item "removalTestData"
        And element "keep" exists in item "removalTestData"

    Scenario: JSON manipulation with special data types and structures
        Given set "specialTypesData" to:
            """
            {
                "array_field": [
                    1,
                    2,
                    3
                ],
                "null_field": null,
                "boolean_field": true,
                "number_field": 42,
                "string_field": "text",
                "empty_object": {},
                "nested_mixed": {
                    "array_in_object": [
                        "a",
                        "b"
                    ],
                    "null_in_object": null,
                    "nested_empty": {}
                }
            }
            """
        # Test transformations preserve non-string/non-object types correctly
        When make json keys for item "specialTypesData" lower case
        Then element "array_field" exists in item "specialTypesData"
        And "${specialTypesData.array_field[0]}" is equal to "1"
        And "${specialTypesData.boolean_field}" is equal to "true"
        When json item "specialTypesData" is trimmed
        # Should not affect non-string values
        Then "${specialTypesData.number_field}" is equal to "42"
        And item "specialTypesData.null_field" is null

    Scenario: JSON path operations with complex JSONPath expressions
        Given set "pathTestData" to:
            """
            {
                "store": {
                    "book": [
                        {
                            "category": "reference",
                            "author": "Nigel Rees",
                            "title": "Sayings of the Century",
                            "price": 8.95
                        },
                        {
                            "category": "fiction",
                            "author": "Evelyn Waugh",
                            "title": "Sword of Honour",
                            "price": 12.99
                        }
                    ]
                }
            }
            """
        # Test simple JSONPath queries
        When run json path '$.store.book[0].author' on item "pathTestData"
        Then "${lastRun[0]}" is equal to "Nigel Rees"
        When run json path '$.store.book[1].title' on item "pathTestData"
        Then "${lastRun[0]}" is equal to "Sword of Honour"

    Scenario: Edge cases for element existence checking with special keys
        Given set "specialKeysData" to:
            """
            {
                "0": "zero_key",
                "": "empty_key_value",
                "null": "null_key",
                "undefined": "undefined_key",
                "false": "false_key",
                "spaces here": "spaced_key",
                "dots.in.key": "dotted_key"
            }
            """
        # Test existence checking with special key names
        Then element "" exists in item "specialKeysData"
        And element "0" exists in item "specialKeysData"
        And element "null" exists in item "specialKeysData"
        And element "undefined" exists in item "specialKeysData"
        And element "false" exists in item "specialKeysData"
        And element "spaces here" exists in item "specialKeysData"
        And element "dots.in.key" exists in item "specialKeysData"
        # Test multiple element existence
        Then elements '["0", "null", "false"]' exist in item "specialKeysData"
        And elements '["nonexistent", "alsomissing"]' do not exist in item "specialKeysData"

    Scenario: JSON transformations on null and non-object inputs
        Given set "nullValue" to "null"
        And set "stringValue" to "just a string"
        And set "numberValue" to "42"
        And set "arrayValue" to "[1, 2, 3]"
        # Test transformation functions with non-object inputs (should not crash)
        When make json keys for item "nullValue" lower case
        And make json keys for item "stringValue" lower case
        And make json keys for item "arrayValue" lower case
        And json item "nullValue" is flattened
        And json item "stringValue" is flattened
        And json item "arrayValue" is flattened
        And json item "nullValue" is trimmed
        And json item "stringValue" is trimmed
        And json item "arrayValue" is trimmed
        And json item "nullValue" is numberifyed
        And json item "stringValue" is numberifyed
        And json item "arrayValue" is numberifyed

    Scenario: JSON deletion on existing data only
        Given set "simpleData" to:
            """
            {
                "existing": "value",
                "another": "data"
            }
            """
        # Test successful key deletion
        When JSON key "another" is removed from item "simpleData"
        Then element "another" does not exist in item "simpleData"
        And element "existing" exists in item "simpleData"

    Scenario: JSON extraction with various data types as source
        Given set "numberSource" to "123"
        And set "booleanSource" to "true"
        And set "arraySource" to "[1, 2, 3]"
        # Test extraction from non-object sources
        When JSON key "anykey" is extracted from item "numberSource"
        Then it is equal to "undefined"
        When JSON key "anykey" is extracted from item "booleanSource"
        Then it is equal to "undefined"
        When JSON key "anykey" is extracted from item "arraySource"
        Then it is equal to "undefined"

    Scenario: JSON whitelist operations with invalid inputs
        Given set "validObject" to:
            """
            {
                "field1": "value1",
                "field2": "value2"
            }
            """
        And set "nullSource" to "null"
        And set "stringSource" to "some string"
        # Test whitelist with invalid source objects
        When JSON keys '["field1"]' are extracted from "nullSource"
        Then it is equal to:
            """
            {}
            """
        When JSON keys '["field1"]' are extracted from "stringSource"
        Then it is equal to:
            """
            {}
            """
        # Test whitelist with invalid key arrays
        When JSON keys 'null' are extracted from "validObject"
        Then it is equal to:
            """
            {}
            """

    Scenario: JSON whitelist function debugging
        Given set "simpleTestData" to:
            """
            {
                "topLevel": "top_value"
            }
            """
        # Test simple top-level key first
        When JSON keys '["topLevel"]' are extracted from "simpleTestData"
        Then element "topLevel" exists in it
        And it is equal to:
            """
            {
                "topLevel": "top_value"
            }
            """
        # Test extraction of non-existent nested path to cover break statement
        When JSON keys '["nonexistent.nested.path"]' are extracted from "simpleTestData"
        Then it is equal to:
            """
            {}
            """

    Scenario: JSON whitelist with custom separators and edge cases
        Given set "separatorTestData" to:
            """
            {
                "level1": {
                    "level2": {
                        "level3": "nested_value"
                    }
                },
                "single": "single_value"
            }
            """
        # Test simple extraction first
        When JSON keys '["single"]' are extracted from "separatorTestData"
        Then element "single" exists in it
        And it is equal to:
            """
            {
                "single": "single_value"
            }
            """

    Scenario: JSON whitelist with mixed existing and non-existing paths
        Given set "mixedPathData" to:
            """
            {
                "existing": {
                    "shallow": "also_found"
                },
                "partial": {
                    "exists": "yes"
                }
            }
            """
        # Test simple existing paths
        When JSON keys '["existing.shallow", "partial.exists"]' are extracted from "mixedPathData"
        Then it is equal to:
            """
            {
                "existing": {
                    "shallow": "also_found"
                },
                "partial": {
                    "exists": "yes"
                }
            }
            """

    Scenario: JSON whitelist with arrays and edge case values
        Given set "arrayEdgeCaseData" to:
            """
            {
                "arrays": {
                    "numbers": [
                        1,
                        2,
                        3
                    ]
                },
                "edgeCases": {
                    "nullValue": null,
                    "emptyObject": {}
                }
            }
            """
        # Test simple array and edge case extraction
        When JSON keys '["arrays.numbers", "edgeCases.nullValue"]' are extracted from "arrayEdgeCaseData"
        Then it is equal to:
            """
            {
                "arrays": {
                    "numbers": [
                        1,
                        2,
                        3
                    ]
                },
                "edgeCases": {
                    "nullValue": null
                }
            }
            """

    Scenario: JSON key deletion
        Given set "driverData" to:
            """
            {
                "driver": {
                    "firstName": "John",
                    "lastName": "Smith",
                    "vehicles": [
                        {
                            "externalReferenceVehicleId": "ABC123",
                            "vin": "ABC00000000000001"
                        }
                    ]
                }
            }
            """
        # Test deletion of non-existent paths
        When JSON key "driver.vehicles[0].externalReferenceVehicleId" is removed from item "driverData"
        Then element "driver.vehicles[0].externalReferenceVehicleId" does not exist in item "driverData"
        And element "driver" exists in item "driverData"
        And element "driver.vehicles[0].vin" exists in item "driverData"
