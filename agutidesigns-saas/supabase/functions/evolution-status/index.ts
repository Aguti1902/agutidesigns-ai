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

    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_KEY }
    })
    const data = await res.json()

    const state = data?.instance?.state || data?.state || 'close'
    const isConnected = state === 'open'

    // Get phone number if connected
    let phoneNumber = null
    if (isConnected) {
      try {
        const infoRes = await fetch(`${EVOLUTION_URL}/instance/fetchInstances?instanceName=${instanceName}`, {
          headers: { 'apikey': EVOLUTION_KEY }
        })
        const infoData = await infoRes.json()
        const inst = Array.isArray(infoData) ? infoData[0] : infoData
        const ownerRaw = inst?.instance?.owner || inst?.instance?.wuid || inst?.instance?.profilePictureUrl || inst?.ownerJid || data?.instance?.ownerJid || ''
        phoneNumber = ownerRaw.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9+]/g, '') || null
        if (phoneNumber && phoneNumber.length < 8) phoneNumber = null
        console.log('Status check - phone:', phoneNumber, 'raw owner:', ownerRaw?.substring(0, 30))
      } catch (e) { console.log('fetchInstances error:', e) }
    }

    // Update Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const updates: any = { whatsapp_connected: isConnected, is_active: isConnected }
    if (phoneNumber) updates.whatsapp_number = phoneNumber

    await supabase.from('agents').update(updates).eq('id', agentId)

    return new Response(
      JSON.stringify({ success: true, connected: isConnected, state }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ success: true, connected: false, state: 'close' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
})
