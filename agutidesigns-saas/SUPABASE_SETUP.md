# Desplegar Edge Functions en Supabase

## 1. Instalar Supabase CLI

```bash
brew install supabase/tap/supabase
```

## 2. Login en Supabase

```bash
supabase login
```

## 3. Link con tu proyecto

```bash
cd agutidesigns-saas
supabase link --project-ref xzyhrloiwapbrqmglxeo
```

## 4. Configurar secrets (variables de entorno)

```bash
supabase secrets set EVOLUTION_API_URL=https://evolution-api-production-a7fc.up.railway.app
supabase secrets set EVOLUTION_API_KEY=agutidesigns-evo-2026
supabase secrets set OPENAI_API_KEY=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
```

## 5. Desplegar las funciones

```bash
supabase functions deploy evolution-create
supabase functions deploy evolution-status  
supabase functions deploy evolution-disconnect
supabase functions deploy webhook-messages --no-verify-jwt
```

Nota: `webhook-messages` usa `--no-verify-jwt` porque Evolution API la llama sin auth.

## 6. Verificar

Las funciones estarán en:
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-create
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-status
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-disconnect
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/webhook-messages
