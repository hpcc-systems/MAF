Feature: API - Requests
    Tesing GET requests to different apis and endpoints

    Scenario: GET - httpbin.org
        When perform api request:
            """
            {
                "url": "https://httpbin.org",
                "api": "/get",
                "method": "GET",
                "headers": {
                    "Accept": "application/json"
                }
            }
            """
        Then the status is 200

    Scenario: POST - JSON - ptsv3.com
        Given set "requestJSON" to:
            """
            {
                "url": "http://ptsv3.com/",
                "api": "t/1231/post/json/",
                "method": "POST",
                "headers": {
                    "Accept": "application/json"
                },
                "jsonBody": {
                    "name": "John Doe",
                    "age": 30
                }
            }
            """
        When api request from item 'requestJSON' is performed
        Then the status is 200
        And '${response.name}' is equal to 'John Doe'
        And '${response.age}' is equal to '30'

    Scenario: POST - URLEncodedBody - ptsv3.com
        When perform api request:
            """
            {
                "url": "http://ptsv3.com/",
                "api": "t/1231/post/json/",
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

    Scenario: GET - Image
        Given set 'url' to 'https://cucumber.io'
        And set 'api' to 'img/cucumber-school-logo.png'
        And set 'method' to 'GET'
        When api request is performed
        Then the status is ok
        And blob item "response" is written to file "image2.png"
        And blob item "response" is attached