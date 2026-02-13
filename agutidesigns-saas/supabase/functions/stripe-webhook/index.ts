import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

async function verifyStripeSignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) return false
  const parts = signature.split(',').reduce((acc, p) => {
    const [k, v] = p.split('=')
    if (k && v) acc[k] = v
    return acc
  }, {} as Record<string, string>)
  const t = parts['t']
  const v1 = parts['v1']
  if (!t || !v1) return false
  const payload = t + '.' + rawBody
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === v1
}

serve(async (req) => {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('Stripe-Signature')
    const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

    if (WEBHOOK_SECRET && !(await verifyStripeSignature(rawBody, signature, WEBHOOK_SECRET))) {
      console.error('Stripe webhook signature verification failed')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    if (!WEBHOOK_SECRET) console.warn('STRIPE_WEBHOOK_SECRET not set - webhook not verified')

    const body = JSON.parse(rawBody)
    const event = body.type
    const data = body.data?.object

    console.log('Stripe webhook:', event)

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Checkout completed - subscription or one-time payment
    if (event === 'checkout.session.completed') {
      const userId = data.client_reference_id || data.metadata?.user_id
      const customerId = data.customer
      const subscriptionId = data.subscription ?? null

      if (userId && customerId) {
        if (subscriptionId) {
          console.log('Subscription activated for user:', userId)
          await supabase.from('profiles').update({
            subscription_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
        } else {
          console.log('One-time payment (pack) for user:', userId, '- saving customer_id')
          await supabase.from('profiles').update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
        }
      }
    }

    // Subscription updated
    if (event === 'customer.subscription.updated') {
      const status = data.status // active, past_due, canceled, unpaid
      const customerId = data.customer

      // Find user by stripe_customer_id
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        const mappedStatus = status === 'active' ? 'active' : status === 'canceled' ? 'cancelled' : 'expired'
        console.log('Updating subscription status:', profile.id, mappedStatus)
        await supabase.from('profiles').update({
          subscription_status: mappedStatus,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
      }
    }

    // Subscription deleted/cancelled
    if (event === 'customer.subscription.deleted') {
      const customerId = data.customer
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        console.log('Subscription cancelled for:', profile.id)
        await supabase.from('profiles').update({
          subscription_status: 'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
      }
    }

    // Invoice paid (renewal)
    if (event === 'invoice.paid') {
      const customerId = data.customer
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        console.log('Invoice paid, keeping active:', profile.id)
        await supabase.from('profiles').update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
      }
    }

    // Payment failed
    if (event === 'invoice.payment_failed') {
      const customerId = data.customer
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        console.log('Payment failed for:', profile.id)
        await supabase.from('profiles').update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
