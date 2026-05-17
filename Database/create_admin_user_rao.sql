-- Create admin user with email admin@rao.com
-- Run this SQL in your MySQL database

-- Drop and recreate admin_users table with proper schema
DROP TABLE IF EXISTS admin_users;

CREATE TABLE admin_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  last_login_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  admin_user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(36),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
);

-- Create password_reset_tokens table if not exists
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  admin_user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_admin_user_id (admin_user_id)
);

-- Generate password hash for: admin@rao.com / Admin@123
-- This hash was generated using bcryptjs with 10 rounds
-- Password: Admin@123
-- Hash: $2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm

-- Insert new admin user with email admin@rao.com
INSERT INTO admin_users (
  id,
  email,
  username,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  UUID(),
  'admin@rao.com',
  'admin',
  '$2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm',
  'Admin User',
  'admin',
  TRUE
);

-- Verify the user was created
SELECT id, email, username, full_name, role, is_active FROM admin_users WHERE email = 'admin@rao.com';

-- Note: The hash above is for 'Admin@123' generated with bcryptjs (10 rounds)
-- If you need to generate a new hash, use Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('Admin@123', 10);
-- console.log(hash);
