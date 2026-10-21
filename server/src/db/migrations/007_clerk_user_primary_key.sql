-- 007: Use Clerk's string subject as the user primary key.
-- Neon is a new, empty user database, so no UUID-to-Clerk data mapping is needed.
-- Keep UUID primary keys on domain records; only user ownership keys become TEXT.

ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT;
ALTER TABLE users ALTER COLUMN clerk_id TYPE TEXT USING clerk_id::text;

ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_user_id_fkey;
ALTER TABLE analysis_runs DROP CONSTRAINT IF EXISTS analysis_runs_user_id_fkey;
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_user_id_fkey;
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
ALTER TABLE auth_identities DROP CONSTRAINT IF EXISTS auth_identities_user_id_fkey;
-- These older Neon tables are not part of the current app migrations, but
-- may reference the same user key. IF EXISTS keeps clean installs portable.
ALTER TABLE IF EXISTS daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey;
ALTER TABLE IF EXISTS weekly_summaries DROP CONSTRAINT IF EXISTS weekly_summaries_user_id_fkey;
ALTER TABLE IF EXISTS coping_activities DROP CONSTRAINT IF EXISTS coping_activities_user_id_fkey;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ALTER COLUMN clerk_id SET NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS id;
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (clerk_id);

ALTER TABLE checkins ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE analysis_runs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE insights ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE reminders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE auth_identities ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE IF EXISTS daily_logs ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE IF EXISTS weekly_summaries ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE IF EXISTS coping_activities ALTER COLUMN user_id TYPE TEXT USING user_id::text;

ALTER TABLE checkins
  ADD CONSTRAINT checkins_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE analysis_runs
  ADD CONSTRAINT analysis_runs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE insights
  ADD CONSTRAINT insights_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE reminders
  ADD CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE auth_identities
  ADD CONSTRAINT auth_identities_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS daily_logs
  ADD CONSTRAINT daily_logs_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS weekly_summaries
  ADD CONSTRAINT weekly_summaries_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS coping_activities
  ADD CONSTRAINT coping_activities_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users(clerk_id) ON DELETE CASCADE;
