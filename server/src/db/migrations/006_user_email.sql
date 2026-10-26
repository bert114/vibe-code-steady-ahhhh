-- 006: Store the current primary email synced from Clerk.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
