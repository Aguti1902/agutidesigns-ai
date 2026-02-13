import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Webhook signing secret for verification (optional but recommended)
    // const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'whsec_Mf0GVlDkWxI1gWGI1lYSX3h0lSKOOAfJ'
    
    const body = await req.json()
    const event = body.type
    const data = body.data?.object

    console.log('Stripe webhook:', event)

    // Checkout completed - subscription created
    if (event === 'checkout.session.completed') {
      const userId = data.client_reference_id || data.metadata?.user_id
      const customerId = data.customer
      const subscriptionId = data.subscription

      if (userId) {
        console.log('Activating subscription for user:', userId)
        await supabase.from('profiles').update({
          subscription_status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
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
