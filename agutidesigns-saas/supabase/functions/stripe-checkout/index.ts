import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
        JSON.stringify({ error: 'Stripe no configurado. Añade STRIPE_SECRET_KEY en Supabase > Edge Functions > Secrets.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { priceId, userId, userEmail, returnUrl, mode, embedded } = body

    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Faltan priceId o userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const params = new URLSearchParams()
    params.append('mode', mode === 'payment' ? 'payment' : 'subscription')
    params.append('line_items[0][price]', priceId)
    params.append('line_items[0][quantity]', '1')
    params.append('client_reference_id', userId)
    if (userEmail) params.append('customer_email', userEmail)
    params.append('metadata[user_id]', userId)

    if (embedded) {
      params.append('ui_mode', 'embedded')
      params.append('return_url', returnUrl || 'https://app.agutidesigns.io/app/billing?success=true')
    } else {
      params.append('success_url', returnUrl || 'https://app.agutidesigns.io/app/billing?success=true')
      params.append('cancel_url', 'https://app.agutidesigns.io/app/billing?cancelled=true')
    }

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()
    console.log('Stripe checkout:', session.id || 'no id', embedded ? 'embedded' : 'redirect', session.error?.message || 'ok')

    if (session.error) {
      return new Response(
        JSON.stringify({ error: session.error.message || 'Error de Stripe' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        clientSecret: session.client_secret || null,
        url: session.url || null,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al crear la sesión de pago' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
