Feature: API - Image and File Handling
    Background:
        Given set "directory" to "./test"

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

    Scenario: POST request with formBody containing base64blob
        When set "formBody" to:
            """
            {
                "file": {
                    "type": "base64blob",
                    "base64blob": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAp9l2AAAAABJRU5ErkJggg=="
                }
            }
            """
        When set "url" to "http://localhost:3001"
        And set "method" to "POST"
        When api request is performed
        Then the status is 201
