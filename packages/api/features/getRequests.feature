Feature: API - GET Requests

    Tesing GET requests to different apis and endpoints

    Scenario: GET request to a single resource
        When perform api request:
            """
            {
                "url": "http://google.com",
                "api": "/maps",
                "method": "GET",
                "headers": {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
            """
        Then the status is 200