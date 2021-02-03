Feature: Validations : Error from response
   Background:
     When set "directory" to "./test"

  Scenario:  Validate error
    When set "response" to:
"""
{
      "referenceNumber": null,
      "results": null,
      "status": 400,
      "error": {
        "errorCode": -2,
        "errorMessage": "Invalid Request",
        "subErrorCodes": [
          {
            "subErrorCode": "0019",
            "subErrorMessage": "Zip code is required"
          }
        ]
      }
}
"""
    Then item "response.error" is equal to:
"""
      {
        "errorCode": -2,
        "errorMessage": "Invalid Request",
        "subErrorCodes": [
          {
            "subErrorCode": "0019",
            "subErrorMessage": "Zip code is required"
          }
        ]
      }
"""
  And item "response.error" is not equal to:
"""
      {
        "errorCode": -3,
        "errorMessage": "Invalid Request",
        "subErrorCodes": [
          {
            "subErrorCode": "0019",
            "subErrorMessage": "Zip code is required"
          }
        ]
      }
"""
