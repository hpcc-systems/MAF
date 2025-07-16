Feature: API - Test the basic items in api
    Background:
        Given set "directory" to "./test"

    Scenario: Basic GET method flow with status checks
        Given set "url" to "http://localhost:3001"
        And set "method" to "GET"
        When api request is performed
        Then status ok
        And the status is ok
        And the status is 200
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

    Scenario: GET image with attach disabled
        And set "attach" to "false"
        And set "url" to "http://localhost:3001"
        And set "api" to "test-image"
        And set "method" to "GET"
        When api request is performed
        Then status ok
        And blob item "response" is written to file "pickle_blob_write1.jpeg"
        And blob item "response" is attached

    Scenario: GET image with attach enabled
        Given url "http://localhost:3001"
        And api "test-image"
        When method get
        Then status ok
        And blob item "response" is written to file "pickle_blob_write2.jpeg"
        And blob item "response" is attached

    Scenario: GET image using request object with variable substitution
        When set:
            | url            |
            | localhost:3001 |
        When set "req" to:
            """
            {
                "url": "http://${url}",
                "api": "test-image",
                "method": "GET"
            }
            """
        When api request from item "req" is performed
        And blob item "response" is written to file "pickle_blob_write3.jpeg"
        And blob item "response" is attached

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

    Scenario: POST request with formBody containing array and file
        When set "formBody" to:
            """
            {
                "foo": [
                    "bar",
                    "baz"
                ],
                "file": {
                    "type": "file",
                    "fileName": "pickle.jpeg"
                }
            }
            """
        When set "url" to "http://localhost:3001"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201

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
