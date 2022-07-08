Feature: Validations: Blob setting
   Background:
     When set "directory" to "./test"

  Scenario: Test blob
    And set "attach" to "false"
    When blob is read from file "image2.png"
    And blob item "lastRun" is written to file "newBlob.png"
    And blob item "lastRun" is attached
    Then blob item "lastRun" is equal to file "newBlob.png"
