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

    const { customerId } = await req.json().catch(() => ({}))
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'customerId requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Fetch payment methods
    const pmRes = await fetch(`https://api.stripe.com/v1/payment_methods?customer=${customerId}&type=card&limit=5`, {
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    })
    const pmData = await pmRes.json()

    const paymentMethods = (pmData.data || []).map((pm: any) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    }))

    // Fetch all recent invoices (paid + open) to include subscription + addon charges
    const [invPaidRes, invOpenRes] = await Promise.all([
      fetch(`https://api.stripe.com/v1/invoices?customer=${customerId}&limit=20&status=paid`, {
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
      }),
      fetch(`https://api.stripe.com/v1/invoices?customer=${customerId}&limit=5&status=open`, {
        headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
      }),
    ])
    const invPaidData = await invPaidRes.json()
    const invOpenData = await invOpenRes.json()
    const allInvoices = [...(invOpenData.data || []), ...(invPaidData.data || [])]

    const invoices = allInvoices.map((inv: any) => {
      // Build description from line items
      const lines = (inv.lines?.data || []).map((line: any) => line.description || line.price?.nickname || '').filter(Boolean)
      return {
        id: inv.id,
        number: inv.number,
        amount: inv.status === 'paid' ? inv.amount_paid : inv.amount_due,
        currency: inv.currency,
        date: inv.created,
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
        status: inv.status,
        description: lines.join(', ') || (inv.billing_reason === 'subscription_create' ? 'Suscripción' : inv.billing_reason === 'subscription_cycle' ? 'Renovación' : inv.billing_reason === 'subscription_update' ? 'Actualización de plan' : 'Factura'),
      }
    })

    // Fetch subscription details
    let subscription = null
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=active`, {
      headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
    })
    const subData = await subRes.json()
    if (subData.data?.[0]) {
      const sub = subData.data[0]
      subscription = {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        items: (sub.items?.data || []).map((item: any) => ({
          id: item.id,
          priceId: item.price?.id,
          productName: item.price?.product,
          amount: item.price?.unit_amount,
          interval: item.price?.recurring?.interval,
        })),
      }
    }

    return new Response(
      JSON.stringify({ paymentMethods, invoices, subscription }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Stripe customer-info error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
