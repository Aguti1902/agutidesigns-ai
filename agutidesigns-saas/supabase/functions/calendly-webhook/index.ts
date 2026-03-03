import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, calendly-webhook-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('uid')

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing uid' }), { status: 400, headers: corsHeaders })
    }

    const body = await req.json()
    const { event, payload } = body

    console.log('Calendly webhook:', event, 'user:', userId)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    if (event === 'invitee.created') {
      // Parse start/end times from ISO string (preserves timezone offset)
      const startIso: string = payload.scheduled_event?.start_time || payload.event?.start_time || ''
      const endIso: string = payload.scheduled_event?.end_time || payload.event?.end_time || ''

      if (!startIso) {
        return new Response(JSON.stringify({ error: 'No start_time in payload' }), { status: 400, headers: corsHeaders })
      }

      // Extract local date and time directly from ISO string offset
      const startDate = new Date(startIso)
      const endDate = new Date(endIso)

      // Convert to Spain time (Europe/Madrid) for display
      const toMadrid = (d: Date) => {
        return d.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' })
      }
      const startMadrid = toMadrid(startDate) // "2024-03-15 10:00:00"
      const dateStr = startMadrid.substring(0, 10)   // "2024-03-15"
      const startTimeStr = startMadrid.substring(11, 16) // "10:00"
      const endMadrid = toMadrid(endDate)
      const endTimeStr = endMadrid.substring(11, 16)   // "11:00"

      // Extract client data
      const inviteeName: string = payload.invitee?.name || payload.name || 'Desconocido'
      const inviteeEmail: string = payload.invitee?.email || payload.email || ''

      // Try to extract phone from questions
      const questions: Array<{question: string, answer: string}> = payload.questions_and_answers || payload.invitee?.questions_and_answers || []
      const phoneAnswer = questions.find((q) =>
        q.question.toLowerCase().includes('teléfono') ||
        q.question.toLowerCase().includes('telefono') ||
        q.question.toLowerCase().includes('phone') ||
        q.question.toLowerCase().includes('móvil') ||
        q.question.toLowerCase().includes('movil')
      )
      const phone: string = phoneAnswer?.answer || ''

      // Event type name (service)
      const eventTypeName: string = payload.event_type?.name || payload.scheduled_event?.name || 'Reunión Calendly'

      // Meeting location / join URL
      const location = payload.scheduled_event?.location || payload.event?.location || {}
      const joinUrl: string = location.join_url || location.data?.join_url || ''

      const notes = [
        joinUrl ? `Link reunión: ${joinUrl}` : '',
        inviteeEmail ? `Email: ${inviteeEmail}` : '',
        `Fuente: Calendly`,
      ].filter(Boolean).join(' · ')

      const appointment = {
        user_id: userId,
        client_name: inviteeName,
        client_email: inviteeEmail || null,
        client_phone: phone || null,
        service: eventTypeName,
        appointment_date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: 'confirmed',
        created_by: 'calendly',
        notes,
        updated_at: new Date().toISOString(),
      }

      console.log('Inserting appointment:', appointment)
      const { error } = await supabase.from('appointments').insert(appointment)
      if (error) throw new Error(`DB insert error: ${error.message}`)

      // Send appointment notification email to the owner
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId)
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()

        const ownerEmail = user?.email
        if (ownerEmail) {
          const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
          const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

          // Format date nicely: "2024-03-15" → "15 de marzo de 2024"
          const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
          const [y, m, d] = dateStr.split('-').map(Number)
          const dateFormatted = `${d} de ${months[m - 1]} de ${y}`

          await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify({
              to: ownerEmail,
              subject: `📅 Nueva cita: ${inviteeName} – ${dateFormatted} a las ${startTimeStr}`,
              template: 'appointment_booked',
              data: {
                ownerName: profile?.full_name || 'ahí',
                clientName: inviteeName,
                clientEmail: inviteeEmail || null,
                clientPhone: phone || null,
                date: dateFormatted,
                startTime: startTimeStr,
                endTime: endTimeStr,
                service: eventTypeName,
                source: 'Calendly',
              },
            }),
          }).catch(e => console.warn('Appointment email failed:', e))
        }
      } catch (emailErr) {
        console.warn('Email notification error (non-fatal):', emailErr)
      }

    } else if (event === 'invitee.canceled') {
      // Find and cancel the appointment by matching date + time
      const startIso: string = payload.scheduled_event?.start_time || payload.event?.start_time || ''
      if (startIso) {
        const startDate = new Date(startIso)
        const startMadrid = startDate.toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' })
        const dateStr = startMadrid.substring(0, 10)
        const timeStr = startMadrid.substring(11, 16)

        await supabase
          .from('appointments')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('appointment_date', dateStr)
          .eq('start_time', timeStr)
          .eq('created_by', 'calendly')
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Calendly webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
