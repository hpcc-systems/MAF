Feature: Validations: XML Processing and XPath Operations
  Background:
    When set "directory" to "./test"

  Scenario: XPath with namespaces
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

  Scenario: XPath namespace setup alternative method
    And add xPath namespace "h2" = "http://www.w3.org/TR/html4/"
    When set "xml" to file "xml.xml"
    When run xPath '//h2:table/h2:tr/h2:td[1]/text()' on item "xml"
    Then it is equal to "Apples"

  Scenario: XPath with namespace from docstring
    When set "xml" to file "xml.xml"
    Given xPath namespace is '{ "h2": "http://www.w3.org/TR/html4/" }'
    When run xPath '//h2:table/h2:tr/h2:td[1]/text()' on item "xml"
    Then it is equal to "Apples"

  Scenario: Basic XML XPath
    When set "xml" to "<hello>There</hello>"
    When run xPath '//hello/text()' on item "xml"
    Then it is equal to "There"

  Scenario: XML in JSON template
    Given set "a" to:
      """
      <root>

      <h:table xmlns:h="http://www.w3.org/TR/html4/">
      <h:tr>
      <h:td>Apples</h:td>
      <h:td>Bananas</h:td>
      </h:tr>
      </h:table>

      <f:table xmlns:f="https://www.w3schools.com/furniture">
      <f:name>African Coffee Table</f:name>
      <f:width>80</f:width>
      <f:length>120</f:length>
      </f:table>

      </root>
      """
    And set "foo" to:
      """
      {
        "bar": "${a}"
      }
      """
    Then item "foo.bar" is equal to item "a"
