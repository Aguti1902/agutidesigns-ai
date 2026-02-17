import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PLAN_PRICE_IDS = new Set([
  'price_1T0RlfC3QI1AmukvNi6TCABc',
  'price_1T0RlgC3QI1Amukv4Pq4kpBh',
  'price_1T0RliC3QI1AmukvBqxU8Qnu',
])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    let { customerId, userId, refundAll } = await req.json().catch(() => ({}))

    // If only userId, look up customerId
    if (!customerId && userId) {
      const { data: p } = await supabase.from('profiles').select('stripe_customer_id').eq('id', userId).single()
      customerId = p?.stripe_customer_id
    }
    // If neither, clean ALL profiles with stripe data
    if (!customerId && !userId) {
      const { data: profiles } = await supabase.from('profiles').select('id, stripe_customer_id, stripe_subscription_id').not('stripe_customer_id', 'is', null)
      if (!profiles?.length) {
        return new Response(JSON.stringify({ error: 'No profiles found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      // Use first profile
      customerId = profiles[0].stripe_customer_id
      userId = profiles[0].id
    }

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'No customerId found' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const h = { 'Authorization': `Bearer ${STRIPE_KEY}` }

    // 1. Find active subscription
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=active`, { headers: h })
    const subData = await subRes.json()
    const sub = subData.data?.[0]
    if (!sub) {
      return new Response(JSON.stringify({ error: 'No active subscription', customerId }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // 2. List all subscription items
    const itemsRes = await fetch(`https://api.stripe.com/v1/subscription_items?subscription=${sub.id}&limit=50`, { headers: h })
    const itemsData = await itemsRes.json()
    const allItems = itemsData.data || []

    // 3. Remove ALL addon items (not base plan)
    const removed: string[] = []
    for (const item of allItems) {
      if (!PLAN_PRICE_IDS.has(item.price.id)) {
        const delRes = await fetch(`https://api.stripe.com/v1/subscription_items/${item.id}`, {
          method: 'DELETE', headers: h,
        })
        const delData = await delRes.json()
        removed.push(`${item.id} price:${item.price.id} qty:${item.quantity} del:${delData.deleted || delData.error?.message || 'ok'}`)
      }
    }

    // 4. Refund invoices
    const refunds: any[] = []
    if (refundAll) {
      const invRes = await fetch(`https://api.stripe.com/v1/invoices?customer=${customerId}&limit=20&status=paid`, { headers: h })
      const invData = await invRes.json()
      for (const inv of (invData.data || [])) {
        // Refund any invoice that is NOT the original subscription creation
        const isOriginal = inv.billing_reason === 'subscription_create'
        if (!isOriginal && inv.charge && inv.amount_paid > 0) {
          const rp = new URLSearchParams()
          rp.append('charge', inv.charge)
          rp.append('reason', 'requested_by_customer')
          const rr = await fetch('https://api.stripe.com/v1/refunds', {
            method: 'POST',
            headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: rp.toString(),
          })
          const rd = await rr.json()
          refunds.push({ invoiceId: inv.id, amount: inv.amount_paid, refundId: rd.id, error: rd.error?.message })
        }
      }
    }

    // 5. Reset extra_messages
    if (userId) {
      await supabase.from('profiles').update({
        extra_messages: 0,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
    }

    return new Response(JSON.stringify({
      success: true,
      customerId,
      subscriptionId: sub.id,
      totalItems: allItems.length,
      removedItems: removed,
      refunds,
    }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
