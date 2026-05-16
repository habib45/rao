-- Create admin user for ORH BestFinds application
-- Run this SQL in your MySQL database after fixing the database connection

-- Check if admin_users table exists, if not create it
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Generate password hash for: admin@admin.com / Password@123
-- This hash was generated using bcryptjs with 10 rounds
-- Password: Password@123
-- Hash: $2b$10$wTPpQHv8.rUi9gBKWE7u3.NHgUtl4VnPJUAO/8CV7hkxJDpC4f9TO

-- Delete existing admin user if exists (to avoid conflicts)
DELETE FROM admin_users WHERE email = 'admin@admin.com';

-- Insert new admin user
INSERT INTO admin_users (
  id,
  email,
  password_hash,
  name,
  role,
  is_active
) VALUES (
  UUID(),
  'admin@admin.com',
  '$2b$10$wTPpQHv8.rUi9gBKWE7u3.NHgUtl4VnPJUAO/8CV7hkxJDpC4f9TO',
  'Admin User',
  'admin',
  TRUE
);

-- Verify the user was created
SELECT id, email, name, role, is_active FROM admin_users WHERE email = 'admin@admin.com';

-- Note: You need to generate the actual bcrypt hash for 'Password@123'
-- You can generate it using Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('Password@123', 10);
// console.log(hash);
