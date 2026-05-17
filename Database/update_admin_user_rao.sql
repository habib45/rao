-- Update existing admin user to use email admin@rao.com and password Admin@123
-- Run this SQL in your MySQL database

-- Update the existing admin user's email and password
UPDATE admin_users 
SET 
  email = 'admin@rao.com',
  password_hash = '$2b$10$XcchR5j2sUgSxbBihxcLGOxvenUrbt50ENruCDlinbjPpzLE4iZmm',
  failed_login_attempts = 0,
  locked_until = NULL
WHERE username = 'admin';

-- Verify the user was updated
SELECT id, email, username, full_name, role, is_active FROM admin_users WHERE email = 'admin@rao.com';
