-- Add missing columns to existing admins table (SQLite ALTER requires constant defaults, no CHECK)
ALTER TABLE admins ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE admins ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

-- Remove old unused admin record
DELETE FROM admins WHERE email = 'admin@humjournal.com';

-- Seed chief editor (主编)
INSERT OR REPLACE INTO admins (email, password_hash, role, name, status, created_at, updated_at)
VALUES ('yangll_0502@qq.com', 'HUM@Orion_2026!', 'admin', '主编', 'active', datetime('now'), datetime('now'));

-- Seed editorial board member (编委)
INSERT OR REPLACE INTO admins (email, password_hash, role, name, status, created_at, updated_at)
VALUES ('bianwei@hum-journal.org', 'HUM@Editor_2026!', 'editor', '张编委', 'active', datetime('now'), datetime('now'));
