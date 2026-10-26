-- 005: User roles for RBAC.
-- Adds role column to users defaulting to 'user'.
-- Check constraint enforces valid roles ('user', 'admin').

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);
