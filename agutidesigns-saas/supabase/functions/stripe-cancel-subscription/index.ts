import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Plan price IDs (not addons)
const PLAN_PRICE_IDS = new Set([
  'price_1T0RlfC3QI1AmukvNi6TCABc',
  'price_1T0RlgC3QI1Amukv4Pq4kpBh',
  'price_1T0RliC3QI1AmukvBqxU8Qnu',
])

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!STRIPE_KEY || !STRIPE_KEY.startsWith('sk_')) {
      return new Response(JSON.stringify({ error: 'Stripe no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { subscriptionId, reactivate, userId } = await req.json().catch(() => ({}))
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: 'subscriptionId requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const h = { 'Authorization': `Bearer ${STRIPE_KEY}` }

    // ── Reactivate: undo cancellation ──
    if (reactivate) {
      const params = new URLSearchParams()
      params.append('cancel_at_period_end', 'false')
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })
      const data = await res.json()
      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }
      return new Response(JSON.stringify({ success: true, cancelAtPeriodEnd: false }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // ── Cancel: set cancel_at_period_end + remove addon items ──

    // 1. Cancel the subscription at period end
    const cancelParams = new URLSearchParams()
    cancelParams.append('cancel_at_period_end', 'true')
    const cancelRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cancelParams.toString(),
    })
    const cancelData = await cancelRes.json()
    if (cancelData.error) {
      return new Response(JSON.stringify({ error: cancelData.error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // 2. Remove all addon items (anything that's NOT a base plan price)
    const itemsRes = await fetch(`https://api.stripe.com/v1/subscription_items?subscription=${subscriptionId}`, { headers: h })
    const itemsData = await itemsRes.json()
    const addonItems = (itemsData.data || []).filter((si: any) => !PLAN_PRICE_IDS.has(si.price.id))

    for (const item of addonItems) {
      const delParams = new URLSearchParams()
      delParams.append('proration_behavior', 'create_prorations')
      await fetch(`https://api.stripe.com/v1/subscription_items/${item.id}?${delParams.toString()}`, {
        method: 'DELETE', headers: h,
      })
      console.log('Removed addon item:', item.id, item.price.id)
    }

    // 3. Reset extra_messages in profile
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      )
      const { data: profile } = await supabase.from('profiles').select('full_name, stripe_customer_id').eq('id', userId).single()
      await supabase.from('profiles').update({
        extra_messages: 0,
        updated_at: new Date().toISOString(),
      }).eq('id', userId)
      console.log('Reset extra_messages for user:', userId)
      
      // Send cancellation email
      if (profile?.stripe_customer_id) {
        try {
          const custRes = await fetch(`https://api.stripe.com/v1/customers/${profile.stripe_customer_id}`, { headers: h })
          const custData = await custRes.json()
          const accessUntil = new Date(cancelData.current_period_end * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
          
          if (custData.email) {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({
                to: custData.email,
                subject: 'Plan cancelado - Acceso hasta ' + accessUntil,
                template: 'plan_cancelled',
                data: { name: profile?.full_name || 'ahí', accessUntil }
              })
            }).catch(e => console.warn('Email failed:', e))
          }
        } catch (e) { console.warn('Email error:', e) }
      }
    }

    return new Response(
      JSON.stringify({ success: true, cancelAtPeriodEnd: true, addonsRemoved: addonItems.length }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    console.error('Stripe cancel/reactivate error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
