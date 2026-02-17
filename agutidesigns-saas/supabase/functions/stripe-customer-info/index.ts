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

    const h = { 'Authorization': `Bearer ${STRIPE_KEY}` }

    // Fetch payment methods
    const pmRes = await fetch(`https://api.stripe.com/v1/payment_methods?customer=${customerId}&type=card&limit=5`, { headers: h })
    const pmData = await pmRes.json()
    const paymentMethods = (pmData.data || []).map((pm: any) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    }))

    // Fetch ALL invoices with line items expanded
    const [invPaidRes, invOpenRes] = await Promise.all([
      fetch(`https://api.stripe.com/v1/invoices?customer=${customerId}&limit=25&expand[]=data.lines&status=paid`, { headers: h }),
      fetch(`https://api.stripe.com/v1/invoices?customer=${customerId}&limit=10&expand[]=data.lines&status=open`, { headers: h }),
    ])
    const invPaidData = await invPaidRes.json()
    const invOpenData = await invOpenRes.json()
    const allInvoices = [...(invOpenData.data || []), ...(invPaidData.data || [])]

    const invoices = allInvoices.map((inv: any) => {
      const lines = (inv.lines?.data || [])
        .map((line: any) => line.description || line.price?.nickname || '')
        .filter(Boolean)
      const reason = inv.billing_reason
      let description = lines.join(' · ')
      if (!description) {
        if (reason === 'subscription_create') description = 'Alta de suscripción'
        else if (reason === 'subscription_cycle') description = 'Renovación mensual'
        else if (reason === 'subscription_update') description = 'Cambio de plan / Addon'
        else description = 'Factura'
      }
      return {
        id: inv.id,
        number: inv.number,
        amount: inv.status === 'paid' ? inv.amount_paid : inv.amount_due,
        currency: inv.currency,
        date: inv.created,
        pdfUrl: inv.invoice_pdf,
        status: inv.status,
        description,
      }
    })

    // Fetch subscription (active OR with cancel_at_period_end)
    let subscription = null
    // Try active first
    let subRes = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=active`, { headers: h })
    let subData = await subRes.json()
    // If no active, try all statuses (to catch cancelling-at-period-end which is still "active" in Stripe)
    if (!subData.data?.length) {
      subRes = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1`, { headers: h })
      subData = await subRes.json()
    }
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
