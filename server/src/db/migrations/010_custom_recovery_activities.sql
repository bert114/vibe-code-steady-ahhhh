-- 010: custom recovery activities created by users for future reference.
-- Scoped to user_id, cascaded on account deletion.
-- Additive only: preserves built-in activities while allowing custom activities.

CREATE TABLE IF NOT EXISTS user_recovery_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hint TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_recovery_activities_user_idx
  ON user_recovery_activities (user_id, created_at ASC);

ALTER TABLE recovery_breaks DROP CONSTRAINT IF EXISTS recovery_breaks_activity_check;

ALTER TABLE recovery_breaks ADD CONSTRAINT recovery_breaks_activity_length_check CHECK (length(activity) BETWEEN 1 AND 80);

