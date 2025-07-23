-- Initialize the test database
CREATE DATABASE IF NOT EXISTS testdb;
USE testdb;

-- Create HelloWorld table
CREATE TABLE IF NOT EXISTS HelloWorld (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255) NOT NULL
);

-- Insert initial test data
INSERT INTO HelloWorld (id, message) VALUES 
    (1, 'Hello'),
    (2, 'World'),
    (3, 'Test Data');

-- Create a simple users table for more complex testing
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample users
INSERT INTO Users (username, email) VALUES 
    ('testuser1', 'test1@example.com'),
    ('testuser2', 'test2@example.com');

SELECT 'Database initialized successfully' as status;
