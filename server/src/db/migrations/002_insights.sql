-- 002: AI analysis storage (Phase 4 — AI Insights).
-- analysis_runs holds run METADATA only — never raw prompts, notes, or
-- full model output. insights holds the validated, user-facing result.
-- reminders created alongside insights link back via insight_id.

CREATE TABLE IF NOT EXISTS analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  input_checkin_count INTEGER NOT NULL DEFAULT 0,
  latest_checkin_at TIMESTAMPTZ,
  provider TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  error_code TEXT
);

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL DEFAULT 'general'
    CHECK (insight_type IN ('pattern', 'burnout', 'boundary', 'general')),
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  evidence JSONB NOT NULL DEFAULT '[]',
  confidence TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),
  suggestions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_runs_user_started_idx
  ON analysis_runs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS insights_user_created_idx
  ON insights (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reminders_user_created_idx
  ON reminders (user_id, created_at DESC);
