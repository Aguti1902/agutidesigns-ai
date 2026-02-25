-- =============================================
-- Presupuestos y Facturas para diseñadores web
-- =============================================

CREATE TABLE IF NOT EXISTS public.presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  numero TEXT NOT NULL,
  cliente_nombre TEXT,
  cliente_email TEXT,
  cliente_empresa TEXT,
  lineas JSONB NOT NULL DEFAULT '[]',
  iva NUMERIC DEFAULT 21,
  descuento NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','aceptado','rechazado')),
  validez_dias INTEGER DEFAULT 30,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  presupuesto_id UUID REFERENCES public.presupuestos(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  cliente_nombre TEXT,
  cliente_email TEXT,
  cliente_empresa TEXT,
  lineas JSONB NOT NULL DEFAULT '[]',
  iva NUMERIC DEFAULT 21,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','vencida')),
  fecha_vencimiento DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users CRUD presupuestos' AND tablename = 'presupuestos') THEN
    CREATE POLICY "Users CRUD presupuestos" ON public.presupuestos FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users CRUD facturas' AND tablename = 'facturas') THEN
    CREATE POLICY "Users CRUD facturas" ON public.facturas FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_presupuestos_user ON public.presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_facturas_user ON public.facturas(user_id);
CREATE INDEX IF NOT EXISTS idx_facturas_presupuesto ON public.facturas(presupuesto_id);
