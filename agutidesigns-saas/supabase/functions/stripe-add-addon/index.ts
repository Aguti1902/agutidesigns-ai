import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const AMOUNT_TO_MESSAGES: Record<number, number> = {
  900: 500, 1500: 1000, 2900: 2500, 4900: 5000, 7900: 10000,
}

async function getOrCreateRecurringPrice(
  stripeKey: string,
  oneTimePriceId: string
): Promise<{ recurringPriceId: string; amountCents: number }> {
  const priceRes = await fetch(`https://api.stripe.com/v1/prices/${oneTimePriceId}`, {
    headers: { 'Authorization': `Bearer ${stripeKey}` },
  })
  const priceData = await priceRes.json()
  if (priceData.error) throw new Error(priceData.error.message)

  // If the price is already recurring, use it directly
  if (priceData.recurring) {
    return { recurringPriceId: oneTimePriceId, amountCents: priceData.unit_amount }
  }

  const amountCents = priceData.unit_amount
  const currency = priceData.currency || 'eur'
  const lookupKey = `msg_pack_recurring_${amountCents}`

  const searchRes = await fetch(
    `https://api.stripe.com/v1/prices?lookup_keys[]=${lookupKey}&active=true`,
    { headers: { 'Authorization': `Bearer ${stripeKey}` } }
  )
  const searchData = await searchRes.json()

  if (searchData.data?.length > 0) {
    return { recurringPriceId: searchData.data[0].id, amountCents }
  }

  const msgs = AMOUNT_TO_MESSAGES[amountCents] || amountCents
  const productParams = new URLSearchParams()
  productParams.append('name', `Pack +${msgs} mensajes/mes`)
  productParams.append('metadata[type]', 'message_pack')
  productParams.append('metadata[messages]', String(msgs))

  const prodRes = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: productParams.toString(),
  })
  const prodData = await prodRes.json()
  if (prodData.error) throw new Error(prodData.error.message)

  const pp = new URLSearchParams()
  pp.append('product', prodData.id)
  pp.append('unit_amount', String(amountCents))
  pp.append('currency', currency)
  pp.append('recurring[interval]', 'month')
  pp.append('lookup_key', lookupKey)
  pp.append('transfer_lookup_key', 'true')
  pp.append('metadata[one_time_price_id]', oneTimePriceId)
  pp.append('metadata[messages]', String(msgs))

  const newPriceRes = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: pp.toString(),
  })
  const newPriceData = await newPriceRes.json()
  if (newPriceData.error) throw new Error(newPriceData.error.message)

  return { recurringPriceId: newPriceData.id, amountCents }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!STRIPE_KEY || !STRIPE_KEY.startsWith('sk_')) {
      return new Response(JSON.stringify({ error: 'Stripe no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { userId, priceId, action } = await req.json().catch(() => ({}))
    if (!userId || !priceId) {
      return new Response(JSON.stringify({ error: 'userId y priceId requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id, extra_messages')
      .eq('id', userId).single()

    if (!profile?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: 'No tienes una suscripción activa. Elige un plan primero.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const subId = profile.stripe_subscription_id

    // Helper: list current subscription items
    async function listItems() {
      const r = await fetch(`https://api.stripe.com/v1/subscription_items?subscription=${subId}`,
        { headers: { 'Authorization': `Bearer ${STRIPE_KEY}` } })
      const d = await r.json()
      return d.data || []
    }

    // ── Remove addon ──
    if (action === 'remove') {
      const items = await listItems()
      const item = items.find((si: any) =>
        si.price.id === priceId || si.price.metadata?.one_time_price_id === priceId)
      if (!item) {
        return new Response(JSON.stringify({ error: 'Addon no encontrado' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      if (item.quantity > 1) {
        const p = new URLSearchParams()
        p.append('quantity', String(item.quantity - 1))
        await fetch(`https://api.stripe.com/v1/subscription_items/${item.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: p.toString(),
        })
      } else {
        await fetch(`https://api.stripe.com/v1/subscription_items/${item.id}`, {
          method: 'DELETE', headers: { 'Authorization': `Bearer ${STRIPE_KEY}` } })
      }
      const msgs = Number(item.price.metadata?.messages) || 0
      if (msgs > 0) {
        await supabase.from('profiles').update({
          extra_messages: Math.max(0, (profile.extra_messages || 0) - msgs),
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }
      return new Response(JSON.stringify({ success: true, removed: true }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // ── Add addon ──
    const { recurringPriceId, amountCents } = await getOrCreateRecurringPrice(STRIPE_KEY, priceId)

    // Check if this price already exists in the subscription
    const items = await listItems()
    const existing = items.find((si: any) => si.price.id === recurringPriceId)

    let result: any

    if (existing) {
      // Already exists → increment quantity
      const newQty = (existing.quantity || 1) + 1
      const p = new URLSearchParams()
      p.append('quantity', String(newQty))
      p.append('proration_behavior', 'create_prorations')
      const r = await fetch(`https://api.stripe.com/v1/subscription_items/${existing.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: p.toString(),
      })
      result = await r.json()
      console.log('Updated addon qty:', existing.id, '->', newQty)
    } else {
      // New → create subscription item
      const p = new URLSearchParams()
      p.append('subscription', subId)
      p.append('price', recurringPriceId)
      p.append('quantity', '1')
      p.append('proration_behavior', 'create_prorations')
      const r = await fetch('https://api.stripe.com/v1/subscription_items', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: p.toString(),
      })
      result = await r.json()
      console.log('Created addon:', result.id || 'err')
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Create and pay an invoice immediately for the proration
    try {
      const invParams = new URLSearchParams()
      invParams.append('customer', profile.stripe_customer_id)
      invParams.append('subscription', subId)
      invParams.append('auto_advance', 'true')
      const invRes = await fetch('https://api.stripe.com/v1/invoices', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: invParams.toString(),
      })
      const invData = await invRes.json()
      if (invData.id && !invData.error) {
        // Finalize and pay
        await fetch(`https://api.stripe.com/v1/invoices/${invData.id}/finalize`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
        })
        await fetch(`https://api.stripe.com/v1/invoices/${invData.id}/pay`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
        })
        console.log('Created & paid proration invoice:', invData.id)
      }
    } catch (invErr) {
      console.warn('Could not create immediate invoice (non-fatal):', invErr)
    }

    const extraMsgs = AMOUNT_TO_MESSAGES[amountCents] || 500
    await supabase.from('profiles').update({
      extra_messages: (profile.extra_messages || 0) + extraMsgs,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    await supabase.from('agents').update({ is_active: true })
      .eq('user_id', userId).eq('whatsapp_connected', true)

    return new Response(
      JSON.stringify({ success: true, itemId: result.id, extraMessages: extraMsgs }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    console.error('Stripe add-addon error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
