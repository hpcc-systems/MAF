Feature: PostgreSQL Database Operations

    Background:
        Given postgresql config from file "./test/test.postgresql.json"

    Scenario: Basic SELECT Query - Retrieve all records
        Given postgresql query from "DELETE FROM HelloWorld WHERE id > 3" is run
        When postgresql query from "SELECT * FROM HelloWorld ORDER BY id" is run
        Then it is equal to:
            """
            [
                {
                    "id": 1,
                    "message": "Hello"
                },
                {
                    "id": 2,
                    "message": "World"
                },
                {
                    "id": 3,
                    "message": "Test Data"
                }
            ]
            """

    Scenario: Basic INSERT and SELECT - Add new record
        Given postgresql query from "DELETE FROM HelloWorld WHERE message = 'Dynamic Insert'" is run
        When postgresql query from "INSERT INTO HelloWorld (message) VALUES ('Dynamic Insert')" is run
        And postgresql query from "SELECT * FROM HelloWorld WHERE message = 'Dynamic Insert'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" is equal to "Dynamic Insert"

    Scenario: UPDATE Operation - Modify existing record
        Given postgresql query from "DELETE FROM HelloWorld WHERE message IN ('Update Test', 'Updated Message')" is run
        When postgresql query from "INSERT INTO HelloWorld (message) VALUES ('Update Test')" is run
        And postgresql query from "UPDATE HelloWorld SET message = 'Updated Message' WHERE message = 'Update Test'" is run
        And postgresql query from "SELECT * FROM HelloWorld WHERE message = 'Updated Message'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" is equal to "Updated Message"

    Scenario: DELETE Operation - Remove a record
        Given postgresql query from "INSERT INTO HelloWorld (message) VALUES ('Delete Me')" is run
        When postgresql query from "DELETE FROM HelloWorld WHERE message = 'Delete Me'" is run
        And postgresql query from "SELECT * FROM HelloWorld WHERE message = 'Delete Me'" is run
        Then item "lastRun" has a length of 0

    Scenario: COUNT Operation - Count records
        When postgresql query from "SELECT COUNT(*) as count FROM HelloWorld" is run
        Then item "lastRun[0].count" is greater than 0

    Scenario: Users Table Operations - Complex SELECT with JOIN simulation
        When postgresql query from "SELECT * FROM Users ORDER BY user_id" is run
        Then item "lastRun" has a length of 2
        And item "lastRun[0].username" is equal to "testuser1"
        And item "lastRun[0].email" is equal to "test1@example.com"

    Scenario: LIMIT and OFFSET - Pagination
        When postgresql query from "SELECT * FROM HelloWorld ORDER BY id LIMIT 2 OFFSET 1" is run
        Then item "lastRun" has a length of 2
        And item "lastRun[0].id" is equal to 2

    Scenario: WHERE with LIKE - Pattern matching
        When postgresql query from "SELECT * FROM HelloWorld WHERE message LIKE '%Test%'" is run
        Then item "lastRun" has a length greater than 0

    Scenario: Transaction Test - Basic transaction
        Given postgresql query from "DELETE FROM HelloWorld WHERE message = 'Transaction Test'" is run
        When postgresql query from "BEGIN; INSERT INTO HelloWorld (message) VALUES ('Transaction Test'); COMMIT;" is run
        And postgresql query from "SELECT * FROM HelloWorld WHERE message = 'Transaction Test'" is run
        Then item "lastRun" has a length of 1

    Scenario: Data Types Test - Insert and retrieve different data types
        When postgresql query from "DROP TABLE IF EXISTS DataTypesTest; CREATE TABLE DataTypesTest (id SERIAL, name VARCHAR(50), age INTEGER, salary DECIMAL(10,2), is_active BOOLEAN, created_date DATE)" is run
        And postgresql query from "INSERT INTO DataTypesTest (name, age, salary, is_active, created_date) VALUES ('John Doe', 30, 50000.50, true, '2023-01-01')" is run
        And postgresql query from "SELECT * FROM DataTypesTest" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].name" is equal to "John Doe"
        And item "lastRun[0].age" is equal to 30

    Scenario: JSON Data Type - PostgreSQL specific feature
        When postgresql query from "DROP TABLE IF EXISTS JsonTest; CREATE TABLE JsonTest (id SERIAL, data JSONB)" is run
        And postgresql query from "INSERT INTO JsonTest (data) VALUES ('{"name": "test", "value": 123}')" is run
        And postgresql query from "SELECT data->>'name' as name, data->>'value' as value FROM JsonTest" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].name" is equal to "test"
        And item "lastRun[0].value" is equal to "123"

    Scenario: Array Data Type - PostgreSQL specific feature
        When postgresql query from "DROP TABLE IF EXISTS ArrayTest; CREATE TABLE ArrayTest (id SERIAL, tags TEXT[])" is run
        And postgresql query from "INSERT INTO ArrayTest (tags) VALUES (ARRAY['tag1', 'tag2', 'tag3'])" is run
        And postgresql query from "SELECT array_length(tags, 1) as tag_count FROM ArrayTest" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].tag_count" is equal to 3
