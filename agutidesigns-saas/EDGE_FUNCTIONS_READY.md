# Edge Functions - Copiar y Pegar

Crea 4 funciones en Supabase > Edge Functions > Deploy a new function.

---

## Función 1: evolution-create

**Function name:** `evolution-create`

**Código:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL')!
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const { agentId } = await req.json()
    if (!agentId) return new Response(JSON.stringify({ error: 'agentId required' }), { status: 400 })

    const instanceName = `agent-${agentId}`
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-messages`

    console.log('Creating instance:', instanceName, 'webhook:', webhookUrl)

    let result
    try {
      const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({ instanceName, qrcode: true, webhook: webhookUrl })
      })
      result = await res.json()
      if (!res.ok && !JSON.stringify(result).includes('already in use')) throw new Error(JSON.stringify(result))
    } catch (e) {
      if (String(e).includes('already in use')) {
        const qrRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
          headers: { 'apikey': EVOLUTION_KEY }
        })
        result = await qrRes.json()
      } else throw e
    }

    try {
      await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          webhook_by_events: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE']
        })
      })
    } catch {}

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await supabase.from('agents').update({ is_active: true }).eq('id', agentId)

    return new Response(
      JSON.stringify({ success: true, instanceName, qrcode: result.qrcode || result }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
```

Clic en **"Deploy function"**

---

## Función 2: evolution-status

**Function name:** `evolution-status`

**Código:** (copia de `supabase/functions/evolution-status/index.ts`)

---

## Función 3: evolution-disconnect

**Function name:** `evolution-disconnect`

**Código:** (copia de `supabase/functions/evolution-disconnect/index.ts`)

---

## Función 4: webhook-messages

**Function name:** `webhook-messages`

**Código:** (copia de `supabase/functions/webhook-messages/index.ts`)

⚠️ **IMPORTANTE**: Después de crear esta función, ve a sus Settings y **desactiva "Enforce JWT verification"** (para que Evolution API pueda llamarla sin auth).

---

## Configurar Secrets

Ve a Edge Functions > Configuration > Add secret:

```
EVOLUTION_API_URL = https://evolution-api-production-a7fc.up.railway.app
EVOLUTION_API_KEY = agutidesigns-evo-2026
OPENAI_API_KEY = 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
```

---

Cuando hayas desplegado las 4 funciones y configurado los secrets, avísame y probamos.
