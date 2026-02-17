# Email Triggers - Pendientes de implementar

## Edge Function creada: `send-email`
✅ Desplegada con todos los templates HTML

## Templates disponibles:
1. `welcome` - Bienvenida
2. `payment_success` - Pago realizado
3. `messages_80` - 80% mensajes usados
4. `messages_95` - 95% mensajes usados (crítico)
5. `plan_cancelled` - Plan cancelado
6. `ticket_created` - Ticket creado
7. `ticket_reply` - Respuesta a ticket
8. `trial_expiring` - Trial expirando
9. `agent_connected` - WhatsApp conectado
10. `invoice_generated` - Factura disponible
11. `payment_failed` - Pago rechazado
12. `plan_expired` - Plan expirado

## Triggers a integrar:

### stripe-webhook/index.ts
```typescript
// En checkout.session.completed (línea ~50)
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
  body: JSON.stringify({
    to: userEmail,
    subject: '¡Pago recibido! Tu agente IA está activo',
    template: 'payment_success',
    data: { name: userName, amount: '79', plan: 'Pro', nextBilling: '17 marzo 2026' }
  })
})

// En invoice.payment_failed (línea ~168)
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
  body: JSON.stringify({
    to: userEmail,
    subject: '❌ Pago rechazado - Actualiza tu tarjeta',
    template: 'payment_failed',
    data: { name: userName, amount: '79' }
  })
})
```

### stripe-cancel-subscription/index.ts
```typescript
// Después de cancelar (línea ~70)
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: userEmail,
    subject: 'Plan cancelado - Acceso hasta [fecha]',
    template: 'plan_cancelled',
    data: { name: userName, accessUntil: '17 marzo 2026' }
  })
})
```

### Support.jsx (frontend)
```javascript
// Después de crear ticket (línea ~111)
await fetch(`${API_URL}/send-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: user.email,
    subject: `Ticket #${ticket.id.slice(0,8)} creado`,
    template: 'ticket_created',
    data: { name: profile.full_name, ticketId: ticket.id.slice(0,8), subject: newSubject, message: newMessage }
  })
})
```

### AdminTickets.jsx
```javascript
// Después de responder (línea ~64)
await fetch(`${API_URL}/send-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: userEmail, // Necesitas obtenerlo
    subject: 'Nueva respuesta a tu ticket de soporte',
    template: 'ticket_reply',
    data: { name: userName, ticketId: selectedTicket.id.slice(0,8), replyPreview: replyText.slice(0,150) }
  })
})
```

### webhook-messages/index.ts (Evolution webhook)
```typescript
// Cuando agente se conecta correctamente
await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: userEmail,
    subject: '✅ WhatsApp conectado - Tu agente ya está activo',
    template: 'agent_connected',
    data: { name: userName, phone: '+34 XXX XXX XXX', agentName: 'Mi Agente IA' }
  })
})
```

### Cron job o check periódico (nuevo archivo)
- `trial_expiring`: 2 días antes del trial_ends_at
- `messages_80`: cuando se supera 80% (check al enviar mensaje)
- `messages_95`: cuando se supera 95% (check al enviar mensaje)

## Configuración necesaria en Supabase:
1. Ir a Settings > Edge Functions > Secrets
2. Añadir: `RESEND_API_KEY=re_xxxxx` (obtener de https://resend.com)
3. Configurar dominio en Resend: soporte@agutidesigns.io
