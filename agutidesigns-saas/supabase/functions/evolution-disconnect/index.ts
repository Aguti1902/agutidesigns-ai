import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL')!
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } })
  }

  try {
    const url = new URL(req.url)
    const agentId = url.pathname.split('/').pop()
    if (!agentId) return new Response(JSON.stringify({ error: 'agentId required' }), { status: 400 })

    const instanceName = `agent-${agentId}`

    // Try logout, fallback to delete
    try {
      await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': EVOLUTION_KEY }
      })
    } catch {
      try {
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
          method: 'DELETE',
          headers: { 'apikey': EVOLUTION_KEY }
        })
      } catch {}
    }

    // Update Supabase
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await supabase.from('agents').update({
      whatsapp_connected: false,
      is_active: false,
      whatsapp_number: null
    }).eq('id', agentId)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
