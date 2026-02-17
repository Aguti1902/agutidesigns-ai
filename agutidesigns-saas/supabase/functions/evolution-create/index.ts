import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' } 
    })
  }

  try {
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://evolution-api-production-a7fc.up.railway.app'
    const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'agutidesigns-evo-2026'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/webhook-messages`

    const { agentId } = await req.json()
    if (!agentId) return new Response(JSON.stringify({ error: 'agentId required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

    const instanceName = `agent-${agentId}`
    console.log('=== Evolution Create ===', instanceName)

    let qrResult = null

    // Step 1: Check if instance exists
    let instanceExists = false
    try {
      const checkRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_KEY }
      })
      const checkData = await checkRes.json()
      const state = checkData?.instance?.state || checkData?.state || ''
      console.log('Instance state:', state, 'status:', checkRes.status)

      if (state === 'open') {
        // Already connected, no QR needed
        console.log('Already connected!')
        if (SUPABASE_KEY) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
          await supabase.from('agents').update({ whatsapp_connected: true, is_active: true }).eq('id', agentId)
        }
        return new Response(
          JSON.stringify({ success: true, instanceName, qrcode: {}, alreadyConnected: true }),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      }
      
      if (checkRes.status === 200) instanceExists = true
    } catch { }

    // Step 2: If instance exists but not connected, try to get QR via connect
    if (instanceExists) {
      try {
        console.log('Instance exists, trying connect for QR...')
        const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
          headers: { 'apikey': EVOLUTION_KEY }
        })
        const connectData = await connectRes.json()
        if (connectData.base64) {
          qrResult = { base64: connectData.base64, code: connectData.code }
          console.log('QR from connect: YES')
        } else {
          // Connect didn't give QR, instance is broken. Delete and recreate.
          console.log('Connect gave no QR, deleting broken instance...')
          try {
            await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
              method: 'DELETE', headers: { 'apikey': EVOLUTION_KEY }
            })
            console.log('Deleted broken instance')
            instanceExists = false
          } catch (e) { console.log('Delete failed:', e) }
        }
      } catch (e) {
        console.log('Connect error:', e)
      }
    }

    // Step 3: Create fresh instance if needed (WITHOUT webhook in body - v2.3.7 crashes with it)
    if (!qrResult && !instanceExists) {
      console.log('Creating fresh instance...')
      const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
        })
      })
      const createData = await createRes.json()
      console.log('Create status:', createRes.status)

      if (createData.qrcode?.base64) {
        qrResult = createData.qrcode
        console.log('QR from create: YES')
      } else if (createData.base64) {
        qrResult = { base64: createData.base64 }
        console.log('QR from create (flat): YES')
      } else {
        console.log('No QR from create, response:', JSON.stringify(createData).substring(0, 200))
      }
    }

    // Step 4: Configure webhook (ensure it's set)
    try {
      await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          enabled: true,
          url: WEBHOOK_URL,
          webhook_by_events: false,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        })
      })
      console.log('Webhook configured:', WEBHOOK_URL)
    } catch (e) { console.log('Webhook set error:', e) }

    // Step 5: Update Supabase
    if (SUPABASE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        await supabase.from('agents').update({ is_active: true }).eq('id', agentId)
      } catch {}
    }

    console.log('Final QR:', qrResult ? 'YES' : 'NO')

    return new Response(
      JSON.stringify({ success: true, instanceName, qrcode: qrResult || {} }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})
