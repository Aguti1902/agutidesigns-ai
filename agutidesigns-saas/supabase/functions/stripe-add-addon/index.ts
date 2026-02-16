import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const { data: profile } = await supabase.from('profiles').select('stripe_subscription_id, stripe_customer_id').eq('id', userId).single()
    if (!profile?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'No tienes una suscripción activa. Elige un plan primero.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (action === 'remove') {
      // List subscription items to find the addon
      const listRes = await fetch(`https://api.stripe.com/v1/subscription_items?subscription=${profile.stripe_subscription_id}`, {
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
      })
      const listData = await listRes.json()
      const item = listData.data?.find((si: any) => si.price.id === priceId)
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
      return new Response(JSON.stringify({ success: true, removed: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Add addon as new subscription item
    const params = new URLSearchParams()
    params.append('subscription', profile.stripe_subscription_id)
    params.append('price', priceId)
    params.append('quantity', '1')

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

    return new Response(
      JSON.stringify({ success: true, itemId: data.id }),
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
