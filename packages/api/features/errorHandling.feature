Feature: API - Error Handling
    Background:
        Given set "directory" to "./test"

    Scenario: Custom 404 error response
        Given set "url" to "http://localhost:3001/custom-404"
        And set "method" to "GET"
        When api request is performed
        Then the status is 404
        And "${response.error}" is equal to "Custom Not Found"
        And "${response.code}" is equal to 404

    Scenario: Custom 500 error response
        Given set "url" to "http://localhost:3001/custom-500"
        And set "method" to "GET"
        When api request is performed
        Then the status is 500
        And "${response.error}" is equal to "Custom Internal Server Error"
        And "${response.code}" is equal to 500

    Scenario: status not ok step (deprecated) with 404
        Given set "url" to "http://localhost:3001/custom-404"
        And set "method" to "GET"
        When api request is performed
        Then status not ok

    Scenario: status {int} step (deprecated) with 500
        Given set "url" to "http://localhost:3001/custom-500"
        And set "method" to "GET"
        When api request is performed
        Then status 500
