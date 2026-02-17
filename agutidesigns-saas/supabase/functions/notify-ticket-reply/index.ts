import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { ticketId, replyPreview } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get ticket with user info
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('id, subject, user_id, profiles!inner(full_name)')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Get user email from auth
    const { data: { user }, error } = await supabase.auth.admin.getUserById(ticket.user_id)
    if (error || !user?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Send email
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        to: user.email,
        subject: `💬 Nueva respuesta a tu ticket de soporte`,
        template: 'ticket_reply',
        data: {
          name: ticket.profiles.full_name || 'ahí',
          ticketId: ticket.id.slice(0, 8),
          replyPreview: replyPreview || 'El equipo ha respondido a tu consulta...'
        }
      })
    })

    return new Response(JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    console.error('Notify error:', error)
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
