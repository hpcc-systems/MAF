Feature: Hello world feature
  Scenario: Get Google
    When set "req" to:
      """
      {
        "url": "https://google.com",
        "method": "GET"
      }
      """
    When perform api request:
      """
      ${req}
      """
    Then status ok
    When api request from item "req" is performed

  Scenario: Get an image
    When set:
      |url|
      |cucumber.io|
    When set "req" to:
      """
      {
        "url": "https://${url}",
        "api": "img/cucumber-school-logo.png",
        "method": "GET"
      }
      """
    When api request from item "req" is performed
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached

  Scenario: Get a token
    When set "request" to:
    """
      {
        "url": "https://run.mocky.io",
        "api": "v3/d2bc61bc-bdf1-418b-a4d5-dc1b70c86861",
        "method": "GET"
      }
    """
    When perform api request:
    """
      ${request}
    """
    And set "token" to item "response.token"
    And set "authorization" to "Auth ${token}"
    And set "version" to "v3"
    When api request from file "apiReq.json" is performed with:
    | version |
    | v2     |
    Then status not ok
    When api request from file "apiReq.json" is performed
    Then status ok