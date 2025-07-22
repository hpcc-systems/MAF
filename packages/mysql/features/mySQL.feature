Feature: MySQL Database Operations

    Scenario: Basic SELECT Query - Retrieve all records
        When mysql query from "SELECT * FROM HelloWorld ORDER BY id" is run
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
        When mysql query from "INSERT INTO HelloWorld (message) VALUES ('Dynamic Insert')" is run
        And mysql query from "SELECT * FROM HelloWorld WHERE message = 'Dynamic Insert'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" is equal to "Dynamic Insert"

    Scenario: UPDATE Operation - Modify existing record
        Given mysql query from "INSERT INTO HelloWorld (message) VALUES ('Update Test')" is run
        When mysql query from "UPDATE HelloWorld SET message = 'Updated Message' WHERE message = 'Update Test'" is run
        And mysql query from "SELECT * FROM HelloWorld WHERE message = 'Updated Message'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" is equal to "Updated Message"

    Scenario: DELETE Operation - Remove record
        Given mysql query from "INSERT INTO HelloWorld (message) VALUES ('Delete Test')" is run
        When mysql query from "DELETE FROM HelloWorld WHERE message = 'Delete Test'" is run
        And mysql query from "SELECT * FROM HelloWorld WHERE message = 'Delete Test'" is run
        Then item "lastRun" has a length of 0

    Scenario: Query with Template Variables
        Given set "testMessage" to "Template Test"
        When mysql query from "INSERT INTO HelloWorld (message) VALUES ('${testMessage}')" is run
        And mysql query from "SELECT * FROM HelloWorld WHERE message = '${testMessage}'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" is equal to "Template Test"

    Scenario: Query from JSON Object - Dynamic query building
        Given set "dynamicQuery" to "SELECT * FROM HelloWorld WHERE id <= 2 ORDER BY id"
        When mysql query from "${dynamicQuery}" is run
        Then item "lastRun" has a length of 2
        And item "lastRun[0].id" is equal to 1
        And item "lastRun[1].id" is equal to 2

    Scenario: Complex Query with WHERE conditions
        When mysql query from "SELECT * FROM HelloWorld WHERE id BETWEEN 1 AND 2 ORDER BY id" is run
        Then item "lastRun" has a length of 2
        And item "lastRun[0].message" is equal to "Hello"
        And item "lastRun[1].message" is equal to "World"

    Scenario: COUNT Query Operation
        When mysql query from "SELECT COUNT(*) as total_count FROM HelloWorld" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].total_count" is greater than 0

    Scenario: Table Structure Operations - CREATE and DROP
        When mysql query from "DROP TABLE IF EXISTS TestTable" is run
        And mysql query from "CREATE TABLE IF NOT EXISTS TestTable (test_id INT AUTO_INCREMENT PRIMARY KEY, test_name VARCHAR(100))" is run
        And mysql query from "INSERT INTO TestTable (test_name) VALUES ('Test Entry')" is run
        And mysql query from "SELECT * FROM TestTable WHERE test_name = 'Test Entry'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].test_name" is equal to "Test Entry"
        When mysql query from "DROP TABLE IF EXISTS TestTable" is run

    Scenario: Multiple Statements in Single Query
        When mysql query from "INSERT INTO HelloWorld (message) VALUES ('Batch1')" is run
        And mysql query from "INSERT INTO HelloWorld (message) VALUES ('Batch2')" is run
        And mysql query from "SELECT * FROM HelloWorld WHERE message IN ('Batch1', 'Batch2') ORDER BY message" is run
        Then item "lastRun" has a length of 2
        And item "lastRun[0].message" is equal to "Batch1"
        And item "lastRun[1].message" is equal to "Batch2"

    Scenario: Data Type Testing - Working with different data types
        When mysql query from "DROP TABLE IF EXISTS DataTypeTest" is run
        And mysql query from "CREATE TABLE IF NOT EXISTS DataTypeTest (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50), age INT, price DECIMAL(10,2), is_active BOOLEAN, created_date DATETIME)" is run
        And mysql query from "INSERT INTO DataTypeTest (name, age, price, is_active, created_date) VALUES ('John Doe', 25, 99.99, TRUE, NOW())" is run
        And mysql query from "SELECT name, age, price, is_active FROM DataTypeTest WHERE name = 'John Doe'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].name" is equal to "John Doe"
        And item "lastRun[0].age" is equal to 25
        And item "lastRun[0].price" is equal to "99.99"
        And item "lastRun[0].is_active" is equal to 1
        When mysql query from "DROP TABLE IF EXISTS DataTypeTest" is run

    Scenario: Working with NULL Values
        When mysql query from "DROP TABLE IF EXISTS NullTest" is run
        And mysql query from "CREATE TABLE IF NOT EXISTS NullTest (id INT AUTO_INCREMENT PRIMARY KEY, optional_field VARCHAR(50))" is run
        And mysql query from "INSERT INTO NullTest (optional_field) VALUES (NULL)" is run
        And mysql query from "SELECT * FROM NullTest WHERE optional_field IS NULL" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].optional_field" is equal to null
        When mysql query from "DROP TABLE IF EXISTS NullTest" is run

    Scenario: JOIN Operations - Testing table relationships
        When mysql query from "DROP TABLE IF EXISTS UserProfiles" is run
        And mysql query from "DROP TABLE IF EXISTS Users" is run
        And mysql query from "CREATE TABLE IF NOT EXISTS Users (user_id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50))" is run
        And mysql query from "CREATE TABLE IF NOT EXISTS UserProfiles (profile_id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, email VARCHAR(100))" is run
        And mysql query from "INSERT INTO Users (username) VALUES ('testuser')" is run
        And mysql query from "INSERT INTO UserProfiles (user_id, email) VALUES (1, 'test@example.com')" is run
        And mysql query from "SELECT u.username, p.email FROM Users u INNER JOIN UserProfiles p ON u.user_id = p.user_id WHERE u.username = 'testuser'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].username" is equal to "testuser"
        And item "lastRun[0].email" is equal to "test@example.com"
        When mysql query from "DROP TABLE IF EXISTS UserProfiles" is run
        And mysql query from "DROP TABLE IF EXISTS Users" is run

    Scenario: Aggregate Functions Testing
        When mysql query from "SELECT MIN(id) as min_id, MAX(id) as max_id, AVG(id) as avg_id FROM HelloWorld" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].min_id" is equal to 1
        And item "lastRun[0].max_id" is greater than 1

    Scenario: String Functions and Operations
        When mysql query from "SELECT UPPER(message) as upper_message, LENGTH(message) as message_length FROM HelloWorld WHERE id = 1" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].upper_message" is equal to "HELLO"
        And item "lastRun[0].message_length" is equal to 5

    Scenario: Date and Time Functions
        When mysql query from "SELECT NOW() as now_time, CURDATE() as today_date" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].now_time" is not null
        And item "lastRun[0].today_date" is not null

    Scenario: LIMIT and OFFSET Operations
        When mysql query from "SELECT * FROM HelloWorld ORDER BY id LIMIT 2" is run
        Then item "lastRun" has a length of 2
        When mysql query from "SELECT * FROM HelloWorld ORDER BY id LIMIT 1 OFFSET 1" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].id" is equal to 2

    Scenario: GROUP BY and HAVING Operations
        When mysql query from "INSERT INTO HelloWorld (message) VALUES ('Duplicate')" is run
        And mysql query from "INSERT INTO HelloWorld (message) VALUES ('Duplicate')" is run
        And mysql query from "SELECT message, COUNT(*) as count FROM HelloWorld WHERE message = 'Duplicate' GROUP BY message HAVING COUNT(*) > 1" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" is equal to "Duplicate"
        And item "lastRun[0].count" is equal to 2

    Scenario: Custom MySQL Configuration Testing
        Given mysql config from '{"host":"localhost","port":3307,"database":"testdb","multipleStatements":true}'
        When mysql query from "SELECT 'Config Test' as test_message" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].test_message" is equal to "Config Test"

    Scenario: Large Result Set Handling
        When mysql query from "SELECT * FROM HelloWorld UNION ALL SELECT * FROM HelloWorld UNION ALL SELECT * FROM HelloWorld" is run
        Then item "lastRun" has a length greater than 3

    Scenario: Special Characters in Data
        When mysql query from "INSERT INTO HelloWorld (message) VALUES ('Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?')" is run
        And mysql query from "SELECT * FROM HelloWorld WHERE message LIKE '%Special chars%'" is run
        Then item "lastRun" has a length of 1
        And item "lastRun[0].message" contains "!@#$%^&*()"

    Scenario: Cleanup Test Data
        When mysql query from "DELETE FROM HelloWorld WHERE message IN ('Dynamic Insert', 'Updated Message', 'Template Test', 'Batch1', 'Batch2', 'Commit Test', 'Duplicate') OR message LIKE '%Special chars%'" is run
