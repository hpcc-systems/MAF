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

  Scenario: Path Normalization and Edge Cases
    Given bucket "test-bucket1" exists on S3
    And "Test content for path normalization" is written to file "./test/path-test.txt"
    When file "./test/path-test.txt" is uploaded to bucket "test-bucket1" as key "path//with//multiple///slashes//test.txt"
    Then file exists with name "test.txt" at path "path/with/multiple/slashes/" in bucket "test-bucket1"
    When file list of bucket "test-bucket1" on path "path/with/multiple/slashes/" is retrieved
    Then item "lastRun" contains "path/with/multiple/slashes/test.txt"

  Scenario: File Operations with Different Extensions and Special Characters
    Given bucket "test-bucket2" exists on S3
    And "JSON content for testing" is written to file "./test/data.json"
    And "XML content for testing" is written to file "./test/data.xml"
    And "CSV content for testing" is written to file "./test/data.csv"
    When file "./test/data.json" is uploaded to bucket "test-bucket2" as key "data-files/test-data.json"
    And file "./test/data.xml" is uploaded to bucket "test-bucket2" as key "data-files/test-data.xml"
    And file "./test/data.csv" is uploaded to bucket "test-bucket2" as key "data-files/test-data.csv"
    Then file exists with name "test-data.json" at path "data-files/" in bucket "test-bucket2"
    And file exists with name "test-data.xml" at path "data-files/" in bucket "test-bucket2"
    And file exists with name "test-data.csv" at path "data-files/" in bucket "test-bucket2"

  Scenario: Large File List Retrieval
    Given bucket "test-bucket3" exists on S3
    And "Test file 1" is written to file "./test/file1.txt"
    And "Test file 2" is written to file "./test/file2.txt"
    And "Test file 3" is written to file "./test/file3.txt"
    And "Test file 4" is written to file "./test/file4.txt"
    And "Test file 5" is written to file "./test/file5.txt"
    When file "./test/file1.txt" is uploaded to bucket "test-bucket3" as key "files/file1.txt"
    And file "./test/file2.txt" is uploaded to bucket "test-bucket3" as key "files/file2.txt"
    And file "./test/file3.txt" is uploaded to bucket "test-bucket3" as key "files/file3.txt"
    And file "./test/file4.txt" is uploaded to bucket "test-bucket3" as key "files/file4.txt"
    And file "./test/file5.txt" is uploaded to bucket "test-bucket3" as key "files/file5.txt"
    When file list of bucket "test-bucket3" on path "files/" is retrieved
    Then item "lastRun" contains "files/file1.txt"
    And item "lastRun" contains "files/file2.txt"
    And item "lastRun" contains "files/file3.txt"
    And item "lastRun" contains "files/file4.txt"
    And item "lastRun" contains "files/file5.txt"

  Scenario: Deep Path Structure Testing
    Given bucket "test-bucket4" exists on S3
    And "Deep path content" is written to file "./test/deep-test.txt"
    When file "./test/deep-test.txt" is uploaded to bucket "test-bucket4" as key "level1/level2/level3/level4/deep-test.txt"
    Then file exists with name "deep-test.txt" at path "level1/level2/level3/level4/" in bucket "test-bucket4"
    When file "deep-test.txt" from bucket "test-bucket4" at path "level1/level2/level3/level4/" is retrieved
    Then it is equal to "Deep path content"

  Scenario: Empty Path Operations
    Given bucket "test-bucket1" exists on S3
    And "Root level content" is written to file "./test/root-level.txt"
    When file "./test/root-level.txt" is uploaded to bucket "test-bucket1" as key "root-level-file.txt"
    Then file exists with name "root-level-file.txt" at path "" in bucket "test-bucket1"
    When file "root-level-file.txt" from bucket "test-bucket1" at path "" is retrieved
    Then it is equal to "Root level content"

  Scenario: Complex File Names and Paths
    Given bucket "test-bucket2" exists on S3
    And "Complex name content" is written to file "./test/complex-file-name.txt"
    When file "./test/complex-file-name.txt" is uploaded to bucket "test-bucket2" as key "complex-paths/file-with-dashes_and_underscores.v1.2.3.txt"
    Then file exists with name "file-with-dashes_and_underscores.v1.2.3.txt" at path "complex-paths/" in bucket "test-bucket2"
    When file "file-with-dashes_and_underscores.v1.2.3.txt" from bucket "test-bucket2" at path "complex-paths/" is written to "./test/complex-downloaded.txt"
    Then file "./test/complex-downloaded.txt" is equal to "Complex name content"

  Scenario: Multiple File Operations in Single Path
    Given bucket "test-bucket3" exists on S3
    And "Content A" is written to file "./test/testA.txt"
    And "Content B" is written to file "./test/testB.txt"
    And "Content C" is written to file "./test/testC.txt"
    When file "./test/testA.txt" is uploaded to bucket "test-bucket3" as key "multi/testA.txt"
    And file "./test/testB.txt" is uploaded to bucket "test-bucket3" as key "multi/testB.txt"
    And file "./test/testC.txt" is uploaded to bucket "test-bucket3" as key "multi/testC.txt"
    When file list of bucket "test-bucket3" on path "multi/" is retrieved
    Then item "lastRun" contains "multi/testA.txt"
    And item "lastRun" contains "multi/testB.txt"
    And item "lastRun" contains "multi/testC.txt"
    When file "testB.txt" from bucket "test-bucket3" at path "multi/" is retrieved
    Then it is equal to "Content B"

  Scenario: File Operations with Template Variables
    Given bucket "test-bucket4" exists on S3
    And "Template test content" is written to file "./test/template-test.txt"
    And set "bucketVar" to "test-bucket4"
    And set "pathVar" to "template-path/"
    And set "fileVar" to "template-file.txt"
    When file "./test/template-test.txt" is uploaded to bucket "${bucketVar}" as key "${pathVar}${fileVar}"
    Then file exists with name "${fileVar}" at path "${pathVar}" in bucket "${bucketVar}"
    When file "${fileVar}" from bucket "${bucketVar}" at path "${pathVar}" is retrieved
    Then it is equal to "Template test content"

  Scenario: Deprecated Step Definition Usage
    Given bucket "test-bucket1" exists on S3
    And "Gzip deprecated test content" is written to file "./test/deprecated-test.txt"
    And the file "./test/deprecated-test.txt" is gzipped
    When file "./test/deprecated-test.txt.gz" is uploaded to bucket "test-bucket1" as key "deprecated/test.txt.gz"
    When gz file "test.txt.gz" from bucket "test-bucket1" at path "deprecated/" is written to "./test/deprecated-downloaded.txt.gz"
    Then file "./test/deprecated-downloaded.txt.gz" is gzip unzipped to file "./test/deprecated-result.txt"
    And file "./test/deprecated-result.txt" is equal to "Gzip deprecated test content"

  Scenario: Empty and Special Path Handling
    Given bucket "test-bucket2" exists on S3
    And "Empty path test" is written to file "./test/empty-path.txt"
    When file "./test/empty-path.txt" is uploaded to bucket "test-bucket2" as key "empty-path.txt"
    When file list of bucket "test-bucket2" on path "" is retrieved
    Then item "lastRun" contains "empty-path.txt"
    When file "empty-path.txt" from bucket "test-bucket2" at path "" is retrieved
    Then it is equal to "Empty path test"

  Scenario: Path with Leading Slash Normalization
    Given bucket "test-bucket3" exists on S3
    And "Leading slash test" is written to file "./test/leading-slash.txt"
    When file "./test/leading-slash.txt" is uploaded to bucket "test-bucket3" as key "/leading-slash-path/test.txt"
    Then file exists with name "test.txt" at path "leading-slash-path/" in bucket "test-bucket3"
    When file list of bucket "test-bucket3" on path "leading-slash-path/" is retrieved
    Then item "lastRun" contains "leading-slash-path/test.txt"

  Scenario: Bucket Existence Check with Different Buckets
    Given bucket "test-bucket1" exists
    And bucket "test-bucket2" exists
    And bucket "test-bucket3" exists
    And bucket "test-bucket4" exists

  Scenario: File Operations with Path Traversal Protection
    Given bucket "test-bucket1" exists on S3
    And "Path traversal test" is written to file "./test/traversal-test.txt"
    When file "./test/traversal-test.txt" is uploaded to bucket "test-bucket1" as key "safe/../path/test.txt"
    Then file exists with name "test.txt" at path "safe/path/" in bucket "test-bucket1"
    When file "test.txt" from bucket "test-bucket1" at path "safe/path/" is retrieved
    Then it is equal to "Path traversal test"

  Scenario: Large File List with Pagination
    Given bucket "test-bucket2" exists on S3
    And "File 1" is written to file "./test/batch1.txt"
    And "File 2" is written to file "./test/batch2.txt"
    And "File 3" is written to file "./test/batch3.txt"
    And "File 4" is written to file "./test/batch4.txt"
    And "File 5" is written to file "./test/batch5.txt"
    And "File 6" is written to file "./test/batch6.txt"
    When file "./test/batch1.txt" is uploaded to bucket "test-bucket2" as key "batch/batch1.txt"
    And file "./test/batch2.txt" is uploaded to bucket "test-bucket2" as key "batch/batch2.txt"
    And file "./test/batch3.txt" is uploaded to bucket "test-bucket2" as key "batch/batch3.txt"
    And file "./test/batch4.txt" is uploaded to bucket "test-bucket2" as key "batch/batch4.txt"
    And file "./test/batch5.txt" is uploaded to bucket "test-bucket2" as key "batch/batch5.txt"
    And file "./test/batch6.txt" is uploaded to bucket "test-bucket2" as key "batch/batch6.txt"
    When all files of bucket "test-bucket2" is retrieved
    Then item "lastRun" contains "batch/batch1.txt"
    And item "lastRun" contains "batch/batch6.txt"

  Scenario: Non-existent Bucket Check
    When bucket "non-existent-bucket" is not on S3

  Scenario: Complex File Extensions and Paths
    Given bucket "test-bucket3" exists on S3
    And "Archive content" is written to file "./test/archive.tar.gz"
    And "Database backup" is written to file "./test/backup.sql.bz2"
    When file "./test/archive.tar.gz" is uploaded to bucket "test-bucket3" as key "archives/data.tar.gz"
    And file "./test/backup.sql.bz2" is uploaded to bucket "test-bucket3" as key "backups/db.sql.bz2"
    Then file exists with name "data.tar.gz" at path "archives/" in bucket "test-bucket3"
    And file exists with name "db.sql.bz2" at path "backups/" in bucket "test-bucket3"
    When file "data.tar.gz" from bucket "test-bucket3" at path "archives/" is written to "./test/downloaded-archive.tar.gz"
    And file "db.sql.bz2" from bucket "test-bucket3" at path "backups/" is written to "./test/downloaded-backup.sql.bz2"
    Then file "./test/downloaded-archive.tar.gz" is equal to "Archive content"
    And file "./test/downloaded-backup.sql.bz2" is equal to "Database backup"
