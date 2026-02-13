# Desplegar Edge Functions desde Supabase Dashboard (SIN CLI)

## Paso 1: Ve a Supabase Dashboard

1. Abre https://supabase.com/dashboard/project/xzyhrloiwapbrqmglxeo
2. En el menú lateral, clic en **"Edge Functions"**

## Paso 2: Crear cada función

Tendrás que crear 4 funciones. Para cada una:

### Función 1: evolution-create

1. Clic en **"Create a new function"**
2. Name: `evolution-create`
3. Copia el código de `supabase/functions/evolution-create/index.ts` y pégalo
4. Clic en **"Deploy function"**

### Función 2: evolution-status

1. Clic en **"Create a new function"**
2. Name: `evolution-status`
3. Copia el código de `supabase/functions/evolution-status/index.ts` y pégalo
4. Clic en **"Deploy function"**

### Función 3: evolution-disconnect

1. Clic en **"Create a new function"**
2. Name: `evolution-disconnect`
3. Copia el código de `supabase/functions/evolution-disconnect/index.ts` y pégalo  
4. Clic en **"Deploy function"**

### Función 4: webhook-messages

1. Clic en **"Create a new function"**
2. Name: `webhook-messages`
3. Copia el código de `supabase/functions/webhook-messages/index.ts` y pégalo
4. **IMPORTANTE**: Antes de deploy, ve a Settings de esta función y desactiva **"Enforce JWT verification"**
5. Clic en **"Deploy function"**

## Paso 3: Configurar Secrets

En Supabase Dashboard > Edge Functions > Configuration > Secrets, añade:

```
EVOLUTION_API_URL = https://evolution-api-production-a7fc.up.railway.app
EVOLUTION_API_KEY = agutidesigns-evo-2026
OPENAI_API_KEY = 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
```

## Paso 4: Probar

Después de desplegar, las funciones estarán en:
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-create
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-status
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-disconnect
- https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/webhook-messages

Prueba:
```bash
curl https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/evolution-status/test
```

Si devuelve algo (aunque sea error), la función está desplegada.
