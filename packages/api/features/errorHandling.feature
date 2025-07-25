Feature: API - Error Handling
    Background:
        Given set "directory" to "./test"

    Scenario: Custom 404 error response
        Given set "url" to "http://localhost:3001/custom-404"
        And set "method" to "GET"
        When api request is performed
        Then the status is 404
        And the status is not ok
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
        Then the status is not ok

    Scenario: status {int} step (deprecated) with 500
        Given set "url" to "http://localhost:3001/custom-500"
        And set "method" to "GET"
        When api request is performed
        Then the status is 500

    Scenario: Use apiRetrieveType to retrieve response as text
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"
        And set "apiRetrieveType" to "text"
        When api request is performed
        Then "${response}" contains ""

    Scenario: Use apiRetrieveType to retrieve response as blob
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"
        And set "apiRetrieveType" to "blob"
        When api request is performed
        Then the status is ok

    Scenario: Response with text that fails JSON parsing
        Given set "url" to "http://localhost:3001/plain-text"
        And set "method" to "GET"
        And set "apiRetrieveType" to "text"
        When api request is performed
        Then the status is ok
        And "${response}" contains "This is plain text"

    Scenario: GET request with large response handling
        Given set "url" to "http://localhost:3001/large-response"
        And set "method" to "GET"
        When api request is performed
        Then the status is ok
        And "${response.size}" is equal to "large"
