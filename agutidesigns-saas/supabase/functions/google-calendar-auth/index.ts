import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || ''
    const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-callback`

    if (!GOOGLE_CLIENT_ID) {
      return new Response(JSON.stringify({ error: 'Google Calendar no configurado. Añade GOOGLE_CLIENT_ID en Supabase secrets.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId requerido' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Build Google OAuth URL
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state: userId, // Pass userId in state to recover it in callback
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return new Response(JSON.stringify({ authUrl }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
