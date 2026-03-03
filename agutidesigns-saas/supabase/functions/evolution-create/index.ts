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

    const body = await req.json()
    const { agentId, number } = body
    if (!agentId) return new Response(JSON.stringify({ error: 'agentId required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

    const instanceName = `agent-${agentId}`
    const usePairingCode = !!number
    console.log('=== Evolution Create ===', instanceName, usePairingCode ? `(pairing: ${number})` : '(QR)')

    let qrResult = null
    let pairingCode = null

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

    const cleanNumber = number ? number.replace(/[^0-9]/g, '') : ''

    // Step 2: If instance exists but not connected, try to reconnect
    if (instanceExists) {
      try {
        console.log('Instance exists, trying connect...', usePairingCode ? `pairing: ${cleanNumber}` : 'QR')
        if (usePairingCode) {
          // Try pairing code endpoint
          const pairRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
            body: JSON.stringify({ number: cleanNumber })
          })
          const pairData = await pairRes.json()
          console.log('Pairing connect response:', pairRes.status, JSON.stringify(pairData).substring(0, 200))
          if (pairData.pairingCode) {
            pairingCode = pairData.pairingCode
            console.log('Pairing code:', pairingCode)
          } else {
            // Instance exists but can't get pairing code → delete and recreate with pairingCodeEnabled
            console.log('No pairing code, deleting to recreate with pairingCodeEnabled...')
            await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
              method: 'DELETE', headers: { 'apikey': EVOLUTION_KEY }
            }).catch(() => {})
            instanceExists = false
          }
        } else {
          const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
            headers: { 'apikey': EVOLUTION_KEY }
          })
          const connectData = await connectRes.json()
          console.log('QR connect response:', connectRes.status)
          if (connectData.base64) {
            qrResult = { base64: connectData.base64, code: connectData.code }
            console.log('QR from connect: YES')
          } else {
            console.log('No QR from connect, deleting broken instance...')
            await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
              method: 'DELETE', headers: { 'apikey': EVOLUTION_KEY }
            }).catch(() => {})
            instanceExists = false
          }
        }
      } catch (e) {
        console.log('Connect error:', e)
        instanceExists = false
      }
    }

    // Step 3: Create fresh instance if needed
    if (!qrResult && !pairingCode && !instanceExists) {
      console.log('Creating fresh instance... usePairingCode:', usePairingCode, 'number:', cleanNumber)
      const createBody: any = {
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: !usePairingCode,
        pairingCodeEnabled: usePairingCode,
      }
      if (usePairingCode && cleanNumber) createBody.number = cleanNumber

      const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify(createBody)
      })
      const createData = await createRes.json()
      console.log('Create status:', createRes.status, JSON.stringify(createData).substring(0, 300))

      if (usePairingCode && createData.pairingCode) {
        pairingCode = createData.pairingCode
        console.log('Pairing code from create:', pairingCode)
      } else if (createData.qrcode?.base64) {
        qrResult = createData.qrcode
        console.log('QR from create: YES')
      } else if (createData.base64) {
        qrResult = { base64: createData.base64 }
        console.log('QR from create (flat): YES')
      } else {
        console.log('No QR/pairing from create. Trying connect endpoint...')
        // Fallback: try /instance/connect after creation
        if (usePairingCode && cleanNumber) {
          await new Promise(r => setTimeout(r, 1500)) // small wait for instance to init
          try {
            const pairRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
              body: JSON.stringify({ number: cleanNumber })
            })
            const pairData = await pairRes.json()
            console.log('Pairing fallback status:', pairRes.status, JSON.stringify(pairData).substring(0, 200))
            if (pairData.pairingCode) {
              pairingCode = pairData.pairingCode
              console.log('Pairing code (fallback):', pairingCode)
            }
          } catch (e) { console.log('Pairing fallback error:', e) }
        } else if (!usePairingCode) {
          // QR fallback via connect
          try {
            const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
              headers: { 'apikey': EVOLUTION_KEY }
            })
            const connectData = await connectRes.json()
            if (connectData.base64) qrResult = { base64: connectData.base64 }
          } catch (e) { console.log('QR fallback error:', e) }
        }
      }
    }

    // Step 4: Configure webhook (ensure it's set)
    try {
      await fetch(`${EVOLUTION_URL}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: WEBHOOK_URL,
            byEvents: false,
            base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
          }
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

    console.log('Final:', qrResult ? 'QR' : pairingCode ? `Pairing: ${pairingCode}` : 'NONE')

    return new Response(
      JSON.stringify({ success: true, instanceName, qrcode: qrResult || {}, pairingCode: pairingCode || null }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})
