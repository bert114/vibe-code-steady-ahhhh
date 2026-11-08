-- 009: optional recovery breaks offered when a user is drained.
-- Fixed activity vocabulary (no free text) so nothing sensitive is stored.
-- outcome stays NULL until the user answers "Did that help?".
-- Additive only: no existing table is altered.

CREATE TABLE IF NOT EXISTS recovery_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
  trigger_reason TEXT NOT NULL CHECK (trigger_reason IN ('latest_checkin', 'drain_pattern')),
  activity TEXT NOT NULL CHECK (activity IN ('breathe', 'walk', 'stretch', 'water', 'music', 'quiet')),
  duration_minutes SMALLINT NOT NULL CHECK (duration_minutes IN (5, 10, 15)),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  outcome TEXT CHECK (outcome IN ('helped', 'a_little', 'not_really', 'skipped')),
  answered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS recovery_breaks_user_started_idx
  ON recovery_breaks (user_id, started_at DESC);

