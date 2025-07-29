Feature: SFTP - File Operations
    Background:
        Given set "directory" to "./test"
        And set "username" to "testuser"
        And set "hostname" to "localhost"
        And set "port" to "2222"
        And set "password" to "testpass"

    Scenario: List empty files from remote directory
        When list of files from remote server directory "/upload" is received
        Then it is equal to "[]"

    Scenario: Copy file to server
        When file "test_file.txt" is put in server folder "upload"
        And file "test_file2.txt" is put in server folder "upload/"
        Then list of files from remote server directory "/upload" is received
        And it contains "test_file.txt"
        And it contains "test_file2.txt"

    Scenario: List files from specific server and directory
        When list of files from remote server directory "/upload" is received
        Then it is equal to '["test_file.txt","test_file2.txt"]'

    Scenario: List empty files from specific server and directory
        When list of files from remote server directory "/does_not_exist" is received
        Then it is equal to "[]"
        When list of files from remote server directory "/" is received
        Then it is equal to "[]"

    Scenario: Get file from remote server to local path
        When file "upload/test_file.txt" is downloaded from server as file "test_download_file.txt"
        Then file "test_download_file.txt" is equal to file "test_file.txt"
        And file "test_download_file.txt" contains "This file is used for testing SFTP upload and download functionality."

    Scenario: Download latest file from server directory
        When latest file from server directory "upload" is downloaded as file "latest_downloaded.txt"
        Then file "latest_downloaded.txt" is equal to file "test_file2.txt"
        And file "latest_downloaded.txt" contains "This file is another file used for testing SFTP upload and download functionality."

    Scenario: Download latest file to a specific path
        When latest file from server directory "upload" is downloaded as file "downloads/latest_in_downloads.txt"
        Then file "downloads/latest_in_downloads.txt" is equal to file "test_file2.txt"
        And file "downloads/latest_in_downloads.txt" contains "This file is another file used for testing SFTP upload and download functionality."

    Scenario: Upload and verify multiple files for latest file test
        When file "test_file.txt" is put in server folder "upload"
        And file "test_file2.txt" is put in server folder "upload"
        And latest file from server directory "upload" is downloaded as file "multi_latest.txt"
        Then file "multi_latest.txt" is equal to file "test_file2.txt"
        And file "multi_latest.txt" contains "This file is another file used for testing SFTP upload and download functionality."
