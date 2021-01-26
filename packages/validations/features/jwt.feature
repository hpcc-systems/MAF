Feature: Validations : JWT
  Scenario:  Sign using JWT
    Given set "privateKey" to
"""
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
"""
   And set "header" to 
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

