-- =============================================
-- Columnas para presupuestos por IA
-- =============================================

ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS irpf NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS cliente_phone TEXT;

-- Bucket de Storage para PDFs de presupuestos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('presupuestos', 'presupuestos', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Políticas del bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Public read presupuestos pdfs'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read presupuestos pdfs"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'presupuestos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Service insert presupuestos pdfs'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Service insert presupuestos pdfs"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'presupuestos');
  END IF;
END $$;
