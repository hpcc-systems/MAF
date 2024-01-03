Feature: API - Test the basic items in api
  Background:
    When set "directory" to "./test"

  Scenario: Use individual methods
    Given set "url" to "https://google.com"
    Given url "${url}"
    And headers '{"User-Agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36" }'
    When method get
    Then status ok
    Then the status is ok
    And set "attach" to "false"
    And set "apiRetrieveType" to "text"
    When method get
    And the status is 200
    And set "attach" to "true"
    And status 200
    Given body "Hello Google"
    When method post
    Then status not ok
    Then the status is not ok

  Scenario: Test Blobber
    When api request from file "tryB64Post.json" is performed
    Then it is written to file "response.txt"

  Scenario: quick get  Google
    When set "api" to:
    """
    {
      "additionalParams": { 
         "redirect: "manual"
      }
    }
    """
    And set "bla" to item "api.additionalParams"
    When perform api request:
      """
      {
        "headers": { "a": "header" },
        "url": "https://google.com",
        "apiParams": { "hello":"THERE" },
        "method": "GET"
      }
      """
    Then status ok
    When perform api request:
      """
      {
        "headers": { "a": "header" },
        "url": "https://google.com",
        "api": "hello",
        "apiParams": { "hello":"THERE" },
        "method": "GET"
      }
      """
    Then status not ok
  Scenario: quick post  Google
    When perform api request:
      """
      {
        "headers": { "a": "header" },
        "url": "https://google.com",
        "urlEncodedBody": { "hello":"THERE" },
        "method": "POST"
      }
      """
    Then status not ok
  Scenario: quick post  Google
    When perform api request:
      """
      {
        "url": "https://google.com",
        "body": "NOPE",
        "method": "POST"
      }
      """
    Then status not ok

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

  Scenario: Get an image using api no attach
    Given set "attach" to "false"
    Given url "https://cucumber.io"
    And api "img/cucumber-school-logo.png"
    When method get
    Then status ok
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached
  Scenario: Get an image using api
    Given url "https://cucumber.io"
    And api "img/cucumber-school-logo.png"
    When method get
    Then status ok
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached
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
    And set "version" to "v3"
    When set "request" to:
    """
      {
        "url": "https://run.mocky.io",
        "api": "${version}/d2bc61bc-bdf1-418b-a4d5-dc1b70c86861",
        "method": "GET"
      }
    """
    When perform api request:
    """
      ${request}
    """
    And set "token" to item "response.token"
    And set "authorization" to "Auth ${token}"
    When api request from file "apiReq.json" is performed
    Then status ok
    When api request from file "apiReq.json" is performed with:
    | version |
    | v2     |
    Then status not ok
    When api request from file "apiReq.json" is performed with:
    | version |
    | v3     |
    | v2     |
    Then status not ok
