# Migrar Stripe de Test a Producción

## Paso 1: Activar tu cuenta de Stripe

1. Ve a [https://dashboard.stripe.com/account/onboarding](https://dashboard.stripe.com/account/onboarding)
2. Completa la verificación de tu negocio:
   - Información legal de tu empresa
   - Datos bancarios para recibir pagos
   - Verificación de identidad
3. Una vez verificado, podrás usar el modo Live

## Paso 2: Obtener API Keys de producción

1. Ve a [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. **Activa el toggle "View test data" a OFF** (modo producción)
3. Copia:
   - **Publishable key** (empieza por `pk_live_`)
   - **Secret key** (empieza por `sk_live_`) → Click "Reveal live key"

## Paso 3: Crear productos en producción

Ve a [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products) (asegúrate de estar en modo Live, NO Test)

### Crear Plan Starter

1. Click **"Add product"**
2. Name: `Agutidesigns IA — Starter`
3. Description: `1 agente IA con 500 mensajes/mes`
4. Pricing:
   - **Recurring**: Monthly
   - **Price**: `29 EUR`
5. Save
6. **Copia el Price ID** (empieza por `price_`)

### Crear Plan Pro

1. Add product
2. Name: `Agutidesigns IA — Pro`
3. Description: `3 agentes IA con 5.000 mensajes/mes`
4. Pricing:
   - **Recurring**: Monthly
   - **Price**: `79 EUR`
5. Save
6. **Copia el Price ID**

### Crear Plan Business

1. Add product
2. Name: `Agutidesigns IA — Business`
3. Description: `Agentes ilimitados con 20.000 mensajes/mes`
4. Pricing:
   - **Recurring**: Monthly
   - **Price**: `199 EUR`
5. Save
6. **Copia el Price ID**

### Crear Packs de mensajes (5 productos)

Para cada pack, crea un producto **Recurring Monthly**:

1. **Pack +500 mensajes**
   - Price: `9 EUR` / month
   - Copia Price ID

2. **Pack +1.000 mensajes**
   - Price: `15 EUR` / month
   - Copia Price ID

3. **Pack +2.500 mensajes**
   - Price: `29 EUR` / month
   - Copia Price ID

4. **Pack +5.000 mensajes**
   - Price: `49 EUR` / month
   - Copia Price ID

5. **Pack +10.000 mensajes**
   - Price: `79 EUR` / month
   - Copia Price ID

**IMPORTANTE**: Todos deben ser **recurring/monthly**, no one-time.

## Paso 4: Actualizar Supabase Secrets

Ve a **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

Actualiza:
```
STRIPE_SECRET_KEY=sk_live_XXXXXXX
```

(Reemplaza el `sk_test_` por el `sk_live_`)

## Paso 5: Actualizar frontend .env

Edita `agutidesigns-saas/.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXX
```

(Reemplaza el `pk_test_` por el `pk_live_`)

## Paso 6: Actualizar Price IDs en el código

Necesitas actualizar los Price IDs en **4 archivos** con los IDs de producción que copiaste:

### 1. `src/pages/Billing.jsx` (líneas 16-35)
```javascript
const PLANS = [
  { id: 'starter', name: 'Starter', price: '29', priceId: 'price_STARTER_PROD_AQUI', ... },
  { id: 'pro', name: 'Pro', price: '79', priceId: 'price_PRO_PROD_AQUI', ... },
  { id: 'business', name: 'Business', price: '199', priceId: 'price_BUSINESS_PROD_AQUI', ... },
];
```

### 2. `src/pages/Checkout.jsx` (líneas 15-37 y 40-46)
Mismos Price IDs de planes + packs de mensajes

### 3. `src/pages/Messages.jsx` (líneas 16-22)
Price IDs de los 5 packs de mensajes

### 4. `supabase/functions/stripe-webhook/index.ts` (líneas 45-49)
```typescript
const PLAN_LIMITS: Record<string, number> = {
  'price_STARTER_PROD_AQUI': 500,
  'price_PRO_PROD_AQUI': 5000,
  'price_BUSINESS_PROD_AQUI': 20000,
}
```

Y también en `stripe-cancel-subscription/index.ts` (líneas 12-16)

## Paso 7: Configurar webhook en Stripe

1. Ve a [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) (modo Live)
2. Click **"Add endpoint"**
3. Endpoint URL:
   ```
   https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1/stripe-webhook
   ```
4. Description: `Agutidesigns IA - Production Webhook`
5. Events to send: Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Add endpoint
7. **Copia el Signing secret** (empieza por `whsec_`)
8. Ve a Supabase Edge Functions Secrets y añade:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_XXXXX
   ```

## Paso 8: Desplegar cambios

```bash
cd agutidesigns-saas
npm run build
# Deploy a Vercel/hosting
```

Y redesplega las edge functions si cambiaste los price IDs:
```bash
supabase functions deploy stripe-webhook --no-verify-jwt --project-ref xzyhrloiwapbrqmglxeo
supabase functions deploy stripe-cancel-subscription --no-verify-jwt --project-ref xzyhrloiwapbrqmglxeo
```

## Paso 9: Probar en producción

1. Crea una cuenta de prueba con un email real
2. Completa el onboarding
3. Ve a Billing y suscríbete al plan Starter (29€)
4. Usa tarjeta de prueba de Stripe: `4242 4242 4242 4242` (aún funciona en live)
5. Verifica que:
   - El webhook actualiza el perfil correctamente
   - El email de confirmación llega
   - El dashboard muestra el plan activo

## Notas importantes:

- **Guarda los Price IDs de test** antes de cambiarlos (por si necesitas volver a test)
- **Los pagos reales** se procesarán y llegarán a tu cuenta bancaria (menos comisión de Stripe)
- **Emails de producción** irán a emails reales (asegúrate de que Resend esté configurado)
- **No hay marcha atrás fácil**: una vez en producción, deberás gestionar suscripciones reales

## Modo Test vs Live:

En Stripe Dashboard, siempre verifica el toggle arriba a la derecha:
- 🟠 **Test mode** → Datos de prueba
- 🔴 **Live mode** → Producción real

Trabaja en Test hasta estar 100% seguro de que todo funciona.
