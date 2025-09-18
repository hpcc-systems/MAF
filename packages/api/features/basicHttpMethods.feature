Feature: API - Basic HTTP Methods
    Background:
        Given set "directory" to "./test"

    Scenario: Basic GET method flow with status checks
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And the status is 200
        And "${response.body}" is equal to ""
        And "${response.params}" is equal to "{}"
        And "${response.customHeaders}" is equal to:
            """
            {
                "accept-encoding": "gzip, deflate, br"
            }
            """

    Scenario: Basic GET method flow switching to POST
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        And api request is performed
        Then the status is 200
        Given set "attach" to "false"
        When set "method" to "GET"
        Then the status is 200
        And set "attach" to "true"
        And set "body" to "Hello Example"
        When set "method" to "POST"
        Then api request is performed
        And the status is ok
        And the status is 201

    Scenario: GET request using request object and perform api request
        When set "req" to:
            """
            {
                "url": "http://localhost:3001",
                "method": "GET"
            }
            """
        When perform api request:
            """
            ${req}
            """
        Then the status is ok
        And the status is 200

    Scenario: GET request using request object and perform api request
        Given set "req" to:
            """
            {
                "url": "http://localhost:3001",
                "method": "GET"
            }
            """
        When api request from item "req" is performed
        Then the status is ok
        And the status is 200

    Scenario: GET request with api endpoint from results
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"  
        And set "api" to "test-endpoint"
        When api request is performed
        Then the status is ok

    Scenario: GET request with api endpoint having leading slash
        When perform api request:
            """
            {
                "url": "http://localhost:3001",
                "api": "/test-endpoint",
                "method": "GET"
            }
            """
        Then the status is ok

    Scenario: GET request with headers from results object
        Given set "headers" to:
            """
            {
                "X-Test-Header": "test-value"
            }
            """
        When perform api request:
            """
            {
                "url": "http://localhost:3001",
                "method": "GET"
            }
            """
        Then the status is ok
        And "${response.customHeaders['x-test-header']}" is equal to "test-value"

    Scenario: GET request with method from results object
        Given set "method" to "GET"
        When perform api request:
            """
            {
                "url": "http://localhost:3001"
            }
            """
        Then the status is ok

    Scenario: GET request with url from results object
        Given set "url" to "http://localhost:3001"
        When perform api request:
            """
            {
                "method": "GET"
            }
            """
        Then the status is ok
