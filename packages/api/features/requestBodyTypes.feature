Feature: API - Request Body Types
    Background:
        Given set "directory" to "./test"

    Scenario: POST request with urlEncodedBody and custom header
        When perform api request:
            """
            {
                "headers": {
                    "a": "header"
                },
                "url": "http://localhost:3001",
                "urlEncodedBody": {
                    "hello": "THERE"
                },
                "method": "POST"
            }
            """
        Then status ok
        And the status is 201
        And "${response.customHeaders}" is equal to:
            """
            {
                "a": "header",
                "accept-encoding": "gzip,deflate"
            }
            """
        And "${response.body}" is equal to ""
        And "${response.params}" is equal to:
            """
            {
                "hello": "THERE"
            }
            """

    Scenario: POST request with raw body
        When perform api request:
            """
            {
                "url": "http://localhost:3001",
                "body": "NOPE",
                "method": "POST"
            }
            """
        Then status ok
        And the status is 201
        And "${response.body}" is equal to "NOPE"
        And "${response.params}" is equal to "{}"

    Scenario: POST request with jsonBody
        Given set "jsonBody" to:
            """
            {
                "hello": "world"
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201
        And "${response.hello}" is equal to "world"
