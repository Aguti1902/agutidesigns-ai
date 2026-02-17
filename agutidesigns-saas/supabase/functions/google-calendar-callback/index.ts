import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || ''
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
    const REDIRECT_URI = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-callback`

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const userId = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(`
        <html><body><script>
          window.opener.postMessage({ error: '${error}' }, '*');
          window.close();
        </script></body></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

    if (!code || !userId) {
      return Response.redirect('https://app.agutidesigns.io/app/calendario?error=missing_params')
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString()
    })

    const tokens = await tokenRes.json()
    if (tokens.error) {
      return Response.redirect(`https://app.agutidesigns.io/app/calendario?error=${tokens.error}`)
    }

    // Get primary calendar info
    const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    })
    const calData = await calRes.json()

    // Save tokens to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000)
    
    await supabase.from('google_calendar_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: expiry.toISOString(),
      calendar_id: calData.id || 'primary',
      calendar_name: calData.summary || 'Calendario principal',
    }, { onConflict: 'user_id' })

    return Response.redirect('https://app.agutidesigns.io/app/calendario?success=true')
  } catch (error) {
    console.error('Callback error:', error)
    return Response.redirect('https://app.agutidesigns.io/app/calendario?error=callback_failed')
  }
})
