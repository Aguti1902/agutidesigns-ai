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
        JSON.stringify({ error: 'Stripe no configurado. Añade STRIPE_SECRET_KEY en Supabase secrets.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { customerId, returnUrl } = await req.json().catch(() => ({}))

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'customerId requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const params = new URLSearchParams()
    params.append('customer', customerId)
    params.append('return_url', returnUrl || 'https://app.agutidesigns.io/app/billing')

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()

    if (session.error) {
      return new Response(
        JSON.stringify({ error: session.error.message || 'Error al crear portal de Stripe' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Stripe portal error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error al crear portal' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
