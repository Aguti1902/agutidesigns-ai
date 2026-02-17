-- ══════════════════════════════════════════════════════════════
-- Google Calendar Integration
-- ══════════════════════════════════════════════════════════════

-- 1. Tabla para almacenar tokens de Google Calendar
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT,
  calendar_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Añadir campo a agents para habilitar calendario
ALTER TABLE agents ADD COLUMN IF NOT EXISTS calendar_enabled BOOLEAN DEFAULT FALSE;

-- 3. Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_gcal_tokens_user ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_calendar_enabled ON agents(calendar_enabled);
