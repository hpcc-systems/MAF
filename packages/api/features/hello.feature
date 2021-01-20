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
    When set "req" to:
      """
      {
        "url": "https://cucumber.io",
        "api": "img/cucumber-school-logo.png",
        "method": "GET"
      }
      """
    When api request from item "req" is performed
    And blob item "response" is written to file "image2.png"
    And blob item "response" is attached
