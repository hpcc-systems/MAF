Feature: API - Basic HTTP Methods
    Background:
        Given set "directory" to "./test"

    Scenario: Basic GET method flow with status checks
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then status ok
        And the status is ok
        And the status is 200
        And status 200
        And "${response.body}" is equal to ""
        And "${response.params}" is equal to "{}"
        And "${response.customHeaders}" is equal to:
            """
            {
                "accept-encoding": "gzip,deflate"
            }
            """

    Scenario: Basic GET method flow switching to POST
        And set "url" to "http://localhost:3001"
        And set "method" to "GET"
        And api request is performed
        Then the status is 200
        Given set "attach" to "false"
        When method get
        Then the status is 200
        And set "attach" to "true"
        And body "Hello Example"
        When method post
        Then status ok
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
        Then status ok
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
        Then status ok
        And the status is 200
