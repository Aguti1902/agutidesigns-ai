# Configuración de Google Calendar API

## Paso 1: Habilitar Calendar API en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto (o usa el mismo de OAuth)
3. Ve a **APIs & Services → Library**
4. Busca **"Google Calendar API"**
5. Haz clic en **"Enable"**

## Paso 2: Configurar OAuth para Calendar

Ve a **APIs & Services → Credentials** → Tu OAuth Client ID existente → Edit

Añade a los **scopes** autorizados:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

Y añade esta redirect URI adicional:
```
https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/google-calendar-callback
```

Save.

## Paso 3: Añadir secrets en Supabase

Ve a **Supabase → Edge Functions → Secrets** y añade (si no existen):

```
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

(Son los mismos del OAuth de login con Google)

## Paso 4: Ejecutar migración SQL

En **Supabase SQL Editor**, ejecuta el contenido de:
```
supabase/migrations/003_google_calendar.sql
```

Esto crea la tabla `google_calendar_tokens` para almacenar access/refresh tokens.

## Paso 5: Usar el Calendar

1. Ve a `/app/calendario` en tu dashboard
2. Haz clic en **"Conectar Google Calendar"**
3. Autoriza el acceso a tu calendario
4. Regresa al dashboard → verás "Calendario conectado"
5. Activa el toggle **"Activar gestión de citas para este agente"**

## Cómo funciona:

### Para la IA:
Cuando un cliente escribe a WhatsApp:
- Si `calendar_enabled = true`, la IA recibe automáticamente la lista de eventos de los próximos 7 días
- La IA puede proponer horarios libres basándose en esos datos
- **Nota**: Por ahora, la IA solo CONSULTA el calendario. Para que CREE citas automáticamente, necesitas añadir function calling de OpenAI (próxima iteración)

### Crear citas manualmente:
Puedes llamar a la API desde cualquier lugar:
```javascript
await fetch(`${API_URL}/google-calendar-events?userId=xxx&action=create`, {
  method: 'POST',
  body: JSON.stringify({
    summary: 'Cita con cliente',
    startTime: '2026-02-20T10:00:00',
    endTime: '2026-02-20T11:00:00',
    description: 'Cliente desde WhatsApp',
  })
})
```

## Próximas mejoras (opcional):

1. **OpenAI Function Calling**: Permitir que la IA cree citas automáticamente
2. **Notificaciones**: Email/WhatsApp antes de cada cita
3. **Múltiples calendarios**: Permitir elegir qué calendario usar
4. **Sincronización bidireccional**: Actualizar cuando cambies eventos en Google

## Tokens y refresh:

Los tokens se refrescan automáticamente cuando expiran (cada hora). El `refresh_token` se almacena de forma segura en Supabase y permite acceso indefinido al calendario.
