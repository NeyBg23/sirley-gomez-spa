# Configuración de Vercel y Supabase

## Supabase configurado

Proyecto confirmado: `NeyBg’s Project`, referencia `kckdtjbplkajmzjqazfn`, región `us-west-2`.

- Migración aplicada: `20261024215716_spa_initial_schema.sql`.
- Tablas: `site_content`, `admins`, `appointments`, `gift_orders`.
- Catálogo inicial guardado: 7 tratamientos, 6 experiencias de regalo, revisión 1.
- Restricción PostgreSQL contra reservas superpuestas y control de revisión del catálogo comprobados.
- Función `spa-api` desplegada. Incluye rutas públicas de catálogo, disponibilidad, solicitudes y tarjetas emitidas; cada ruta de administración verifica el JWT con Supabase Auth y el registro de `admins`.
- Bucket `spa-media`: privado; JPG, PNG y WebP; máximo 3 MB.

La función usa las claves del entorno de Supabase, con preferencia por `SUPABASE_SECRET_KEYS` y compatibilidad con la variable integrada de servicio. No se necesita copiar claves privadas a Vercel ni al repositorio. La verificación JWT del gateway está desactivada porque hay reservas anónimas; las rutas administrativas hacen su propia autenticación y autorización en el código.

## Primera cuenta del panel

La cuenta solicitada fue creada el 25 de octubre de 2026 y vinculada a `public.admins`. El correo se conserva en Supabase y no se publica en este repositorio. Sigue pendiente que su titular confirme el correo y configure su contraseña personal. No se ha enviado un correo de activación.

1. Al publicar, configurar en Supabase Auth la URL final del sitio y permitir exactamente su ruta `/auth/callback` como redirección. Revisar el remitente SMTP y la entrega autorizada a la cuenta del spa.
2. La titular abre `/admin/access`, solicita su enlace y lo sigue en el mismo navegador. La ruta de retorno valida la sesión y la autorización antes de mostrar `/admin/password`, donde elige su contraseña de forma privada.
3. Probar inicio de sesión, cierre de sesión, recuperación y renovación de sesión desde `/admin`. El acceso administrativo siempre exige un correo confirmado.

El aprovisionamiento se hizo con la API administrativa de Auth, sin modificar directamente `auth.users`; el mecanismo temporal fue retirado al terminar. No existe alta pública de administradores ni un permiso automático para la primera persona que inicie sesión. Una cuenta autenticada sin registro en `admins` recibe acceso denegado.

## Publicación en Vercel

El repositorio está preparado para importarse como Next.js desde la raíz. La cuenta conectada estaba en Hobby al comprobarla el 24 de octubre de 2026. Para el uso comercial del spa se requiere Pro u otro plan que permita ese uso. No se ha contratado ni activado un plan de pago.

Referencia oficial: [Vercel Hobby y uso no comercial](https://vercel.com/docs/plans/hobby).

Variables de producción:

| Variable | Valor / propósito |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto confirmado |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable activa de ese proyecto |
| `NEXT_PUBLIC_SITE_URL` | Origen final de la web, con HTTPS |

Configurar Node.js 24. La instalación usa el lockfile pnpm; compilación `pnpm build`. Vercel detecta la salida de Next.js automáticamente. No usar una salida estática: agenda, panel y tarjetas requieren ejecución del servidor.

Para pruebas de ramas, usar un Supabase separado y variables de Preview propias, evitando escrituras en la agenda de producción. La URL final y el dominio se configuran al publicar. La versión anterior alojada en Sites conserva su configuración independiente.

## Actualizaciones posteriores

La función usa `supabase/functions/spa-api/index.ts`, su `deno.json` y `lib/content.ts`. Desplegar conjuntamente esas dependencias si cambia la API o el esquema compartido. Las migraciones PostgreSQL se aplican en orden y se conservan en Git. No reemplazar el catálogo guardado al desplegar código nuevo.

Antes de compartir la agenda, revisar las duraciones corporales de 60 minutos asumidas a partir del material y la propuesta de Navidad. Tras publicar, comprobar con la cuenta administradora: confirmar y cancelar una cita, editar y guardar el catálogo, subir una fotografía, emitir una gift card tras el pago, abrir su enlace y registrar su uso.
