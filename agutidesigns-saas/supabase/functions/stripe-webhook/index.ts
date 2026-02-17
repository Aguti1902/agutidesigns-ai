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
    const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Map plan price IDs to message limits
    const PLAN_LIMITS: Record<string, number> = {
      'price_1T0RlfC3QI1AmukvNi6TCABc': 500,    // Starter
      'price_1T0RlgC3QI1Amukv4Pq4kpBh': 5000,   // Pro
      'price_1T0RliC3QI1AmukvBqxU8Qnu': 20000,   // Business
    }

    // Helper: get message_limit from a Stripe subscription's items
    async function getMessageLimitFromSubscription(subscriptionId: string): Promise<number | null> {
      if (!STRIPE_KEY || !subscriptionId) return null
      try {
        const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { 'Authorization': `Bearer ${STRIPE_KEY}` },
        })
        const sub = await res.json()
        for (const item of (sub.items?.data || [])) {
          const priceId = item.price?.id
          if (priceId && PLAN_LIMITS[priceId] != null) {
            return PLAN_LIMITS[priceId]
          }
        }
      } catch (err) {
        console.error('Error fetching subscription for limit:', err)
      }
      return null
    }

    // Checkout completed - subscription or one-time payment
    if (event === 'checkout.session.completed') {
      const userId = data.client_reference_id || data.metadata?.user_id
      const customerId = data.customer
      const subscriptionId = data.subscription ?? null

      if (userId && customerId) {
        if (subscriptionId) {
          console.log('Subscription activated for user:', userId)
          const messageLimit = await getMessageLimitFromSubscription(subscriptionId)
          const updates: Record<string, unknown> = {
            subscription_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          }
          if (messageLimit != null) {
            updates.message_limit = messageLimit
            console.log('Setting message_limit:', messageLimit)
          }
          await supabase.from('profiles').update(updates).eq('id', userId)
          
          // Send payment success email
          try {
            const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
            const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
              headers: { 'Authorization': `Bearer ${STRIPE_KEY}` }
            })
            const custData = await custRes.json()
            const userEmail = custData.email || data.customer_email
            
            if (userEmail) {
              await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
                body: JSON.stringify({
                  to: userEmail,
                  subject: '¡Pago recibido! Tu agente IA está activo',
                  template: 'payment_success',
                  data: { 
                    name: profileData?.full_name || 'ahí',
                    amount: messageLimit === 500 ? '29' : messageLimit === 5000 ? '79' : '199',
                    plan: messageLimit === 500 ? 'Starter' : messageLimit === 5000 ? 'Pro' : 'Business',
                  }
                })
              }).catch(e => console.warn('Email failed:', e))
            }
          } catch (e) { console.warn('Email send failed (non-fatal):', e) }
        } else {
          console.log('One-time payment (pack) for user:', userId, '- saving customer_id')
          await supabase.from('profiles').update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
        }
      }
    }

    // Subscription updated (plan change, addon added/removed, cancellation scheduled)
    if (event === 'customer.subscription.updated') {
      const status = data.status // active, past_due, canceled, unpaid
      const customerId = data.customer

      // Find user by stripe_customer_id
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        const mappedStatus = status === 'active' ? 'active' : status === 'canceled' ? 'cancelled' : 'expired'
        console.log('Updating subscription status:', profile.id, mappedStatus)

        const updates: Record<string, unknown> = {
          subscription_status: mappedStatus,
          updated_at: new Date().toISOString(),
        }

        // Check if plan changed and update message_limit
        for (const item of (data.items?.data || [])) {
          const priceId = item.price?.id
          if (priceId && PLAN_LIMITS[priceId] != null) {
            updates.message_limit = PLAN_LIMITS[priceId]
            console.log('Updating message_limit to:', PLAN_LIMITS[priceId])
            break
          }
        }

        await supabase.from('profiles').update(updates).eq('id', profile.id)
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
          extra_messages: 0,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
        // Deactivate all agents
        await supabase.from('agents').update({ is_active: false }).eq('user_id', profile.id)
      }
    }

    // Invoice paid (renewal) - reset message counters for new billing cycle
    if (event === 'invoice.paid') {
      const customerId = data.customer
      const billingReason = data.billing_reason
      const { data: profile } = await supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) {
        console.log('Invoice paid for:', profile.id, 'reason:', billingReason)
        await supabase.from('profiles').update({
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)

        // Reset message counters on subscription renewal (not first payment)
        if (billingReason === 'subscription_cycle' || billingReason === 'subscription_update') {
          console.log('Resetting message counters for user:', profile.id)
          await supabase.from('agents').update({ total_messages: 0 }).eq('user_id', profile.id)
          // Reactivate agents that were deactivated due to limit
          await supabase.from('agents').update({ is_active: true }).eq('user_id', profile.id).eq('whatsapp_connected', true)
        }
      }
    }

    // Payment failed
    if (event === 'invoice.payment_failed') {
      const customerId = data.customer
      const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('stripe_customer_id', customerId).single()
      if (profile) {
        console.log('Payment failed for:', profile.id)
        await supabase.from('profiles').update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
        
        // Send payment failed email
        try {
          const custRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
            headers: { 'Authorization': `Bearer ${STRIPE_KEY}` }
          })
          const custData = await custRes.json()
          if (custData.email) {
            await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
              body: JSON.stringify({
                to: custData.email,
                subject: '❌ Pago rechazado - Actualiza tu tarjeta',
                template: 'payment_failed',
                data: { name: profile.full_name || 'ahí', amount: String(Math.round(data.amount_due / 100)) }
              })
            }).catch(e => console.warn('Email failed:', e))
          }
        } catch (e) { console.warn('Email error:', e) }
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
