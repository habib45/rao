-- Insert admin user with email admin@rao.com
-- Run this SQL in your MySQL database

-- Delete existing admin user if exists (to avoid conflicts)
DELETE FROM admin_users WHERE email = 'admin@rao.com';

-- Insert new admin user with email admin@rao.com
-- Password: Admin@123
-- Hash: $2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm
INSERT INTO admin_users (
  email,
  username,
  password_hash,
  full_name,
  role,
  is_active,
  failed_login_attempts
) VALUES (
  'admin@rao.com',
  'admin',
  '$2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm',
  'Admin User',
  'admin',
  1,
  0
);

-- Verify the user was created
SELECT id, email, username, full_name, role, is_active FROM admin_users WHERE email = 'admin@rao.com';
