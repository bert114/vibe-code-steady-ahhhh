-- 003: Clerk identity mapping (Phase 5 — production auth).
-- Clerk subject IDs (user_xxx) are not UUIDs, so they cannot be the users.id
-- primary key. This mapping preserves every existing UUID-scoped query:
-- resolve clerk_sub -> internal user_id once per session, then scope by it.
-- Existing tables are untouched. Deleting a user cascades here too.

CREATE TABLE IF NOT EXISTS auth_identities (
  clerk_sub TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_identities_user_idx
  ON auth_identities (user_id);
