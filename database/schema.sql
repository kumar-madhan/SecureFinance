-- Database schema for SecureBank application

-- Drop tables if they exist
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number VARCHAR(255) NOT NULL UNIQUE,
  account_type VARCHAR(50) NOT NULL, -- 'checking', 'savings', 'credit'
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  credit_limit DECIMAL(15, 2), -- only for credit accounts
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
  recipient_account_id INTEGER REFERENCES accounts(id)
);

-- Create transfers table
CREATE TABLE transfers (
  id SERIAL PRIMARY KEY,
  from_account_id INTEGER NOT NULL REFERENCES accounts(id),
  to_account_id INTEGER NOT NULL REFERENCES accounts(id),
  amount DECIMAL(15, 2) NOT NULL,
  memo VARCHAR(255),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed' -- 'pending', 'completed', 'failed'
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transfers_from_account_id ON transfers(from_account_id);
CREATE INDEX idx_transfers_to_account_id ON transfers(to_account_id);

-- Sample data
-- Insert sample users
-- Note: In a real app, passwords would be hashed. These are examples only.
INSERT INTO users (username, password, first_name, last_name, email) VALUES
('johndoe', '$2b$10$rNCLg.fBY7TZ1w9Uq1BMneA.UJgMJJMK9TCfHDjKgXmM51x.j1XCi', 'John', 'Doe', 'john.doe@example.com'),
('janedoe', '$2b$10$2tJIQtxPQ3GXQhi3QcR8O.BFVpjzAQgRZYOXtkRf82yeHvRl0AY1S', 'Jane', 'Doe', 'jane.doe@example.com'),
('mikejones', '$2b$10$6.XnLD1KT8VFO5vVXenLkuhA7i4Fiwk5a.MvEH4lK8C3WA.VNSG8W', 'Mike', 'Jones', 'mike.jones@example.com');

-- Insert sample accounts
INSERT INTO accounts (user_id, account_number, account_type, balance, credit_limit) VALUES
(1, '1001234567', 'checking', 5200.75, NULL),
(1, '1001234568', 'savings', 15750.25, NULL),
(1, '1001234569', 'credit', -450.00, 5000.00),
(2, '2001234567', 'checking', 3720.50, NULL),
(2, '2001234568', 'savings', 8900.00, NULL),
(3, '3001234567', 'checking', 1250.00, NULL),
(3, '3001234568', 'credit', -2100.00, 3000.00);

-- Insert sample transactions
INSERT INTO transactions (account_id, amount, description, category, date, type, recipient_account_id) VALUES
-- John's checking account transactions
(1, -120.50, 'Grocery Shopping - Whole Foods', 'Groceries', '2023-01-15 14:30:00', 'withdrawal', NULL),
(1, -45.75, 'Restaurant - Olive Garden', 'Dining', '2023-01-18 19:45:00', 'withdrawal', NULL),
(1, 2500.00, 'Salary Deposit', 'Income', '2023-02-01 09:00:00', 'deposit', NULL),
(1, -800.00, 'Rent Payment', 'Housing', '2023-02-05 10:30:00', 'withdrawal', NULL),
(1, -500.00, 'Transfer to Savings', 'Transfer', '2023-02-10 16:15:00', 'transfer', 2),

-- John's savings account transactions
(2, 500.00, 'Transfer from Checking', 'Transfer', '2023-02-10 16:15:00', 'deposit', NULL),
(2, 200.00, 'Interest Payment', 'Income', '2023-02-28 00:01:00', 'deposit', NULL),

-- John's credit card transactions
(3, -89.99, 'Amazon Purchase', 'Shopping', '2023-02-12 13:20:00', 'withdrawal', NULL),
(3, -120.00, 'Phone Bill Payment', 'Utilities', '2023-02-15 09:45:00', 'withdrawal', NULL),
(3, -240.01, 'Flight Ticket', 'Travel', '2023-02-20 11:30:00', 'withdrawal', NULL),

-- Jane's checking account transactions
(4, 3000.00, 'Salary Deposit', 'Income', '2023-02-01 09:15:00', 'deposit', NULL),
(4, -950.00, 'Rent Payment', 'Housing', '2023-02-03 14:20:00', 'withdrawal', NULL),
(4, -75.25, 'Electric Bill', 'Utilities', '2023-02-08 16:40:00', 'withdrawal', NULL),
(4, -300.00, 'Transfer to Savings', 'Transfer', '2023-02-15 10:00:00', 'transfer', 5),

-- Jane's savings account transactions
(5, 300.00, 'Transfer from Checking', 'Transfer', '2023-02-15 10:00:00', 'deposit', NULL),
(5, 100.00, 'Interest Payment', 'Income', '2023-02-28 00:01:00', 'deposit', NULL),

-- Mike's checking account transactions
(6, 1800.00, 'Salary Deposit', 'Income', '2023-02-01 09:30:00', 'deposit', NULL),
(6, -700.00, 'Rent Payment', 'Housing', '2023-02-05 11:00:00', 'withdrawal', NULL),
(6, -150.00, 'Grocery Shopping - Trader Joe''s', 'Groceries', '2023-02-10 17:30:00', 'withdrawal', NULL),

-- Mike's credit card transactions
(7, -500.00, 'New Smartphone', 'Electronics', '2023-02-08 13:15:00', 'withdrawal', NULL),
(7, -150.00, 'Dining Out - Birthday Dinner', 'Dining', '2023-02-12 20:00:00', 'withdrawal', NULL),
(7, -1450.00, 'Flight Tickets', 'Travel', '2023-02-15 09:30:00', 'withdrawal', NULL);

-- Insert sample transfers
INSERT INTO transfers (from_account_id, to_account_id, amount, memo, date, status) VALUES
(1, 2, 500.00, 'Monthly savings transfer', '2023-02-10 16:15:00', 'completed'),
(4, 5, 300.00, 'Saving for vacation', '2023-02-15 10:00:00', 'completed'),
(1, 4, 120.00, 'Split dinner bill', '2023-02-18 22:30:00', 'completed'),
(6, 1, 75.50, 'Fantasy football winnings', '2023-02-20 14:20:00', 'completed');

-- Create a session table for managing user sessions
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");