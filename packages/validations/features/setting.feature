Feature: Validations : Setting variables
  Background:
    When set "directory" to "packages/validations"


Scenario: Check that we can identify a null or undefined element
  When set "a" to 3
  Then item "a" is not null
  And item "b" is null  

Scenario:  Set config as the first step
  When set config from json file "newconfig2.json"
  And set "hello" to "${environment}"

Scenario: Set an empty string
  When set "hi" to ""
  Then "${hi}" is equal to ""

Scenario: Setting.
  When set "hi" to "{}"
  When set "hi.there" to "yo"
  And set "hi.yo" to "yo"
  And set "hi.arr" to "[]"
  And set "hi.arr[0]" to "hello"
  And set "hello" to item "hi"
  When set "hi" to 3
  Then item "hi" is equal to "3"
  When set "hi" to "{}"
  And item "hi" is not equal to item "hello"
Scenario: Setting to item
  When set:
  |username|pass|
  |User|Pass|
  |User2|2Pass|
  Then "${username[0]}" is equal to "User"
  Then "${username[1]}" is equal to "User2"
  And set:
  |username|pass|
  |User|Pass|
  Then "${username}" is equal to "User"
  When set "hi" to "hello"
  And set "item2" to item "hi"
  Then "${item2}" is equal to "hello"
Scenario: Setting item from file
  When set "param" to "meh"
  When set config from json file "config.json"
  When set config from json item "deepMeh2"
  Then "${deep3}" is equal to "Testing3"
  Then "${meh}" is equal to "Test"
Scenario: Set json with number varaible
  When set "num" to "5"
  When set "hi" to 
"""
{
  "num": ${num}
}
"""

Scenario: Check two json objects
  When set "a" to "3"
  And set "item" to:
  """
  {
  "a": ${a}
  }
  """
  Then item "item" is equal to:
  """
  {
  "a":3
  }
  """
  And set "a" to '"hi"'
  And set "item" to:
  """
  {
  "a": "${a}"
  }
  """
  Then item "item" is equal to:
  """
  {
  "a": "\"hi\""
  }
  """

