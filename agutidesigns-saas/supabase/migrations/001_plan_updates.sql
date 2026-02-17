-- ══════════════════════════════════════════════════════════════
-- Migraciones SQL — Plan Dashboard WhatsApp Inbox + Stripe
-- Ejecutar en Supabase SQL Editor en este orden
-- ══════════════════════════════════════════════════════════════

-- 1. Conversaciones: estado y etiquetas
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active','resolved','referred'));
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Agentes: derivación a humano
ALTER TABLE agents ADD COLUMN IF NOT EXISTS human_handoff_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS human_handoff_number TEXT;

-- 3. Perfiles: límites de mensajes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 500;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extra_messages INTEGER DEFAULT 0;

-- 4. Habilitar realtime en las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
