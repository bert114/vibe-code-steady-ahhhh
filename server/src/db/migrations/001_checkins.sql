-- 001: core check-in tables (Phase 2 — Check-In).
-- users is minimal on purpose: real auth lands before the external beta.
-- checkins scale (1-5 mood/energy/drain) follows the TechDesign proposal;
-- ranges are enforced here AND in Zod validation, never trusted from one layer.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mood_score SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score SMALLINT NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  drain_score SMALLINT NOT NULL CHECK (drain_score BETWEEN 1 AND 5),
  emotions TEXT[] NOT NULL DEFAULT '{}',
  context_tags TEXT[] NOT NULL DEFAULT '{}',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checkins_user_occurred_idx
  ON checkins (user_id, occurred_at DESC);
