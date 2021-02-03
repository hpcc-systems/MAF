Feature: Validations : Base 64
  Scenario: Decode Base 64
    Given set "bla" to '{ "json": "object" }'
    And item "bla" is base64 encoded
    Given set "expected" to "Hello World"
    And item "expected" is base64 encoded 
    And it is base64 decoded
    Then it is equal to "Hello World"
    Given set "i" to "ZmVhd3JhZXdyZXc="
    When the value "i" is base64 decoded and resaved
    Then "${i}" is equal to "feawraewrew"
