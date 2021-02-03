Feature: Validations: Test Xpath namespaces and xpaths
   Background:
     When set "directory" to "./test"

  Scenario:  Xpath sample
    Given xPath namespace is '{ "new": "TEst" }'
    When set "xml" to file "xml.xml"
    Given xPath namespace is
"""
{
  "h2": "http://www.w3.org/TR/html4/"
}
"""
    And add xPath namespace "l" = "https://www.w3schools.com/furniture"
    When run xPath '//h2:table/h2:tr/h2:td[1]/text()' on item "xml"
    Then it is equal to "Apples"
    Then it is written to file "expected.out"
  Scenario: Different way of setting xpath
    And add xPath namespace "h2" = "http://www.w3.org/TR/html4/"
    When set "xml" to file "xml.xml"
    When run xPath '//h2:table/h2:tr/h2:td[1]/text()' on item "xml"
    Then it is equal to "Apples"
  Scenario: Different way of setting xpath
    When set "xml" to file "xml.xml"
    Given xPath namespace is '{ "h2": "http://www.w3.org/TR/html4/" }'
    When run xPath '//h2:table/h2:tr/h2:td[1]/text()' on item "xml"
    Then it is equal to "Apples"
  Scenario: Basic xml
    When set "xml" to "<hello>There</hello>"
    When run xPath '//hello/text()' on item "xml"
    Then it is equal to "There"
