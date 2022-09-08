# ! These scenario will create a bucket on S3. Only use this for testing localstack !
Feature: AWS: S3 Testing
  Scenario Outline: Create Bucket Test
    Given bucket "<bucket>" is not on S3
    And bucket "<bucket>" is created on S3
    And bucket "<bucket>" exists on S3
    Examples:
      | bucket       |
      | test-bucket2 |
      | test-bucket3 |
      | test-bucket4 |
      | test-bucket5 |
      | test-bucket6 |
      | test-bucket7 |

  Scenario Outline: File Upload
    Given bucket "<bucket>" exists on S3
    And test file "<file>" is created
    And file "./test/<file>" is uploaded to bucket "<bucket>" as key "<s3FilePath><key>"
    Then file exists with name "<key>" at path "<s3FilePath>" in bucket "<bucket>"

    Examples:
      | file      | bucket       | key   | s3FilePath |
      | test1.txt | test-bucket3 | test1 |            |
      | test2.txt | test-bucket3 | test2 |            |
      | test3.txt | test-bucket3 | test3 | foobar/    |
      | test2.txt | test-bucket4 | test2 | foobar/    |
      | test3.txt | test-bucket5 | test3 | foo/bar/   |
      | test1.txt | test-bucket6 | test1 | foobar/    |
      | test2.abc | test-bucket7 | test2 | foobar/    |

  Scenario: List Bucket Files
    Given bucket "test-bucket3" exists on S3
    When file list of bucket "test-bucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1",
        "test2"
      ]
      """
    When file list of bucket "test-bucket3" on path "foobar" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "foobar/test3"
      ]
      """
    When all files of bucket "test-bucket3" is retrieved
    Then item "lastRun" contains "foobar/test3"
    Then item "lastRun" contains "test2"
    Then item "lastRun" contains "test1"

  Scenario Outline: File Upload and Download
    Given bucket "<bucket>" is created on S3
    And "<text>" is written to file "./test/<file>"
    And file "./test/<file>" is uploaded to bucket "<bucket>" as key "<s3FilePath><key>"
    And file "<key>" from bucket "<bucket>" at path "<s3FilePath>" is retrieved
    Then it is equal to "<text>"

    Examples:
      | file      | bucket        | s3FilePath | key       | text                               |
      | test1.txt | test-bucket8  |            | test1     | This is upload and download test 1 |
      | test2.txt | test-bucket9  | foo/bar/   | test2     | This is upload and download test 2 |
      | test1.txt | test-bucket10 | foobar/    | test1     | This is upload and download test 3 |
      | test2.abc | test-bucket11 | foobar/    | test2.abc | This is upload and download test 4 |

  Scenario: File Deletion
    Given bucket "test-bucket3" exists on S3
    When set "directory" to "test/"
    And file list of bucket "test-bucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1",
        "test2"
      ]
      """
    When file "test1" is deleted from bucket "test-bucket3" at path ""
    And file list of bucket "test-bucket3" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test2"
      ]
      """
