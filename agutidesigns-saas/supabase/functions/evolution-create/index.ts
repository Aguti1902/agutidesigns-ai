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

    const { agentId } = await req.json()
    if (!agentId) return new Response(JSON.stringify({ error: 'agentId required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

    const instanceName = `agent-${agentId}`
    console.log('Processing:', instanceName)

    let qrResult = null

    // Step 1: Try to connect existing instance (get QR)
    try {
      console.log('Trying to connect existing instance...')
      const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_KEY }
      })
      const connectData = await connectRes.json()
      console.log('Connect response:', connectRes.status, JSON.stringify(connectData).substring(0, 150))
      
      if (connectData.base64) {
        qrResult = { base64: connectData.base64, code: connectData.code }
        console.log('QR from existing instance: YES')
      }
    } catch (connectErr) {
      console.log('Connect failed:', connectErr)
    }

    // Step 2: If no QR from connect, create new instance
    if (!qrResult) {
      console.log('Creating new instance...')
      try {
        const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
          body: JSON.stringify({ instanceName, integration: 'WHATSAPP-BAILEYS', qrcode: true })
        })
        const createData = await createRes.json()
        console.log('Create response:', createRes.status)
        
        if (createData.qrcode?.base64) {
          qrResult = createData.qrcode
          console.log('QR from new instance: YES')
        } else if (createRes.status === 400) {
          // Instance exists but connect didn't return QR, try connect again
          console.log('Instance exists, retrying connect...')
          const retryRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
            headers: { 'apikey': EVOLUTION_KEY }
          })
          const retryData = await retryRes.json()
          if (retryData.base64) {
            qrResult = { base64: retryData.base64, code: retryData.code }
          }
        }
      } catch (createErr) {
        console.error('Create failed:', createErr)
      }
    }

    // Step 3: Update Supabase
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
