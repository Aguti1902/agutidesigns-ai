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
      console.error('STRIPE_SECRET_KEY missing or invalid in Supabase Edge Function secrets')
      return new Response(
        JSON.stringify({ error: 'Stripe no configurado. Añade STRIPE_SECRET_KEY en Supabase > Edge Functions > Secrets.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { priceId, userId, userEmail, successUrl, cancelUrl, mode } = body

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
    params.append('success_url', successUrl || 'https://app.agutidesigns.io/app/billing?success=true')
    params.append('cancel_url', cancelUrl || 'https://app.agutidesigns.io/app/billing?cancelled=true')
    params.append('client_reference_id', userId)
    if (userEmail) params.append('customer_email', userEmail)
    params.append('metadata[user_id]', userId)

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()
    console.log('Stripe checkout:', session.id || 'no id', session.url ? 'URL ok' : 'no URL', session.error?.message || '')

    if (session.error) {
      const msg = session.error.message || 'Stripe rechazó la solicitud. Comprueba que los priceId existan en tu cuenta Stripe (modo test o live).'
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
    if (!session.url) {
      return new Response(
        JSON.stringify({ error: 'Stripe no devolvió URL de pago. Revisa el producto y precio en el Dashboard de Stripe.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
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
