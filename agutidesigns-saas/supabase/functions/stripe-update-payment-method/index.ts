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
        JSON.stringify({ error: 'Stripe no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { customerId, paymentMethodId, subscriptionId } = await req.json().catch(() => ({}))
    if (!customerId || !paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'customerId y paymentMethodId requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // 1. Attach payment method to customer (in case it isn't already)
    const attachParams = new URLSearchParams()
    attachParams.append('customer', customerId)

    await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethodId}/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: attachParams.toString(),
    })

    // 2. Set as default payment method on customer
    const customerParams = new URLSearchParams()
    customerParams.append('invoice_settings[default_payment_method]', paymentMethodId)

    const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: customerParams.toString(),
    })
    const custData = await custRes.json()
    if (custData.error) throw new Error(custData.error.message)

    // 3. Also update the subscription's default payment method if provided
    if (subscriptionId) {
      const subParams = new URLSearchParams()
      subParams.append('default_payment_method', paymentMethodId)

      await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: subParams.toString(),
      })
    }

    // 4. Get updated card info to return
    const pmRes = await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethodId}`, {
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    })
    const pmData = await pmRes.json()

    return new Response(
      JSON.stringify({
        success: true,
        card: {
          id: pmData.id,
          brand: pmData.card?.brand || 'unknown',
          last4: pmData.card?.last4 || '****',
          expMonth: pmData.card?.exp_month,
          expYear: pmData.card?.exp_year,
        },
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Update payment method error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
