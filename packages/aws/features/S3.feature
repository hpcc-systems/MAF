Feature: AWS: S3 Testing

  Scenario Outline: File Upload
    Given bucket "test-bucket1" exists on S3
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

  Scenario Outline: Text File Upload and Download to Memory
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

  Scenario: Text File Upload and Download To Storage
    Given bucket "test-bucket4" exists on S3
    And "Sample text content for testing" is written to file "./test/sample.txt"
    When file "./test/sample.txt" is uploaded to bucket "test-bucket4" as key "text-files/sample.txt"
    Then file exists with name "sample.txt" at path "text-files/" in bucket "test-bucket4"
    When file "sample.txt" from bucket "test-bucket4" at path "text-files/" is written to "./test/sample_download.txt"
    Then file "./test/sample_download.txt" is equal to "Sample text content for testing"

  Scenario: Gzip File Upload And Download To Storage
    Given bucket "test-bucket4" exists on S3
    And "Content to be uploaded as gzip" is written to file "./test/gzip-sample.txt"
    And the file "./test/gzip-sample.txt" is gzipped
    When file "./test/gzip-sample.txt.gz" is uploaded to bucket "test-bucket4" as key "gzip-files/sample.txt.gz"
    Then file exists with name "sample.txt.gz" at path "gzip-files/" in bucket "test-bucket4"
    When file "sample.txt.gz" from bucket "test-bucket4" at path "gzip-files/" is written to "./test/sample_download.txt.gz"
    Then file "./test/sample_download.txt.gz" is gzip unzipped to file "./test/sample_download.txt"
    And file "./test/sample_download.txt" is equal to "Content to be uploaded as gzip"

