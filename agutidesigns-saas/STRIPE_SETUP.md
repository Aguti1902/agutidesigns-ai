# Configuración de Stripe para Agutidesigns SaaS

## 1. Variables en el frontend (.env y Vercel)

- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` — ya las tienes.
- Opcional: `VITE_API_URL` = `https://TU_PROYECTO.supabase.co/functions/v1`. Si no la pones, la app usa `VITE_SUPABASE_URL` + `/functions/v1`.

## 2. Secrets en Supabase (Edge Functions)

En **Supabase Dashboard** → **Edge Functions** → **Secrets** (o en cada función), añade:

| Nombre | Valor |
|--------|--------|
| `STRIPE_SECRET_KEY` | Tu clave secreta de Stripe: `sk_test_...` (pruebas) o `sk_live_...` (producción) |
| `STRIPE_WEBHOOK_SECRET` | El *Signing secret* del webhook (empieza por `whsec_...`) |

Sin `STRIPE_SECRET_KEY` el checkout falla con un mensaje claro. Sin `STRIPE_WEBHOOK_SECRET` el webhook sigue funcionando pero no se verifica la firma (menos seguro).

## 3. Productos y precios en Stripe

En **Stripe Dashboard** → **Productos** crea:

- **Suscripciones (mensuales):** por ejemplo Starter 29€, Pro 79€, Business 199€. Copia el **Price ID** (ej. `price_1T0PJrC3QI1Amukvx91hMZHq`) y pégalo en `Billing.jsx` en el array `PLANS` (campo `priceId`).
- **Pagos únicos (packs de mensajes):** productos de pago único con su Price ID y actualiza `MSG_PACKS` en `Billing.jsx` con cada `priceId`.

Si los Price ID del código no coinciden con tu cuenta Stripe, verás un error de Stripe al crear la sesión (por ejemplo “No such price”).

## 4. Webhook en Stripe

1. **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL:**  
   `https://TU_PROYECTO.supabase.co/functions/v1/stripe-webhook`  
   (sustituye `TU_PROYECTO` por tu ref de Supabase, ej. `xzyhrloiwapbrqmglxeo`).
3. **Eventos a escuchar:** marca al menos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Crea el endpoint y copia el **Signing secret** (`whsec_...`). Pégalo en Supabase como secret `STRIPE_WEBHOOK_SECRET`.

## 5. Desplegar las Edge Functions

Asegúrate de tener desplegadas las tres funciones:

- `stripe-checkout`
- `stripe-webhook`
- `stripe-portal`

En Supabase: **Edge Functions** → comprobar que aparecen y que tienen los secrets asignados. Si cambias un secret, redeploy la función para que lo tome.

## 6. Probar

1. En la app, ve a **Suscripción** y elige un plan (usa modo test en Stripe con tarjetas de prueba).
2. Si algo falla, el mensaje de error en pantalla te dirá si es:
   - URL de API no configurada,
   - función no encontrada (404),
   - Stripe no configurado (falta `STRIPE_SECRET_KEY`),
   - o el mensaje que devuelva Stripe (por ejemplo precio inexistente).
3. Tras pagar, Stripe llama a `stripe-webhook` y se actualiza `subscription_status` en la tabla `profiles`. Revisa los logs de la función en Supabase si no se actualiza.

## Resumen de errores habituales

| Síntoma | Qué revisar |
|--------|----------------|
| "No está configurada la URL de la API" | `VITE_SUPABASE_URL` o `VITE_API_URL` en .env y en Vercel |
| "Función stripe-checkout no encontrada" | Edge Function desplegada y nombre exacto `stripe-checkout` |
| "Stripe no configurado" / error 500 en checkout | `STRIPE_SECRET_KEY` en Supabase Edge Function secrets |
| "No such price" o error de Stripe al crear sesión | Price ID en `Billing.jsx` iguales a los de tu Stripe (modo test o live) |
| Pago hecho pero no se activa la suscripción | Webhook URL en Stripe, `STRIPE_WEBHOOK_SECRET` en Supabase, logs de `stripe-webhook` |
