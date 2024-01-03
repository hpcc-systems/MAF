Feature: API - Requests

    Tesing GET requests to different apis and endpoints

    Scenario: GET request to a single resource
        When perform api request:
            """
            {
                "url": "https://httpbin.org",
                "api": "/get",
                "method": "GET",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
            """
        Then the status is 200

    Scenario: POST request to a single resource
        When perform api request:
            """
            {
                "url": "http://httpbin.org",
                "api": "/post",
                "method": "POST",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                "body": {
                    "name": "John Doe",
                    "age": 30
                }
            }
            """
        Then the status is 200

    Scenario: POST - urlEncodedBody
        When perform api request:
            """
            {
                "url": "http://httpbin.org",
                "api": "/post",
                "method": "POST",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                "urlEncodedBody": {
                    "hello": "THERE"
                }
            }
            """
        Then the status is 200