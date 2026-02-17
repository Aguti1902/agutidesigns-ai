# Configuración de Google OAuth

## Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre: "Agutidesigns IA"

## Paso 2: Habilitar Google+ API

1. En el menú lateral: **APIs & Services → Library**
2. Busca "Google+ API"
3. Haz clic en **"Enable"**

## Paso 3: Crear credenciales OAuth 2.0

1. Ve a **APIs & Services → Credentials**
2. Haz clic en **"Create Credentials"** → **"OAuth client ID"**
3. Selecciona **"Web application"**
4. Nombre: `Agutidesigns IA Auth`

### Configurar URLs autorizadas:

**Authorized JavaScript origins:**
```
https://agutidesigns.io
https://app.agutidesigns.io
https://xzyhrloiwapbrqmglxeo.supabase.co
```

**Authorized redirect URIs:**
```
https://xzyhrloiwapbrqmglxeo.supabase.co/auth/v1/callback
```

5. Haz clic en **"Create"**
6. Copia el **Client ID** y **Client Secret**

## Paso 4: Configurar en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/project/xzyhrloiwapbrqmglxeo/auth/providers)
2. En el menú lateral: **Authentication → Providers**
3. Busca **"Google"** en la lista
4. Haz clic en **"Google"** para expandir
5. Activa el toggle **"Enable Sign in with Google"**
6. Pega:
   - **Client ID**: el que copiaste de Google Cloud
   - **Client Secret**: el que copiaste de Google Cloud
7. Haz clic en **"Save"**

## Paso 5: Probar

1. Ve a `app.agutidesigns.io/auth`
2. Verás el botón **"Continuar con Google"**
3. Al hacer clic:
   - Se abre ventana de Google
   - Seleccionas tu cuenta
   - Aceptas permisos
   - Redirect a `app.agutidesigns.io/email-confirmado`
   - Auto-redirect a `app.agutidesigns.io/app`

## Notas importantes:

- Los usuarios que se registren con Google **NO necesitan confirmar email** (Google ya lo verificó)
- Supabase crea automáticamente el perfil del usuario
- El onboarding se mostrará la primera vez que entren
- Si el dominio no está verificado en Resend, los emails transaccionales aún funcionarán (bienvenida, pagos, etc.)

## Si te da error "redirect_uri_mismatch":

Verifica que en Google Cloud Console, la redirect URI sea exactamente:
```
https://xzyhrloiwapbrqmglxeo.supabase.co/auth/v1/callback
```

Sin espacios ni caracteres extra.
