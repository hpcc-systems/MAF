Feature: Test Fill Template
  Scenario: Test fill template
    Given "numVal" = 5
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
    Then it is equal to item:
"""
{
  "bob": 
   12\
}
"""
  Scenario: Test with an json object
    Given "numVal" = '{ "item5" :3 } '
    When run templateString
"""
{
  "bob": ${numVal}\
}
"""
    Then it is equal to item:
"""
{
  "bob": {
  "item5": 3
}\
}
"""
  Scenario: Test with an json object
    Given "numVal" = '{ "item5" :3 } '
    When run templateString
"""
{
  "bob": ${numVal.item5}
}
"""
    Then it is equal to item:
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
  Then it is equal to item:
"""
5
"""

  Scenario: Template in a template
  Given "var1" = 3
  And "varOneOne" = "1"
  When run templateString
"""
Hi${var${varOneOne}}After
"""
Then it is equal to item:
"""
Hi3After
"""
  Scenario: Edge cases
  When run templateString
"""
${hello{there
"""
Then it is equal to item:
"""
${hello{there
"""
  Scenario: Edge cases
  Given "var1" = 3
  When run templateString
"""
${(function () {
return "var1"
})()}
"""
Then it is equal to item:
"""
var1
"""
  Scenario: Edge cases
  Given "var1" = 3
  When run templateString
"""
${${(function () {
return "var1"
})()}}
"""
Then it is equal to item:
"""
3
"""
