Feature: Core: Test Fill Template
   Background:
     When set "directory" to "./test"
  Scenario: Test attaching
    When set "attach" to "false"
    And set "no" to "yes"
  Scenario: Attach an image
    When blob is read from file "newBlob.png"
    And blob item "lastRun" is attached
  Scenario: Test filling in json
        When set "versionNum" to 3
        And set "vNum" to "$100.00"
      When set "version" to "v3"
    When set "request" to:
    """
      {
        "url": "https://run.mocky.io",
        "api": "${version}/d2bc61bc-bdf1-418b-a4d5-dc1b70c86861",
        "method": "GET"
      }
    """

  Scenario: Test with xml in json
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
  And set "bob" to:
  """
  {
     "what": "${a}"
  }
  """
  Then item "bob.what" is equal to item "a"
  Scenario: Test fill template
    Given set "numVal" to 5
    When run templateString
"""
{
  "bob": 
   ${
    (function() { 
      return numVal+7 
  })() 
  }\
}
"""
    Then it is exactly equal to:
"""
{
  "bob": 
   12\
}
"""
  Scenario: Test with an json object
    Given set "numVal" to '{ "item5" :3 } '
    When run templateString
"""
{
  "bob": ${numVal}\
}
"""
    Then it is exactly equal to:
"""
{
  "bob": {
  "item5": 3
}\
}
"""
  Scenario: Test with an json object
    Given set "numVal" to '{ "item5" :3 } '
    When run templateString
"""
{
  "bob": ${numVal.item5}
}
"""
And set "what" to it
    Then it is exactly equal to:
"""
{
  "bob": 3
}
"""
  Scenario: Test with no object
  When run templateString
"""
5
"""
  Then it is exactly equal to:
"""
5
"""

  Scenario: Template in a template
  Given set "var1" to 3
  And set "varOneOne" to "1"
  When run templateString
"""
Hi${var${varOneOne}}After
"""
Then it is exactly equal to:
"""
Hi3After
"""
  Scenario: Edge cases
  When run templateString
"""
${hello{there
"""
Then it is exactly equal to:
"""
${hello{there
"""
  Scenario: Edge cases
  Given set "var1" to 3
  When run templateString
"""
${(function () {
return "var1"
})()}
"""
Then it is exactly equal to:
"""
var1
"""
  Scenario: Edge cases
  Given set "var1" to 3
  When run templateString
"""
${${(function () {
return "var1"
})()}}
"""
Then it is exactly equal to:
"""
3
"""
