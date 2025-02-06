Feature: API - Test the basic items in api
  Background:
    Given set "directory" to "./test"

  Scenario: Use individual methods
    And set "url" to "https://www.example.com"
    And set "method" to "GET"
    And api request is performed
    Then status ok
    And the status is ok
    And set "attach" to "false"
    And set "apiRetrieveType" to "text"
    When method get
    Then the status is 200
    And set "attach" to "true"
    And status 200
    And body "Hello Example"
    When method post
    Then status not ok
    And the status is not ok

  Scenario: Get Request - Example
    When set "req" to:
      """
      {
        "url": "https://www.example.com",
        "method": "GET"
      }
      """
    When perform api request:
      """
      ${req}
      """
    Then status ok
    When api request from item "req" is performed

  Scenario: Post Request - Example
    When perform api request:
      """
      {
        "headers": {
          "a": "header"
        },
        "url": "https://www.example.com",
        "urlEncodedBody": {
          "hello": "THERE"
        },
        "method": "POST"
      }
      """
    Then status not ok
  Scenario: Post Request - Example 2
    When perform api request:
      """
      {
        "url": "https://www.example.com",
        "body": "NOPE",
        "method": "POST"
      }
      """
    Then status not ok

  Scenario: Get an image using api no attach
    And set "attach" to "false"
    And url "https://www.cucumber.io"
    And api "img/logo.svg"
    When method get
    Then status ok
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached

  Scenario: Get an image using api
    Given url "https://www.cucumber.io"
    And api "img/logo.svg"
    When method get
    Then status ok
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached

  Scenario: Get an image
    When set:
      | url         |
      | cucumber.io |
    When set "req" to:
      """
      {
        "url": "https://www.${url}",
        "api": "img/logo.svg",
        "method": "GET"
      }
      """
    When api request from item "req" is performed
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached
