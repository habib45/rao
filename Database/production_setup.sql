-- Production Database Setup for ORH API Gateway
-- Run this on your production MySQL database

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS orh_bestfinds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE orh_bestfinds;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'admin', 'editor') DEFAULT 'admin',
  is_active TINYINT(1) DEFAULT 1,
  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME(6) NULL,
  last_login_at DATETIME(6) NULL,
  last_login_ip VARCHAR(45),
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create jwt_tokens table
CREATE TABLE IF NOT EXISTS jwt_tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_user_id VARCHAR(36) NOT NULL,
  username VARCHAR(100) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  token_value TEXT,
  status ENUM('active', 'deactivated', 'expired') DEFAULT 'active',
  issued_at DATETIME(6) NOT NULL,
  expiration_at DATETIME(6) NOT NULL,
  last_used_at DATETIME(6) NULL,
  usage_count INT DEFAULT 0,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_status (status),
  INDEX idx_expiration (expiration_at),
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(36),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used_at DATETIME(6) NULL,
  created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_token (token),
  INDEX idx_admin_user_id (admin_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert production admin user
-- Password: Admin@123
-- Hash: $2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm
DELETE FROM admin_users WHERE email = 'admin@rao.com';

INSERT INTO admin_users (
  email,
  username,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  'admin@rao.com',
  'admin',
  '$2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm',
  'System Administrator',
  'super_admin',
  1
);

-- Verify the user was created
SELECT id, email, username, full_name, role, is_active FROM admin_users WHERE email = 'admin@rao.com';
