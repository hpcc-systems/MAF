Feature: API - Advanced Features
    Background:
        Given set "directory" to "./test"

    Scenario: POST request with formBody containing only text fields
        When set "formBody" to:
            """
            {
                "field1": "value1",
                "field2": "value2"
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201

    Scenario: POST request with formBody containing file from step definitions directory
        When set "formBody" to:
            """
            {
                "textField": "some text",
                "file": {
                    "type": "file",
                    "fileName": "../test/test_file.txt"
                }
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201

    Scenario: POST request with formBody containing invalid base64blob
        When set "formBody" to:
            """
            {
                "file": {
                    "type": "base64blob",
                    "base64blob": "invalid_base64_content!!!"
                }
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201

    Scenario: API request with custom apiRetrieveType as blob
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"
        And set "apiRetrieveType" to "blob"
        When api request is performed
        Then the status is ok

    Scenario: Request with multiple query parameters and custom headers
        Given set "apiParams" to:
            """
            {
                "param1": "value1",
                "param2": "value2"
            }
            """
        And set "headers" to:
            """
            {
                "X-Custom-Header": "custom-value",
                "Authorization": "Bearer token123"
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params.param1}" is equal to "value1"
        And "${response.customHeaders['x-custom-header']}" is equal to "custom-value"
        And "${response.customHeaders['authorization']}" is equal to "Bearer token123"

    Scenario: Testing response handling with different content types
        Given set "url" to "http://localhost:3001/plain-text"
        And set "method" to "GET"
        And set "apiRetrieveType" to "text"
        When api request is performed
        Then the status is ok
        And "${response}" contains "plain text"

    Scenario: Testing very large image response handling
        Given set "url" to "http://localhost:3001/very-large-image"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok

    Scenario: POST request with jsonBody as string that gets parsed
        Given set "jsonBody" to:
            """
            {"key": "value", "number": 123}
            """
        When perform api request:
            """
            {
                "url": "http://localhost:3001",
                "method": "POST"
            }
            """
        Then the status is 201
        And "${response.key}" is equal to "value"
        And "${response.number}" is equal to 123
