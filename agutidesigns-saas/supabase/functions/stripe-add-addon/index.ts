import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Map price amounts (cents) to message quantities
const AMOUNT_TO_MESSAGES: Record<number, number> = {
  900: 500, 1500: 1000, 2900: 2500, 4900: 5000, 7900: 10000,
}

/**
 * Given a one-time priceId, find or create a recurring monthly price
 * with the same amount. Uses lookup_key for deduplication.
 */
async function getOrCreateRecurringPrice(
  stripeKey: string,
  oneTimePriceId: string
): Promise<{ recurringPriceId: string; amountCents: number }> {
  // 1. Fetch the one-time price to get amount + currency
  const priceRes = await fetch(`https://api.stripe.com/v1/prices/${oneTimePriceId}`, {
    headers: { 'Authorization': `Bearer ${stripeKey}` },
  })
  const priceData = await priceRes.json()
  if (priceData.error) throw new Error(priceData.error.message)

  const amountCents = priceData.unit_amount
  const currency = priceData.currency || 'eur'
  const lookupKey = `msg_pack_recurring_${amountCents}`

  // 2. Search for existing recurring price with this lookup_key
  const searchRes = await fetch(
    `https://api.stripe.com/v1/prices?lookup_keys[]=${lookupKey}&active=true`,
    { headers: { 'Authorization': `Bearer ${stripeKey}` } }
  )
  const searchData = await searchRes.json()

  if (searchData.data?.length > 0) {
    const existing = searchData.data[0]
    console.log('Found existing recurring price:', existing.id, 'for amount:', amountCents)
    return { recurringPriceId: existing.id, amountCents }
  }

  // 3. No existing price found — create product + recurring price
  const msgs = AMOUNT_TO_MESSAGES[amountCents] || amountCents
  const productParams = new URLSearchParams()
  productParams.append('name', `Pack +${msgs} mensajes/mes`)
  productParams.append('metadata[type]', 'message_pack')
  productParams.append('metadata[messages]', String(msgs))

  const prodRes = await fetch('https://api.stripe.com/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: productParams.toString(),
  })
  const prodData = await prodRes.json()
  if (prodData.error) throw new Error(prodData.error.message)

  // 4. Create the recurring monthly price
  const newPriceParams = new URLSearchParams()
  newPriceParams.append('product', prodData.id)
  newPriceParams.append('unit_amount', String(amountCents))
  newPriceParams.append('currency', currency)
  newPriceParams.append('recurring[interval]', 'month')
  newPriceParams.append('lookup_key', lookupKey)
  newPriceParams.append('transfer_lookup_key', 'true')
  newPriceParams.append('metadata[one_time_price_id]', oneTimePriceId)
  newPriceParams.append('metadata[messages]', String(msgs))

  const newPriceRes = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: newPriceParams.toString(),
  })
  const newPriceData = await newPriceRes.json()
  if (newPriceData.error) throw new Error(newPriceData.error.message)

  console.log('Created recurring price:', newPriceData.id, 'for amount:', amountCents, 'product:', prodData.id)
  return { recurringPriceId: newPriceData.id, amountCents }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!STRIPE_KEY || !STRIPE_KEY.startsWith('sk_')) {
      return new Response(
        JSON.stringify({ error: 'Stripe no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { userId, priceId, action } = await req.json().catch(() => ({}))
    if (!userId || !priceId) {
      return new Response(
        JSON.stringify({ error: 'userId y priceId requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, stripe_customer_id, extra_messages')
      .eq('id', userId)
      .single()

    if (!profile?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No tienes una suscripción activa. Elige un plan primero.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // ── Remove addon ──
    if (action === 'remove') {
      const listRes = await fetch(
        `https://api.stripe.com/v1/subscription_items?subscription=${profile.stripe_subscription_id}`,
        { headers: { 'Authorization': `Bearer ${STRIPE_KEY}` } }
      )
      const listData = await listRes.json()

      // Match by the original one-time priceId stored in metadata, or by recurring priceId
      const item = listData.data?.find((si: any) =>
        si.price.id === priceId || si.price.metadata?.one_time_price_id === priceId
      )
      if (!item) {
        return new Response(
          JSON.stringify({ error: 'Addon no encontrado en tu suscripción' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }

      const delRes = await fetch(`https://api.stripe.com/v1/subscription_items/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
      })
      const delData = await delRes.json()
      if (delData.error) throw new Error(delData.error.message)

      // Subtract messages from extra_messages
      const msgs = Number(item.price.metadata?.messages) || 0
      if (msgs > 0) {
        const currentExtra = profile.extra_messages || 0
        await supabase.from('profiles').update({
          extra_messages: Math.max(0, currentExtra - msgs),
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      }

      return new Response(
        JSON.stringify({ success: true, removed: true }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // ── Add addon ──
    // Convert one-time price to recurring, or reuse existing recurring price
    const { recurringPriceId, amountCents } = await getOrCreateRecurringPrice(STRIPE_KEY, priceId)

    // Add the recurring price as a subscription item
    const params = new URLSearchParams()
    params.append('subscription', profile.stripe_subscription_id)
    params.append('price', recurringPriceId)
    params.append('quantity', '1')
    params.append('proration_behavior', 'create_prorations')

    const res = await fetch('https://api.stripe.com/v1/subscription_items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json()
    console.log('Stripe add-addon:', data.id || 'no id', data.error?.message || 'ok')

    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Determine how many messages to add
    const extraMsgs = AMOUNT_TO_MESSAGES[amountCents] || 500

    // Update extra_messages in profile
    const currentExtra = profile.extra_messages || 0
    await supabase.from('profiles').update({
      extra_messages: currentExtra + extraMsgs,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)
    console.log('Updated extra_messages:', currentExtra, '->', currentExtra + extraMsgs)

    // Reactivate agents if they were deactivated due to limit
    await supabase.from('agents').update({ is_active: true }).eq('user_id', userId).eq('whatsapp_connected', true)

    return new Response(
      JSON.stringify({ success: true, itemId: data.id, extraMessages: extraMsgs }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Stripe add-addon error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
