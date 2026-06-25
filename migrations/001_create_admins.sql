-- Create admins table for account management
CREATE TABLE IF NOT EXISTS admins (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed chief editor account (主编)
INSERT OR IGNORE INTO admins (email, password, role, name, status)
VALUES ('yangll_0502@qq.com', 'HUM@Orion_2026!', 'admin', '主编', 'active');

-- Seed editorial board member account (编委)
INSERT OR IGNORE INTO admins (email, password, role, name, status)
VALUES ('bianwei@hum-journal.org', 'HUM@Editor_2026!', 'editor', '张编委', 'active');
