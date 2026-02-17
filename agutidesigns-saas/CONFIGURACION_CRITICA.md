# ⚠️ Configuración Crítica de Supabase

## IMPORTANTE: Site URL

Ve a **Supabase Dashboard → Project Settings → General**

Y configura **EXACTAMENTE** así:

```
Site URL: https://app.agutidesigns.io/app
```

**❌ NO pongas**: `https://app.agutidesigns.io/email-confirmado`

### ¿Por qué?

La página `/email-confirmado` es una página **intermedia** que solo debe aparecer cuando un usuario hace clic en el link del email de confirmación manual.

Si el Site URL es `/email-confirmado`, Supabase redirigirá allí en TODOS los casos (incluido OAuth con Google), lo cual es incorrecto.

### Flujo correcto:

| Acción | Redirect de Supabase | Resultado |
|--------|---------------------|-----------|
| **Google OAuth** | `redirectTo: /app` (especificado en código) | Va directo a `/app` → onboarding si es nuevo |
| **Confirmar email manual** | Link del email tiene `?type=signup&token=xxx` | `/app?type=signup&token=xxx` → EmailConfirmed detecta params → muestra página → countdown → `/app` |
| **Después de onboarding** | Ninguno (navegación interna) | Permanece en `/app` |

### Código que lo maneja:

`EmailConfirmed.jsx` comprueba los query params:
- Si NO hay `type` o `token` en la URL → redirect inmediato a `/app` (caso OAuth o navegación directa)
- Si SÍ hay `type=signup` y `token=xxx` → muestra página de éxito con countdown

## Redirect URLs

En **Redirect URLs**, añade ambos dominios con comodín:

```
https://agutidesigns.io/**
https://app.agutidesigns.io/**
```

Esto permite que Supabase redirija a cualquier página dentro de estos dominios.

## Resumen:

✅ Site URL: `https://app.agutidesigns.io/app`  
✅ Redirect URLs: incluir ambos dominios con `/**`  
❌ NO configurar Site URL como `/email-confirmado`
