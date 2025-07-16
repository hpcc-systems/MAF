Feature: Validations: Encoding and Cryptographic Operations
  Background:
    When set "directory" to "./test"

  Scenario: Base64 encoding and decoding
    Given set "bla" to '{ "json": "object" }'
    And item "bla" is base64 encoded
    Given set "expected" to "Hello World"
    And item "expected" is base64 encoded 
    And it is base64 decoded
    Then it is equal to "Hello World"

  Scenario: Base64 decode and resave
    Given set "i" to "ZmVhd3JhZXdyZXc="
    When the value "i" is base64 decoded and resaved
    Then "${i}" is equal to "feawraewrew"

  Scenario: JWT signing with header
    When generate rsa key
    And set "privateKey" to it
    And set "header" to:
      """
      {
        "alg": "RS256",
        "ver": "GTP-1.0",
        "keyId": 1
      }
      """
    Then "${header.alg}" is equal to "RS256"
    When wait 5 milliseconds
    And sign item "header" using jwt

  Scenario: JWT signing with payload
    When generate rsa key
    And set "privateKey" to it
    And set "header" to:
      """
      {
        "alg": "RS256",
        "ver": "GTP-1.0",
        "keyId": 1
      }
      """
    And sign using jwt:
      """
      {
        "number": null,
        "id": null,
        "exp": 1590176139,
        "iat": 1590176019,
        "jti": "fd867c6d-fcd5-4e5c-9bbf-95479a424f8f",
        "realm": "INT",
        "type": "access",
        "username": "LNMAF"
      }
      """
