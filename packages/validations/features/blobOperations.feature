Feature: Validations: Binary Blob Operations
  Background:
    When set "directory" to "./test"

  Scenario: Blob reading and writing
    And set "attach" to "false"
    When blob is read from file "image2.png"
    And blob item "lastRun" is written to file "newBlob.png"
    And blob item "lastRun" is attached
    Then blob item "lastRun" is equal to file "newBlob.png"

  Scenario: Blob attachment
    When set "attach" to "false"
    When blob is read from file "newBlob.png"
    And blob item "lastRun" is attached
