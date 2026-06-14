-- Security migration: rate_limits table for server-side brute-force protection
-- Run with: wrangler d1 execute hum-journal-db --remote --file=./migrations/001_security_fix.sql

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at INTEGER NOT NULL
);

-- Add fingerprint column to articles table (for duplicate submission prevention)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS fingerprint TEXT;
