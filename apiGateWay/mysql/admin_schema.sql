-- ============================================================
-- Admin Authentication & JWT Token Management Schema
-- ============================================================

USE orh_bestfinds;

-- ============================================================
-- 1. admin_users
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  username        VARCHAR(100) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            ENUM('super_admin','admin','editor') NOT NULL DEFAULT 'admin',
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at   DATETIME(6) NULL,
  last_login_ip   VARCHAR(45) NULL,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until    DATETIME(6) NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id)
);

CREATE INDEX idx_admin_users_active ON admin_users (is_active);

-- ============================================================
-- 2. jwt_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS jwt_tokens (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  admin_user_id   VARCHAR(36)  NOT NULL,
  token_hash      VARCHAR(255) NOT NULL UNIQUE,
  encrypted_token TEXT NULL,
  username        VARCHAR(100) NOT NULL,
  domain          VARCHAR(255) NOT NULL,
  issued_at       DATETIME(6) NOT NULL,
  expiration_at   DATETIME(6) NOT NULL,
  status          ENUM('active','deactivated','expired') NOT NULL DEFAULT 'active',
  last_used_at    DATETIME(6) NULL,
  usage_count     INT NOT NULL DEFAULT 0,
  created_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
  updated_at      DATETIME(6) NOT NULL DEFAULT NOW(6) ON UPDATE NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_jwt_tokens_admin FOREIGN KEY (admin_user_id)
    REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_jwt_tokens_admin ON jwt_tokens (admin_user_id);
CREATE INDEX idx_jwt_tokens_domain ON jwt_tokens (domain);
CREATE INDEX idx_jwt_tokens_status ON jwt_tokens (status);
CREATE INDEX idx_jwt_tokens_expiration ON jwt_tokens (expiration_at);

-- ============================================================
-- 3. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  admin_user_id   VARCHAR(36) NULL,
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       VARCHAR(36) NULL,
  details         JSON NOT NULL DEFAULT ('{}'),
  ip_address      VARCHAR(45) NULL,
  user_agent      VARCHAR(1024) NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_logs_admin FOREIGN KEY (admin_user_id)
    REFERENCES admin_users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_admin ON audit_logs (admin_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ============================================================
-- 4. password_reset_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  admin_user_id   VARCHAR(36) NOT NULL,
  token           VARCHAR(255) NOT NULL UNIQUE,
  expires_at      DATETIME(6) NOT NULL,
  used_at         DATETIME(6) NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT NOW(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_password_reset_admin FOREIGN KEY (admin_user_id)
    REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens (token);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens (expires_at);

-- ============================================================
-- Seed default admin user (password: Admin@123)
-- ============================================================
INSERT IGNORE INTO admin_users (username, email, password_hash, full_name, role)
VALUES (
  'admin',
  'admin@orh.com',
  '$2b$10$B6JSGIB3UVoRHZAbGimon.5R7K6bim3VKbidE3siWtgtU2vZArMlC',
  'System Administrator',
  'super_admin'
);
