# ! These scenario will create a bucket on S3. Only use this for testing localstack !
Feature: S3 Testing
  Scenario Outline: Create Bucket Test
    Given bucket "<bucket>" is not on S3
    And bucket "<bucket>" is created on S3
    And bucket "<bucket>" exists on S3
    Examples:
      | bucket      |
      | testBucket  |
      | testBucket2 |
      | testBucket3 |
      | testBucket4 |
      | testBucket5 |
      | testBucket6 |
      | testBucket7 |

  Scenario Outline: File Upload
    Given bucket "<bucket>" exists on S3
    When set "directory" to "test/"
    And test file "<file>" is created
    And file "<file>" is uploaded to bucket "<bucket>" at path "<filePath>"
    Then file exists with name "<file>" at path "<filePath>" in bucket "<bucket>"

    Examples:
      | file      | bucket      | filePath |
      | test1.txt | testBucket3 |          |
      | test2.txt | testBucket3 |          |
      | test3.txt | testBucket3 | foobar   |
      | test2.txt | testBucket4 | foobar   |
      | test3.txt | testBucket5 | foo/bar/ |
      | test1.txt | testBucket6 | foobar/  |
      | test2.abc | testBucket7 | foobar/  |

  Scenario: List Bucket Files
    Given bucket "testBucket3" exists on S3
    When file list of bucket "testBucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1.txt",
        "test2.txt"
      ]
      """
    When file list of bucket "testBucket3" on path "foobar" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test3.txt"
      ]
      """
    When file list of bucket "testBucket3" on path "foobar" is retrieved as json item
    Then item "lastRun[0].name" is equal to "test3.txt"
    And item "lastRun[0].size" is equal to 19
    When all files of bucket "testBucket3" is retrieved
    Then item "lastRun" contains "test3.txt"
    When all files of bucket "testBucket3" is retrieved as json item
    Then item "lastRun" contains "test3.txt"

  Scenario Outline: File Upload and Download
    Given bucket "<bucket>" is created on S3
    When set "directory" to "test/"
    And "<text>" is written to file "<file>"
    And file "<file>" is uploaded to bucket "<bucket>" at path "<s3FilePath>"
    And file "<file>" from bucket "<bucket>" at path "<s3FilePath>" is retrieved
    Then it is equal to "<text>"

    Examples:
      | file      | bucket       | s3FilePath | text                               |
      | test1.txt | testBucket8  |          | This is upload and download test 1 |
      | test2.txt | testBucket9  | foo/bar/ | This is upload and download test 2 |
      | test1.txt | testBucket10 | foobar/  | This is upload and download test 3 |
      | test2.abc | testBucket11 | foobar/  | This is upload and download test 4 |

  Scenario: File Deletion
    Given bucket "testBucket3" exists on S3
    When set "directory" to "test/"
    And file list of bucket "testBucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1.txt",
        "test2.txt"
      ]
      """
    When file "test1.txt" is deleted from bucket "testBucket3" at path ""
    And file list of bucket "testBucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test2.txt"
      ]
      """
