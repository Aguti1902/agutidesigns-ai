# Configuración de Dominios

## Arquitectura de dominios:

- **`agutidesigns.io`** → Landing page + Registro/Login
- **`app.agutidesigns.io`** → Dashboards de usuario y admin (requiere login)

## Configuración en Vercel:

### Paso 1: Añadir ambos dominios al proyecto

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Domains
3. Añade:
   - `agutidesigns.io`
   - `app.agutidesigns.io`
4. Vercel te dará registros DNS para configurar

### Paso 2: Configurar DNS

En tu proveedor de DNS (Cloudflare, GoDaddy, etc.):

```
Tipo: A
Nombre: @ (o agutidesigns.io)
Valor: 76.76.21.21 (o el IP que te de Vercel)

Tipo: CNAME
Nombre: app
Valor: cname.vercel-dns.com (o el que te de Vercel)
```

### Paso 3: Configurar Supabase

En **Project Settings → General**:

```
Site URL: https://app.agutidesigns.io/email-confirmado
```

En **Redirect URLs** (añadir ambos):
```
https://agutidesigns.io/**
https://app.agutidesigns.io/**
```

## Flujo de usuario:

### Registro:
1. `agutidesigns.io` → ve landing
2. Click "Probar gratis" → auto-redirect a `app.agutidesigns.io/auth`
3. Se registra → recibe email
4. Confirma email → redirect a `app.agutidesigns.io/email-confirmado`
5. Auto-redirect (3s) → `app.agutidesigns.io/app`

### Login existente:
1. `app.agutidesigns.io/auth` → login
2. Success → redirect a `app.agutidesigns.io/app`

### Acceso directo:
- Usuario logueado va a `agutidesigns.io` → auto-redirect a `app.agutidesigns.io/app`
- Usuario NO logueado va a `app.agutidesigns.io` (raíz) → redirect a `app.agutidesigns.io/auth`
- Usuario NO logueado va a `agutidesigns.io/auth` → redirect a `app.agutidesigns.io/auth`

## Localhost:

En desarrollo (`localhost:5173`), ambos dominios funcionan sin restricciones para facilitar el testing.

## Variables de entorno:

Ya no es necesario cambiar `.env` - los dominios se detectan automáticamente con `window.location.hostname`.
