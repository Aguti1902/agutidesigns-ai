import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://evolution-api-production-a7fc.up.railway.app'
    const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'agutidesigns-evo-2026'

    const { agentId, phone, text } = await req.json()
    if (!agentId || !phone || !text) {
      return new Response(JSON.stringify({ error: 'Missing agentId, phone or text' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    const instanceName = `agent-${agentId}`
    const cleanPhone = phone.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
      body: JSON.stringify({ number: `${cleanPhone}@s.whatsapp.net`, text }),
    })

    const data = await res.json().catch(() => ({}))
    return new Response(JSON.stringify({ ok: res.ok, data }), {
      status: res.ok ? 200 : 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }
})
