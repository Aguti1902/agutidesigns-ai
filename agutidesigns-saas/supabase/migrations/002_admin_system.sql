-- ══════════════════════════════════════════════════════════════
-- Admin System - Dashboard de administración y métricas
-- ══════════════════════════════════════════════════════════════

-- 1. Añadir campo role a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. Crear índice para búsquedas rápidas de admins
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Mejorar tabla de tickets con estado admin
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS admin_last_viewed_at TIMESTAMPTZ;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 4. Crear tabla de admin actions log (opcional - para auditoría)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar realtime en tickets
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
