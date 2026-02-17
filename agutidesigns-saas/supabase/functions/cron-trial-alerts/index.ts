import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    
    // Find users whose trial expires in 2 days
    const { data: expiringUsers } = await supabase
      .from('profiles')
      .select('id, full_name, trial_ends_at, stripe_customer_id')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', twoDaysFromNow.toISOString())

    let emailsSent = 0
    
    for (const user of (expiringUsers || [])) {
      const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      
      // Get user stats
      const { data: agents } = await supabase.from('agents').select('total_messages').eq('user_id', user.id)
      const totalMessages = (agents || []).reduce((sum, a) => sum + (a.total_messages || 0), 0)
      const { count: leadsCount } = await supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('agent_id', agents?.[0]?.id).eq('is_lead', true)
      
      // Get email from Stripe
      if (user.stripe_customer_id) {
        try {
          const custRes = await fetch(`https://api.stripe.com/v1/customers/${user.stripe_customer_id}`, {
            headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` }
          })
          const custData = await custRes.json()
          if (custData.email) {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
              body: JSON.stringify({
                to: custData.email,
                subject: `⏰ Tu prueba termina en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
                template: 'trial_expiring',
                data: {
                  name: user.full_name || 'ahí',
                  daysLeft,
                  expiryDate: new Date(user.trial_ends_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
                  messagesUsed: totalMessages,
                  leadsGenerated: leadsCount || 0
                }
              })
            })
            emailsSent++
          }
        } catch (e) { console.warn('Email error for user:', user.id, e) }
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent, usersChecked: expiringUsers?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Cron error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
