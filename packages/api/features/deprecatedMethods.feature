Feature: API - Deprecated Methods
    Background:
        Given set "directory" to "./test"

    Scenario: Deprecated url/api/body/headers steps with POST
        When url "http://localhost:3001/"
        And api "/api/v1/test"
        And body "{\"foo\":\"bar\"}"
        And headers "{\"x-test\":\"header\"}"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201
        And "${response.foo}" is equal to "bar"
        And "${response.customHeaders}" is equal to:
            """
            {
                "x-test": "header",
                "accept-encoding": "gzip,deflate"
            }
            """
