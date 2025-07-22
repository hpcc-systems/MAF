-- Initialize the test database
-- Note: Database 'testdb' is already created via POSTGRES_DB environment variable

-- Create HelloWorld table
CREATE TABLE IF NOT EXISTS HelloWorld (
    id SERIAL PRIMARY KEY,
    message VARCHAR(255) NOT NULL
);

-- Insert initial test data
INSERT INTO HelloWorld (id, message) VALUES 
    (1, 'Hello'),
    (2, 'World'),
    (3, 'Test Data');

-- Update the sequence to continue from the highest ID
SELECT setval('helloworld_id_seq', COALESCE((SELECT MAX(id) + 1 FROM HelloWorld), 1), false);

-- Create a simple users table for more complex testing
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample users
INSERT INTO Users (username, email) VALUES 
    ('testuser1', 'test1@example.com'),
    ('testuser2', 'test2@example.com');

-- Display initialization status
SELECT 'Database initialized successfully' as status;
