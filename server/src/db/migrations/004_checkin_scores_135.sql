-- 004: tighten check-in scores to the 3-option set {1, 3, 5}.
-- The 1-5 scale itself is kept so existing history stays valid and the
-- deterministic pattern thresholds (low <= 2, high >= 4) keep classifying
-- correctly. Runs in the runner's per-file transaction: if any legacy rows
-- hold 2 or 4, ADD CONSTRAINT fails loudly and rolls back — hand-fix those
-- rows instead of silently coercing them.

ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_mood_score_check;
ALTER TABLE checkins ADD CONSTRAINT checkins_mood_score_check CHECK (mood_score IN (1, 3, 5));

ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_energy_score_check;
ALTER TABLE checkins ADD CONSTRAINT checkins_energy_score_check CHECK (energy_score IN (1, 3, 5));

ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_drain_score_check;
ALTER TABLE checkins ADD CONSTRAINT checkins_drain_score_check CHECK (drain_score IN (1, 3, 5));
