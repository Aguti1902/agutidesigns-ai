# Implementación de Google Calendar - Pendiente

## Lo que ya está creado:

✅ SQL migration (`003_google_calendar.sql`)  
✅ Página de integración (`CalendarIntegration.jsx`)  
✅ Directorios de las Edge Functions

## Lo que falta:

### 1. Registrar la ruta en App.jsx

```javascript
import CalendarIntegration from './pages/CalendarIntegration';

// En las rutas del dashboard:
<Route path="calendario" element={<CalendarIntegration />} />
```

### 2. Añadir al menú lateral

En `DashboardLayout.jsx`, añadir al array `navItems`:

```javascript
{ to: '/app/calendario', icon: <Calendar size={18} />, label: 'Calendario' },
```

(Importar Calendar de lucide-react)

### 3. Crear las 3 Edge Functions

Debido a la complejidad, te recomiendo usar un template o servicio como:
- **Cal.com API** (más sencillo)
- **Calendly API** (más sencillo)
- O seguir con Google Calendar (más complejo pero más flexible)

#### Si usas Google Calendar directo:

Necesitas implementar en las carpetas creadas:

**`google-calendar-auth/index.ts`**:
- Generar URL de OAuth de Google
- Scope: `https://www.googleapis.com/auth/calendar`
- Redirect a callback

**`google-calendar-callback/index.ts`**:
- Recibir código de Google
- Intercambiar por access_token y refresh_token
- Guardar en `google_calendar_tokens`
- Redirect a `/app/calendario`

**`google-calendar-events/index.ts`**:
- Endpoint GET: listar eventos (próximos 30 días)
- Endpoint POST: crear evento
- Manejar refresh de tokens cuando expiren

### 4. Integrar con la IA

En `webhook-messages/index.ts`, cuando la IA responde, consultar Calendar API si `agent.calendar_enabled === true`:

```typescript
// Añadir al system prompt
if (agent.calendar_enabled) {
  const { data: events } = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-events?userId=${agent.user_id}&action=list`)
  const eventsText = events.map(e => `${e.start} - ${e.summary}`).join('\n')
  systemPrompt += `\n\nCALENDARIO DISPONIBLE:\n${eventsText}\n\nSi el cliente quiere agendar una cita, usa estos huecos y confirma con él.`
}
```

## Alternativa más sencilla (recomendada):

En vez de Google Calendar directo, puedes usar **Cal.com** que tiene una API más sencilla:

1. Crear cuenta en [cal.com](https://cal.com)
2. Obtener API key
3. Usar su API para booking: `https://api.cal.com/v1/bookings`
4. Tu IA llama a la API cuando detecta intención de agendar

## Configuración de Google Calendar OAuth:

Si decides seguir con Google Calendar, necesitas en Google Cloud Console:

1. Habilitar **Google Calendar API** (no Google+ API)
2. Crear OAuth Client ID con estos scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
3. Redirect URI: `https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/google-calendar-callback`

## Resumen:

La estructura está lista. Las funciones de Calendar son complejas porque requieren:
- OAuth flow completo
- Refresh tokens automático
- Manejo de errores de permisos
- Parsing de fechas/horarios
- Integración con el prompt de la IA

Te recomiendo empezar con Cal.com (mucho más sencillo) o si prefieres continuar con Google Calendar, puedo ayudarte a implementar las 3 funciones en la próxima sesión.
