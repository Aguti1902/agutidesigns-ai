-- ═══════════════════════════════════════════════
-- 007 — Sistema de mensajes, cuotas y compras
-- ═══════════════════════════════════════════════

-- ── 1. Añadir campos de cuota a profiles ──────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial'
    CHECK (plan IN ('trial', 'pro', 'agency')),
  ADD COLUMN IF NOT EXISTS message_quota_monthly INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS message_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quota_reset_at TIMESTAMPTZ;

-- Renombrar message_limit -> message_quota_monthly (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='message_limit') THEN
    UPDATE profiles SET message_quota_monthly = message_limit WHERE message_limit IS NOT NULL;
  END IF;
END $$;

-- Migrar extra_messages -> message_credits (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='extra_messages') THEN
    UPDATE profiles SET message_credits = extra_messages WHERE extra_messages IS NOT NULL;
  END IF;
END $$;

-- Inicializar quota_reset_at para usuarios existentes
UPDATE profiles
SET quota_reset_at = date_trunc('month', NOW()) + interval '1 month'
WHERE quota_reset_at IS NULL;

-- ── 2. Tabla message_usage (log por mensaje) ──────────────────
CREATE TABLE IF NOT EXISTS message_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id UUID,
  direction       TEXT DEFAULT 'out' CHECK (direction IN ('in', 'out')),
  tokens_in       INTEGER DEFAULT 0,
  tokens_out      INTEGER DEFAULT 0,
  cost_credits    INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_usage_user ON message_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_usage_agent ON message_usage(agent_id, created_at DESC);

-- ── 3. Tabla message_purchases (historial de compras de packs) ─
CREATE TABLE IF NOT EXISTS message_purchases (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id                  TEXT NOT NULL,
  pack_name                TEXT,
  credits_added            INTEGER NOT NULL,
  price_eur                NUMERIC(10,2),
  stripe_payment_intent_id TEXT,
  stripe_checkout_session  TEXT,
  status                   TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_purchases_user ON message_purchases(user_id, created_at DESC);

-- ── 4. RPC consume_message — atómica, evita race conditions ───
CREATE OR REPLACE FUNCTION consume_message(p_user_id UUID, p_agent_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile       profiles%ROWTYPE;
  v_used          INTEGER;
  v_available     INTEGER;
  v_from_credits  BOOLEAN := FALSE;
BEGIN
  -- Lock row para evitar race conditions
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- Reiniciar cuota si es nuevo mes
  IF v_profile.quota_reset_at IS NOT NULL AND NOW() >= v_profile.quota_reset_at THEN
    UPDATE profiles SET
      quota_reset_at = date_trunc('month', NOW()) + interval '1 month',
      updated_at = NOW()
    WHERE id = p_user_id;
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  END IF;

  -- Calcular mensajes usados este mes
  SELECT COUNT(*) INTO v_used
  FROM message_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', NOW());

  v_available := COALESCE(v_profile.message_quota_monthly, 500) + COALESCE(v_profile.message_credits, 0) - v_used;

  -- Sin cuota disponible
  IF v_available <= 0 THEN
    RETURN json_build_object('allowed', FALSE, 'reason', 'quota_exceeded', 'used', v_used, 'available', 0);
  END IF;

  -- Si la cuota mensual está agotada pero hay créditos, descontamos crédito
  IF v_used >= COALESCE(v_profile.message_quota_monthly, 500) AND COALESCE(v_profile.message_credits, 0) > 0 THEN
    UPDATE profiles SET message_credits = message_credits - 1 WHERE id = p_user_id;
    v_from_credits := TRUE;
  END IF;

  -- Registrar consumo
  INSERT INTO message_usage (user_id, agent_id, direction, cost_credits)
  VALUES (p_user_id, p_agent_id, 'out', 1);

  RETURN json_build_object(
    'allowed', TRUE,
    'used', v_used + 1,
    'available', v_available - 1,
    'from_credits', v_from_credits
  );
END;
$$;

-- ── 5. RPC add_message_credits — al completar compra ──────────
CREATE OR REPLACE FUNCTION add_message_credits(p_user_id UUID, p_credits INTEGER, p_purchase_id UUID DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET message_credits = COALESCE(message_credits, 0) + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id;

  IF p_purchase_id IS NOT NULL THEN
    UPDATE message_purchases SET status = 'completed' WHERE id = p_purchase_id;
  END IF;
END;
$$;

-- ── 6. RLS ────────────────────────────────────────────────────
ALTER TABLE message_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage" ON message_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own purchases" ON message_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert usage" ON message_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can insert purchases" ON message_purchases
  FOR INSERT WITH CHECK (true);
