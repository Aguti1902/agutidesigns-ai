import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } })
  }

  try {
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    const { priceId, userId, userEmail, successUrl, cancelUrl, mode } = await req.json()

    if (!priceId || !userId) {
      return new Response(JSON.stringify({ error: 'priceId and userId required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    // Create Stripe Checkout Session
    const params = new URLSearchParams()
    params.append('mode', mode || 'subscription')
    params.append('line_items[0][price]', priceId)
    params.append('line_items[0][quantity]', '1')
    params.append('success_url', successUrl || 'http://localhost:4000/app/billing?success=true')
    params.append('cancel_url', cancelUrl || 'http://localhost:4000/app/billing?cancelled=true')
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
    console.log('Checkout session:', session.id, session.url ? 'URL OK' : 'NO URL')

    if (session.error) throw new Error(session.error.message)

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})
