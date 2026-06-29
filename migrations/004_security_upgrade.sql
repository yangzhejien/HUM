-- Security upgrade: PBKDF2 password hashing + JWT support
-- Add expires_at to sessions table
ALTER TABLE sessions ADD COLUMN expires_at TEXT NOT NULL DEFAULT '';

-- Update chief editor password to PBKDF2 hash (HUM@Orion_2026!)
UPDATE admins SET password_hash = 'pbkdf2:keK6pptZhDkLyCwGMvQawA==:8hs80QgOu16+chTL/KrO6sEVtRawJe5+QPaM00WacU=', updated_at = datetime('now') WHERE email = 'yangll_0502@qq.com';

-- Update editor password to PBKDF2 hash (123456)
UPDATE admins SET password_hash = 'pbkdf2:gRISKo6mWJ1Dh5QTqqkgcw==:OJ2pryowdMBppRdYLtN3Omgj+ik3QqE88RH4/6VUROg=', updated_at = datetime('now') WHERE email = 'bianwei@hum-journal.org';
