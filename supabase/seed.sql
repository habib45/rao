-- supabase/seed.sql
-- Admin user seed for local development.
-- Inserts directly into auth.users — no email confirmation required.
-- Idempotent: ON CONFLICT DO NOTHING on both tables.
--
-- Credentials:
--   Email:    admin@bestfinds.dev
--   Password: admin123

-- ----------------------------------------------------------------
-- 1. Auth user
-- ----------------------------------------------------------------
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',  -- instance_id (local dev default)
  'ad000000-0000-0000-0000-000000000001',  -- fixed UUID for idempotency
  'authenticated',
  'authenticated',
  'admin@bestfinds.dev',
  crypt('admin123', gen_salt('bf')),        -- bcrypt hash; change password after first login
  NOW(),                                   -- email_confirmed_at — skips email verification
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"full_name": "BestFinds Admin"}'::jsonb,
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------
-- 2. Auth identity (links the user to the email provider)
-- ----------------------------------------------------------------
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'ad000000-0000-0000-0000-000000000001',
  'ad000000-0000-0000-0000-000000000001',
  'admin@bestfinds.dev',
  '{"sub": "ad000000-0000-0000-0000-000000000001", "email": "admin@bestfinds.dev"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, provider_id) DO NOTHING;
