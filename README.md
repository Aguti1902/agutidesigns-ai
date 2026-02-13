# Agutidesigns - Proyecto Completo

Ecosistema completo de diseño web + IA con tres componentes principales.

## 📦 Proyectos

### 1. Landing Pages (`agutidesigns-web/`)

Landing pages con React + Vite:
- **/** - Landing principal (Hero, Sobre Guti, Servicios, Packs, FAQ)
- **/calculadora** - Calculadora de presupuesto paso a paso con IA
- **/agente-whatsapp** - Landing SaaS del agente WhatsApp IA

**Desplegado en:** https://agutidesigns.io  
**Stack:** React, Framer Motion, OpenAI

### 2. SaaS Dashboard (`agutidesigns-saas/`)

Plataforma SaaS para crear agentes de WhatsApp IA:
- Auth completa (Supabase Auth)
- Trial de 2 días con restricción por teléfono
- Dashboard multi-agente
- Conexión WhatsApp vía QR (Evolution API)
- Prompt builder con IA
- Sistema de tickets de soporte
- Planes y billing

**Stack:** React, Supabase, Evolution API, OpenAI

### 3. Backend API (`agutidesigns-saas/supabase/functions/`)

Edge Functions en Supabase:
- `evolution-create` - Crear instancia WhatsApp
- `evolution-status` - Estado de conexión  
- `evolution-disconnect` - Desconectar
- `webhook-messages` - Recibir mensajes y responder con IA

## 🚀 Despliegue

### Landing Pages

Ya desplegado en Vercel → agutidesigns.io

### SaaS Dashboard

**Frontend:**
1. Subir a Vercel
2. Dominio: app.agutidesigns.io
3. Variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (URL de Edge Functions)

**Backend (Edge Functions):**
1. Ve a Supabase Dashboard > Edge Functions
2. Sigue las instrucciones en `DEPLOY_EDGE_FUNCTIONS.md`
3. Configura secrets (Evolution API URL/Key, OpenAI Key)

**Evolution API:**
- Ya desplegado en Railway
- URL: https://evolution-api-production-a7fc.up.railway.app

## 📝 Base de Datos

Esquema completo en `agutidesigns-saas/src/lib/database.sql`:
- `profiles` - Usuarios con trial/subscription
- `businesses` - Datos de negocios (contexto IA)
- `agents` - Agentes WhatsApp IA
- `conversations` - Conversaciones con clientes
- `messages` - Mensajes guardados
- `tickets` - Sistema de soporte
- `used_trial_phones` - Restricción de trials

## 🔑 Variables de Entorno Necesarias

### Supabase (ya configurado)
```
SUPABASE_URL=https://xzyhrloiwapbrqmglxeo.supabase.co
SUPABASE_ANON_KEY=eyJ... (tienes)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (tienes)
```

### Evolution API (Railway)
```
EVOLUTION_API_URL=https://evolution-api-production-a7fc.up.railway.app
EVOLUTION_API_KEY=agutidesigns-evo-2026
```

### OpenAI
```
OPENAI_API_KEY=sk-proj-fz17... (tienes)
```

## 📚 Próximos Pasos

1. **Desplegar Edge Functions** - Sigue `DEPLOY_EDGE_FUNCTIONS.md`
2. **Probar WhatsApp IA** - Conectar + pedir que te escriban desde otro teléfono
3. **Desplegar SaaS en Vercel** - app.agutidesigns.io
4. **Integrar Stripe** - Pagos reales para suscripciones

## 🐛 Troubleshooting

**WhatsApp no responde:**
- Verifica que Evolution API esté en Railway (estado: running)
- Verifica que las Edge Functions estén desplegadas
- Verifica que el webhook esté configurado en Evolution API
- Prueba desde OTRO teléfono (no el tuyo)

**Trial no funciona:**
- Ejecuta el SQL completo en Supabase
- Verifica que la columna `phone` existe en `profiles`
- Verifica RLS policies

## 👨‍💻 Contacto

Alejandro - Agutidesigns
