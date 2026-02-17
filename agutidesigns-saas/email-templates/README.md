# Templates de Email de Supabase Auth

Los emails de autenticación (confirmación, reset password, magic link) se configuran en el **Supabase Dashboard**.

## Cómo configurar los templates personalizados:

### Paso 1: Ir a Email Templates
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral: **Authentication → Email Templates**

### Paso 2: Configurar cada template

Verás 4 templates disponibles:
- **Confirm signup** (verificación de email)
- **Magic Link** (acceso sin contraseña)
- **Change Email Address** (cambio de email)
- **Reset Password** (recuperar contraseña)

### Paso 3: Editar "Confirm signup"

1. Haz clic en **"Confirm signup"**
2. Verás 3 campos:
   - **Subject**: Asunto del email
   - **Body (HTML)**: Contenido HTML
   - **Body (Text)**: Versión texto plano

3. Copia el contenido de `supabase-confirm-email.html` y pégalo en **Body (HTML)**

4. En **Subject**, pon:
   ```
   Confirma tu email para Agutidesigns IA
   ```

5. Haz clic en **"Save"** abajo

### Paso 4: Editar "Reset Password"

1. Clic en **"Reset Password"**
2. Copia el contenido de `supabase-reset-password.html` en **Body (HTML)**
3. Subject: `Recuperar contraseña - Agutidesigns IA`
4. Save

### Paso 5: Editar "Magic Link" (opcional)

1. Clic en **"Magic Link"**
2. Copia el contenido de `supabase-magic-link.html` en **Body (HTML)**
3. Subject: `Tu enlace de acceso a Agutidesigns IA`
4. Save

## Variables disponibles en los templates:

Supabase reemplaza automáticamente estas variables:

- `{{ .ConfirmationURL }}` - URL de confirmación con token
- `{{ .Token }}` - Token OTP (6 dígitos)
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio configurada
- `{{ .Email }}` - Email del usuario

## Configurar remitente:

En **Authentication → Settings → SMTP Settings**:

Si usas **Resend** (recomendado):
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Tu `RESEND_API_KEY`
- Sender email: `soporte@agutidesigns.io`
- Sender name: `Agutidesigns IA`

O deja el SMTP por defecto de Supabase (usa su propio servicio).

## Importante:

El dominio `agutidesigns.io` debe estar verificado en Resend para que los emails lleguen correctamente y no vayan a spam.
