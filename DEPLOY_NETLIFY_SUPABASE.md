# Configuración de Netlify Free y Supabase

## Supabase configurado

Proyecto confirmado: `NeyBg’s Project`, referencia `kckdtjbplkajmzjqazfn`, región `us-west-2`.

- Migración aplicada: `20261024215716_spa_initial_schema.sql`.
- Tablas: `site_content`, `admins`, `appointments`, `gift_orders`.
- Catálogo inicial guardado: 7 tratamientos, 6 experiencias de regalo, revisión 1.
- Restricción PostgreSQL contra reservas superpuestas y control de revisión del catálogo comprobados.
- Función `spa-api` desplegada. Incluye rutas públicas de catálogo, disponibilidad, solicitudes y tarjetas emitidas; cada ruta de administración verifica el JWT con Supabase Auth y el registro de `admins`.
- Bucket `spa-media`: privado; JPG, PNG y WebP; máximo 3 MB.

La función usa las claves del entorno de Supabase, con preferencia por `SUPABASE_SECRET_KEYS` y compatibilidad con la variable integrada de servicio. No se necesita copiar claves privadas a Netlify ni al repositorio. La verificación JWT del gateway está desactivada porque hay reservas anónimas; las rutas administrativas hacen su propia autenticación y autorización en el código.

## Primera cuenta del panel

La cuenta solicitada fue creada el 25 de octubre de 2026 y vinculada a `public.admins`. El correo se conserva en Supabase y no se publica en este repositorio. Sigue pendiente que su titular confirme el correo y configure su contraseña personal. No se ha enviado un correo de activación.

1. Al publicar, configurar en Supabase Auth la URL final del sitio y permitir exactamente su ruta `/auth/callback` como redirección. Revisar el remitente SMTP y la entrega autorizada a la cuenta del spa.
2. La titular abre `/admin/access`, solicita su enlace y lo sigue en el mismo navegador. La ruta de retorno valida la sesión y la autorización antes de mostrar `/admin/password`, donde elige su contraseña de forma privada.
3. Probar inicio de sesión, cierre de sesión, recuperación y renovación de sesión desde `/admin`. El acceso administrativo siempre exige un correo confirmado.

El aprovisionamiento se hizo con la API administrativa de Auth, sin modificar directamente `auth.users`; el mecanismo temporal fue retirado al terminar. No existe alta pública de administradores ni un permiso automático para la primera persona que inicie sesión. Una cuenta autenticada sin registro en `admins` recibe acceso denegado.

## Publicación en Netlify Free

El repositorio está preparado para importarse como Next.js desde la raíz. Se eligió Netlify Free para alojar el sitio comercial, conservando Supabase para la base de datos, Auth y Storage.

El plan Free de Netlify cuesta US$0 y tiene 300 créditos al mes con límite fijo y sin recarga automática. La operación debe mantenerse dentro de ese cupo; no es capacidad ilimitada. No se necesita contratar un plan de pago para publicar esta versión dentro del cupo gratuito.

Referencias oficiales: [uso comercial en Free](https://www.netlify.com/guides/netlify-vs-vercel/) y [límites y créditos de Free](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).

La configuración `netlify.toml` define Node.js 24, compilación `pnpm build` y salida `.next`. `pnpm-workspace.yaml` mantiene `publicHoistPattern` con `*`, equivalente a la elevación pública de dependencias que requiere Netlify y compatible con la configuración de pnpm 11. `netlify.toml` habilita explícitamente `@netlify/plugin-nextjs` para que los despliegues desde archivos fuente generen las funciones SSR y las rutas. El adaptador está declarado en las dependencias de desarrollo y en el lockfile para que la compilación desde un archivo fuente incluya su instalación. Se actualiza junto con las comprobaciones de despliegue. No usar una salida estática: agenda, panel y tarjetas requieren ejecución del servidor.

Variables de producción:

| Variable | Valor / propósito |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto confirmado |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable activa de ese proyecto |
| `NEXT_PUBLIC_SITE_URL` | Origen final de la web, con HTTPS |

Estas variables son configuración pública. No incluir claves de servicio de Supabase en Netlify ni en el repositorio. En Supabase Auth se debe establecer el origen definitivo y autorizar exactamente `/auth/callback` como retorno. Verificar la entrega del correo antes de activar la cuenta administradora.

Para pruebas de ramas, usar un Supabase separado y variables de Preview propias, evitando escrituras en la agenda de producción. La versión anterior alojada en Sites conserva su configuración independiente.

Un despliegue anónimo de Netlify, si se utiliza para validar, dura una hora y debe reclamarse con una cuenta de Netlify para conservarlo. Su enlace de reclamación y las credenciales locales nunca se publican en Git. Un despliegue de prueba no se presenta como permanente hasta vincularlo a la cuenta propietaria.

## Actualizaciones posteriores

La función usa `supabase/functions/spa-api/index.ts`, su `deno.json` y `lib/content.ts`. Desplegar conjuntamente esas dependencias si cambia la API o el esquema compartido. Las migraciones PostgreSQL se aplican en orden y se conservan en Git. No reemplazar el catálogo guardado al desplegar código nuevo.

Antes de compartir la agenda, revisar las duraciones corporales de 60 minutos asumidas a partir del material y la propuesta de Navidad. Tras publicar, comprobar con la cuenta administradora: confirmar y cancelar una cita, editar y guardar el catálogo, subir una fotografía, emitir una gift card tras el pago, abrir su enlace y registrar su uso.
