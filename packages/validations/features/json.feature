Feature: Validations: JSON manipulation
    Testing JSON object key deletion, extraction and general manipulation
    Background:
        When set "directory" to "./test"

    Scenario: Readme simple extract Example
        When set "response" to
            """
            {
                "error": {
                    "subErrorCodes": [
                        {
                            "subErrorCode": 1101,
                            "subErrorMessage": "Phone Number is required"
                        }
                    ]
                },
                "doesnotexist": null
            }
            """
        When JSON key "subErrorCodes" is extracted from "response.error"
        When JSON key "doesnotexist" is extracted from "response.error"
        When set "Data" to
            """
            {
                "a": "apple",
                "b": "banana"
            }
            """
        Then element "a" exists in item "Data"
        When JSON key "a" is extracted from "Data"
        Then it is equal to "apple"

    Scenario: Readme simple removal Example
        When set "Data" to
            """
            {
                "a": "apple",
                "b": "banana"
            }
            """
        And elements '["a", "b"]' exist in item "Data"
        And elements 'a, b' exist in item "Data"
        When JSON key "a" is removed from "Data"
        Then "${Data.b}" is equal to "banana"
        And element "a" does not exist in item "Data"
        And elements '[c,d]' do not exist in item "Data"

    Scenario: JSON Key Deletion
        When set "TestJSON" to
            """
            {
                "url": "http://google.com",
                "meh": "Test",
                "meh2": "Another Test",
                "deepMeh": {
                    "deep1": "Testing1",
                    "deep2": "Testing2"
                },
                "deepMeh2": {
                    "deep3": "Testing3",
                    "deep4": "Testing4"
                },
                "arrayTest": [
                    "Testing1",
                    "Testing2",
                    "Testing3"
                ]
            }
            """
        And JSON key "meh" is removed from item "TestJSON"
        And set "lastRun" to item "TestJSON"
        And JSON key "deepMeh.deep1" is removed from it
    Scenario: JSON Key Extraction
        When set "TestJSON" to
            """
            {
                "url": "http://google.com",
                "meh": "Test",
                "meh2": "Another Test",
                "deepMeh": {
                    "deep1": "Testing1",
                    "deep2": "Testing2"
                },
                "deepMeh2": {
                    "deep3": "Testing3",
                    "deep4": "Testing4"
                },
                "arrayTest": [
                    "Testing1",
                    "Testing2",
                    "Testing3"
                ]
            }
            """
        When set "newJSON" to item "TestJSON"
        When JSON key "arrayTest[0]" is extracted from item "newJSON"
        When JSON key "deepMeh" is extracted from item "TestJSON"
        And JSON keys '["meh","deepMeh","deepMeh2.deep3", "arrayTest"]' are extracted from item "TestJSON"
        And JSON key "deep2" is extracted from it
        And JSON keys 'meh,deepMeh,deepMeh2.deep3, arrayTest]' are extracted from item "TestJSON"
        And set "expected" to
            """
            {
                "meh": "Test",
                "deepMeh": {
                    "deep1": "Testing1",
                    "deep2": "Testing2"
                },
                "deepMeh2": {
                    "deep3": "Testing3"
                },
                "arrayTest": [
                    "Testing1",
                    "Testing2",
                    "Testing3"
                ]
            }
            """
        Then item "expected" is equal to item "lastRun"

    Scenario: JSON Key Lowercase
        When set "data" to:
            """
            {
                "alreadylower": "lower",
                "Alpha": "apple",
                "BETA": "Banana",
                "Charley": {
                    "Coconut": "Hierarchy"
                }
            }
            """
        When make json keys for item "data" lower case
        Then item "data" is equal to:
            """
            {
                "alreadylower": "lower",
                "alpha": "apple",
                "beta": "Banana",
                "charley": {
                    "coconut": "Hierarchy"
                }
            }
            """

    Scenario: JSON Key Lowercase
        When set "data" to:
            """
            {
                "Alpha": "apple",
                "BETA": "Banana",
                "Charley": "coconut"
            }
            """
        When make json keys for item "data" lower case
        Then item "data" is equal to:
            """
            {
                "alpha": "apple",
                "beta": "Banana",
                "charley": "coconut"
            }
            """
    Scenario: JSON Numberify
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
        Then item "data" is equal to:
            """
            {
                "Alpha": 123,
                "Beta": {
                    "Beta_21": 456,
                    "Beta_22": "some_word"
                },
                "Charley": {
                    "Charley_21": 45.6,
                    "Charley_22": 24.9
                },
                "Delta": "1.2.3"
            }
            """
    Scenario: JSON Trim
        When set "data" to:
            """
            {
                "Alpha": {
                    "Alpha_2": "Apple   "
                },
                "John": 5,
                "Beta": "_Banana_",
                "Charley": "Spaces are kept in between words",
                "Delta": {
                    "Delta_21": "   But spaces at the beginning and end are removed   ",
                    "Delta_22": "\nSo are new lines\n"
                }
            }
            """
        When json item "data" is trimmed
        Then item "data" is equal to:
            """
            {
                "Alpha": {
                    "Alpha_2": "Apple"
                },
                "John": 5,
                "Beta": "_Banana_",
                "Charley": "Spaces are kept in between words",
                "Delta": {
                    "Delta_21": "But spaces at the beginning and end are removed",
                    "Delta_22": "So are new lines"
                }
            }
            """
    Scenario: JSON Flatten
        When set "data" to:
            """
            {
                "Alpha": {
                    "Alpha_2": "Apple"
                },
                "Beta": "Banana",
                "Charley": {
                    "Charley_2": {
                        "Charley_3": "Coconut"
                    }
                },
                "Delta": {
                    "Delta_21": "Durian1",
                    "Delta_22": "Durian2"
                }
            }
            """
        When json item "data" is flattened
        Then item "data" is equal to:
            """
            {
                "Alpha_2": "Apple",
                "Beta": "Banana",
                "Charley_3": "Coconut",
                "Delta_21": "Durian1",
                "Delta_22": "Durian2"
            }
            """
    Scenario: Example for json path
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
        When "null" is applied to item "meh" on JSON path "$.url"
        Then item "expected" is equal to item "meh"
        When "" is applied to item "meh" on JSON path "$.url"

    Scenario: JSON Array Inline Map Example
        Given set "myJSON" to:
            """
            [
                {
                    "abc": "string",
                    "def": 123,
                    "convertToBoolean": 1,
                    "jkl": null,
                    "mno": {
                        "pqr": "string",
                        "convertToString": 123,
                        "vwx": 0,
                        "yza": null
                    }
                },
                {
                    "abc": "string",
                    "def": 123,
                    "convertToBoolean": 0,
                    "jkl": null,
                    "mno": {
                        "pqr": "string",
                        "convertToString": 456,
                        "vwx": 0,
                        "yza": null
                    }
                }
            ]
            """
        When set "myJSON" to "${myJSON.map(item => ({ ...item, convertToBoolean: item.convertToBoolean === 1 }))}"
        Then "${myJSON[0].convertToBoolean}" is equal to "true"
        And "${myJSON[1].convertToBoolean}" is equal to "false"
        When set "myJSON" to "${myJSON.map(item => ({ ...item, mno: { ...item.mno, convertToString: item.mno.convertToString.toString() } }))}"
        Then "${myJSON[0].mno.convertToString}" is equal to "123"
        And "${myJSON[1].mno.convertToString}" is equal to "456"

    Scenario: JSON Apply Example
        Given set "body" to:
            """
            {
                "alpha": "string",
                "beta": "1234567"
            }
            """
        And "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111115467" is applied to item "body" on JSON path "$.beta"
        Then "${body.alpha}" is equal to "string"
        And "${body.beta}" is equal to "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111115467"