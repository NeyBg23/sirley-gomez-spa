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

1. Configurado y comprobado el 26 de octubre de 2026: Site URL `https://sirley-gomez-spa.netlify.app` y una única redirección permitida, `https://sirley-gomez-spa.netlify.app/auth/callback`. Ambos valores persisten al volver a cargar la configuración.
2. SMTP de Gmail guardado y comprobado el 26 de octubre de 2026: `smtp.gmail.com`, puerto `587`, con la cuenta de envío autorizada como usuario y remitente y el nombre comercial. En una página nueva, una vez cargada la configuración, el interruptor está activado, se confirma que existe una contraseña almacenada y no hay cambios pendientes. La titular del Gmail creó e introdujo la contraseña de aplicación de forma privada; no se leyó ni se guardó ninguna credencial en Git. La cuenta de envío es independiente de la cuenta administradora del panel y no concede acceso a este. Referencia de [contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833?hl=es).

   La recepción real sigue pendiente de prueba. El dashboard advierte que Gmail está diseñado para correo personal y que la entrega transaccional puede verse afectada.
3. Las plantillas `supabase/templates/invite.html` y `recovery.html` usan un enlace al retorno del sitio con `token_hash` y el tipo `invite` o `recovery`. El servidor valida el enlace, confirma el rol y dirige a `/admin/password`. Esto permite abrirlo en el dispositivo de la titular sin depender del navegador que pidió el mensaje. Las plantillas no contienen direcciones privadas ni tokens reales.
4. Tras autorizar el envío, invitar desde Supabase Auth al mismo correo de la cuenta ya registrada y aún sin confirmar. La invitación debe conservar su identidad y asignación en `admins`; comprobarlo después del envío. La titular sigue el enlace y elige su contraseña de forma privada. Para recuperaciones posteriores se usa `/admin/access`.
5. Probar inicio de sesión, cierre de sesión, recuperación y renovación de sesión desde `/admin`. El acceso administrativo siempre exige un correo confirmado.

El aprovisionamiento se hizo con la API administrativa de Auth, sin modificar directamente `auth.users`; el mecanismo temporal fue retirado al terminar. No existe alta pública de administradores ni un permiso automático para la primera persona que inicie sesión. Una cuenta autenticada sin registro en `admins` recibe acceso denegado.

## Publicación en Netlify Free

El proyecto `sirley-gomez-spa` pertenece al equipo `NeyBg23` y usa Netlify Free, con Supabase para la base de datos, Auth y Storage. Su dirección de producción es `https://sirley-gomez-spa.netlify.app`. El proyecto de Netlify permite acceso público; los datos y operaciones de administración siguen protegidos por la aplicación.

El plan Free de Netlify cuesta US$0 y tiene 300 créditos al mes con límite fijo y sin recarga automática. La operación debe mantenerse dentro de ese cupo; no es capacidad ilimitada. No se necesita contratar un plan de pago para publicar esta versión dentro del cupo gratuito.

Referencias oficiales: [uso comercial en Free](https://www.netlify.com/guides/netlify-vs-vercel/) y [límites y créditos de Free](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).

La configuración `netlify.toml` define Node.js 24, compilación `pnpm build` y salida `.next`. `pnpm-workspace.yaml` mantiene `publicHoistPattern` con `*`, equivalente a la elevación pública de dependencias que requiere Netlify y compatible con la configuración de pnpm 11. `netlify.toml` habilita explícitamente `@netlify/plugin-nextjs` para que los despliegues desde archivos fuente generen las funciones SSR y las rutas. El adaptador está declarado en las dependencias de desarrollo y en el lockfile para que la compilación desde un archivo fuente incluya su instalación. Se actualiza junto con las comprobaciones de despliegue. No usar una salida estática: agenda, panel y tarjetas requieren ejecución del servidor.

Variables de producción:

| Variable | Valor / propósito |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto confirmado |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable activa de ese proyecto |
| `NEXT_PUBLIC_SITE_URL` | Origen final de la web, con HTTPS |

Estas tres variables están guardadas en el proyecto de Netlify para el contexto de producción y se verificaron mediante lectura posterior. Se usan todos los ámbitos predeterminados del plan Free; la selección de ámbitos individuales requiere Pro. Son configuración pública. No incluir claves de servicio de Supabase en Netlify ni en el repositorio. El origen definitivo y su retorno exacto ya están configurados en Supabase Auth. Verificar la entrega del correo antes de activar la cuenta administradora.

Para pruebas de ramas, usar un Supabase separado y variables de Preview propias, evitando escrituras en la agenda de producción. La versión anterior alojada en Sites conserva su configuración independiente.

La publicación utiliza la API oficial de compilación alojada a partir de un ZIP del código fuente del repositorio. El archivo incluye `netlify.toml`, el lockfile y los recursos públicos; excluye archivos de entorno, sesiones, dependencias instaladas y metadatos locales. Netlify instala las dependencias y genera las funciones de Next.js en su infraestructura. La autorización de Netlify CLI se conserva fuera del repositorio.

Este proyecto todavía no tiene despliegue automático conectado a GitHub: subir un commit por sí solo no publica la web. Las actualizaciones se publican mediante una nueva compilación del archivo fuente revisado. Se puede conectar posteriormente la integración oficial de GitHub si se autoriza.

## Actualizaciones posteriores

La función usa `supabase/functions/spa-api/index.ts`, su `deno.json` y `lib/content.ts`. Desplegar conjuntamente esas dependencias si cambia la API o el esquema compartido. Las migraciones PostgreSQL se aplican en orden y se conservan en Git. No reemplazar el catálogo guardado al desplegar código nuevo.

Antes de compartir la agenda, revisar las duraciones corporales de 60 minutos asumidas a partir del material y la propuesta de Navidad. Tras publicar, comprobar con la cuenta administradora: confirmar y cancelar una cita, editar y guardar el catálogo, subir una fotografía, emitir una gift card tras el pago, abrir su enlace y registrar su uso.
