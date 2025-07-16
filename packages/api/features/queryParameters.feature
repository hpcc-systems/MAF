Feature: API - Query Parameters
    Background:
        Given set "directory" to "./test"

    Scenario: GET request with query parameters
        Given set "apiParams" to:
            """
            {
                "foo": "bar",
                "baz": "qux"
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params}" is equal to:
            """
            {
                "foo": "bar",
                "baz": "qux"
            }
            """

    Scenario: GET request with a single query parameter
        Given set "apiParams" to:
            """
            {
                "only": "one"
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params}" is equal to:
            """
            {
                "only": "one"
            }
            """

    Scenario: GET request with empty query parameters
        Given set "apiParams" to:
            """
            {}
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params}" is equal to "{}"

    Scenario: GET request with special characters in query parameters
        Given set "apiParams" to:
            """
            {
                "spaced key": "value with spaces",
                "symbols": "!@#$%^&*()_+"
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params}" is equal to:
            """
            {
                "spaced key": "value with spaces",
                "symbols": "!@#$%^&*()_+"
            }
            """

    Scenario: GET request with numeric and boolean values in query parameters
        Given set "apiParams" to:
            """
            {
                "num": 123,
                "bool": true
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params}" is equal to:
            """
            {
                "num": "123",
                "bool": "true"
            }
            """

    Scenario: GET request with nested object as a query parameter
        Given set "apiParams" to:
            """
            {
                "outer": {
                    "inner": "value"
                }
            }
            """
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.params.outer}" is equal to:
            """
            {
                "inner": "value"
            }
            """
