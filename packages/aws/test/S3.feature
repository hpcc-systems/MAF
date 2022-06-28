# ! These scenario will create a bucket on S3. Only use this for testing localstack !
Feature: S3 Testing
  Scenario Outline: Create Bucket Test
    Given bucket "<bucket>" is not on S3
    And bucket "<bucket>" is created on S3
    And bucket "<bucket>" exists on S3
    Examples:
      | bucket      |
      | test-bucket  |
      | test-bucket2 |
      | test-bucket3 |
      | test-bucket4 |
      | test-bucket5 |
      | test-bucket6 |
      | test-bucket7 |

  Scenario Outline: File Upload
    Given bucket "<bucket>" exists on S3
    When set "directory" to "test/"
    And test file "<file>" is created
    And file "<file>" is uploaded to bucket "<bucket>" at path "<filePath>"
    Then file exists with name "<file>" at path "<filePath>" in bucket "<bucket>"

    Examples:
      | file      | bucket      | filePath |
      | test1.txt | test-bucket3 |          |
      | test2.txt | test-bucket3 |          |
      | test3.txt | test-bucket3 | foobar   |
      | test2.txt | test-bucket4 | foobar   |
      | test3.txt | test-bucket5 | foo/bar/ |
      | test1.txt | test-bucket6 | foobar/  |
      | test2.abc | test-bucket7 | foobar/  |

  Scenario: List Bucket Files
    Given bucket "test-bucket3" exists on S3
    When file list of bucket "test-bucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1.txt",
        "test2.txt"
      ]
      """
    When file list of bucket "test-bucket3" on path "foobar" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test3.txt"
      ]
      """
    When file list of bucket "test-bucket3" on path "foobar" is retrieved as json item
    Then item "lastRun[0].name" is equal to "test3.txt"
    And item "lastRun[0].size" is equal to 19
    When all files of bucket "test-bucket3" is retrieved
    Then item "lastRun" contains "test3.txt"
    When all files of bucket "test-bucket3" is retrieved as json item
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
      | test1.txt | test-bucket8  |          | This is upload and download test 1 |
      | test2.txt | test-bucket9  | foo/bar/ | This is upload and download test 2 |
      | test1.txt | test-bucket10 | foobar/  | This is upload and download test 3 |
      | test2.abc | test-bucket11 | foobar/  | This is upload and download test 4 |

  Scenario: File Deletion
    Given bucket "test-bucket3" exists on S3
    When set "directory" to "test/"
    And file list of bucket "test-bucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1.txt",
        "test2.txt"
      ]
      """
    When file "test1.txt" is deleted from bucket "test-bucket3" at path ""
    And file list of bucket "test-bucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test2.txt"
      ]
      """
