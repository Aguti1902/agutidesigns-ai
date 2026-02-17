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
      return new Response(JSON.stringify({ error: 'Stripe no configurado' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { customerId, name, email, phone, address, taxId } = await req.json().catch(() => ({}))
    if (!customerId) {
      return new Response(JSON.stringify({ error: 'customerId requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const h = { 'Authorization': `Bearer ${STRIPE_KEY}` }

    // 1. Update customer info
    const params = new URLSearchParams()
    if (name !== undefined) params.append('name', name)
    if (email !== undefined) params.append('email', email)
    if (phone !== undefined) params.append('phone', phone)
    if (address) {
      if (address.line1 !== undefined) params.append('address[line1]', address.line1)
      if (address.line2 !== undefined) params.append('address[line2]', address.line2)
      if (address.city !== undefined) params.append('address[city]', address.city)
      if (address.state !== undefined) params.append('address[state]', address.state)
      if (address.postalCode !== undefined) params.append('address[postal_code]', address.postalCode)
      if (address.country !== undefined) params.append('address[country]', address.country)
    }

    const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)

    // 2. Handle tax ID (NIF/CIF/VAT)
    if (taxId !== undefined) {
      // Remove existing tax IDs first
      const existingRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}/tax_ids?limit=5`, { headers: h })
      const existingData = await existingRes.json()
      for (const tid of (existingData.data || [])) {
        await fetch(`https://api.stripe.com/v1/customers/${customerId}/tax_ids/${tid.id}`, {
          method: 'DELETE', headers: h,
        })
      }

      // Add new tax ID if not empty
      if (taxId.trim()) {
        const taxParams = new URLSearchParams()
        // Detect type: ES VAT (starts with ES), EU VAT, or generic
        const val = taxId.trim().toUpperCase()
        if (val.startsWith('ES') && val.length >= 10) {
          taxParams.append('type', 'es_cif')
          taxParams.append('value', val)
        } else if (/^[A-Z]{2}\d/.test(val)) {
          taxParams.append('type', 'eu_vat')
          taxParams.append('value', val)
        } else {
          taxParams.append('type', 'es_cif')
          taxParams.append('value', val)
        }

        const taxRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}/tax_ids`, {
          method: 'POST',
          headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: taxParams.toString(),
        })
        const taxResult = await taxRes.json()
        if (taxResult.error) {
          console.warn('Tax ID error (non-fatal):', taxResult.error.message)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    console.error('Update customer error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
