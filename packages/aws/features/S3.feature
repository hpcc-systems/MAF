# ! These scenario will create a bucket on S3. Only use this for testing localstack !
Feature: AWS: S3 Testing

  Scenario Outline: File Upload
    Given bucket "test-bucket1" exists on S3
    And test file "<file>" is created
    And file "./test/<file>" is uploaded to bucket "test-bucket1" as key "<s3FilePath><key>"
    Then file exists with name "<key>" at path "<s3FilePath>" in bucket "test-bucket1"

    Examples:
      | file      | key   | s3FilePath |
      | test1.txt | test1 |            |
      | test2.txt | test2 |            |
      | test2.txt | test2 | foobar/    |
      | test3.txt | test3 | foobar/    |
      | test3.txt | test3 | foo/bar/   |
      | test1.txt | test1 | foobar/    |
      | test2.abc | test2 | foobar/    |

  Scenario: List Bucket Files
    Given bucket "test-bucket1" exists on S3
    When file list of bucket "test-bucket1" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test1",
        "test2"
      ]
      """
    When file list of bucket "test-bucket1" on path "foobar" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "foobar/test1",
        "foobar/test2",
        "foobar/test3"
      ]
      """

  Scenario: List All Files in Bucket
    Given bucket "test-bucket3" exists on S3
    When all files of bucket "test-bucket1" is retrieved
    Then item "lastRun" contains "foobar/test3"
    Then item "lastRun" contains "test2"
    Then item "lastRun" contains "test1"

  Scenario Outline: File Upload and Download
    Given "<text>" is written to file "./test/<file>"
    And file "./test/<file>" is uploaded to bucket "test-bucket2" as key "<s3FilePath><key>"
    And file "<key>" from bucket "test-bucket2" at path "<s3FilePath>" is retrieved
    Then it is equal to "<text>"

    Examples:
      | file      | s3FilePath | key       | text                               |
      | test1.txt |            | test1     | This is upload and download test 1 |
      | test2.txt | foo/bar/   | test2     | This is upload and download test 2 |
      | test1.txt | foobar/    | test1     | This is upload and download test 3 |
      | test2.abc | foobar/    | test2.abc | This is upload and download test 4 |

  Scenario: File Deletion on Root
    Given bucket "test-bucket1" exists on S3
    When file "test1" is deleted from bucket "test-bucket1" at path ""
    And file list of bucket "test-bucket1" on path "" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "test2"
      ]
      """

  Scenario: File Deletion on Path
    Given bucket "test-bucket1" exists on S3
    And file list of bucket "test-bucket1" on path "foobar" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "foobar/test1",
        "foobar/test2",
        "foobar/test3"
      ]
      """
    When file "test3" is deleted from bucket "test-bucket1" at path "foobar"
    And file list of bucket "test-bucket1" on path "foobar" is retrieved
    Then item "lastRun" is equal to:
      """
      [
        "foobar/test1",
        "foobar/test2"
      ]
      """
