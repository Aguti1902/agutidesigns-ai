import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

async function refreshTokenIfNeeded(supabase: any, userId: string, tokenData: any) {
  const now = new Date()
  const expiry = new Date(tokenData.token_expiry)
  
  // If token expires in less than 5 minutes, refresh it
  if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || ''
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
    
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }).toString()
    })
    
    const newTokens = await refreshRes.json()
    if (newTokens.access_token) {
      const newExpiry = new Date(Date.now() + (newTokens.expires_in || 3600) * 1000)
      await supabase.from('google_calendar_tokens').update({
        access_token: newTokens.access_token,
        token_expiry: newExpiry.toISOString(),
      }).eq('user_id', userId)
      
      return newTokens.access_token
    }
  }
  
  return tokenData.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const url = new URL(req.url)
    const userId = url.searchParams.get('userId')
    const action = url.searchParams.get('action') || 'list'

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Get tokens
    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Calendar not connected' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const accessToken = await refreshTokenIfNeeded(supabase, userId, tokenData)

    // List events (next 7 days)
    if (action === 'list') {
      const now = new Date()
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${tokenData.calendar_id}/events?` +
        `timeMin=${now.toISOString()}&timeMax=${weekLater.toISOString()}&` +
        `singleEvents=true&orderBy=startTime&maxResults=50`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      )
      const eventsData = await eventsRes.json()

      const events = (eventsData.items || []).map((e: any) => ({
        id: e.id,
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        description: e.description,
      }))

      return new Response(JSON.stringify({ events }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Create event
    if (action === 'create' && req.method === 'POST') {
      const body = await req.json()
      const { summary, description, startTime, endTime, attendeeEmail, attendeeName } = body

      if (!summary || !startTime || !endTime) {
        return new Response(JSON.stringify({ error: 'summary, startTime, endTime required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      const event = {
        summary,
        description: description || '',
        start: { dateTime: startTime, timeZone: 'Europe/Madrid' },
        end: { dateTime: endTime, timeZone: 'Europe/Madrid' },
        attendees: attendeeEmail ? [{ email: attendeeEmail, displayName: attendeeName }] : [],
      }

      const createRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${tokenData.calendar_id}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        }
      )

      const created = await createRes.json()
      if (created.error) {
        return new Response(JSON.stringify({ error: created.error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
      }

      return new Response(JSON.stringify({ success: true, eventId: created.id, eventUrl: created.htmlLink }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    console.error('Calendar error:', error)
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
