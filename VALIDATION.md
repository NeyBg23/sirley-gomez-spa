# Validación · 24 de octubre de 2026

## Compilación y comprobaciones locales

- Node.js 24.22.1; Next.js 16.3.4; `@supabase/supabase-js` 2.118.0; `@supabase/ssr` 0.12.7. Dependencias fijadas en el lockfile.
- TypeScript de Next.js sin errores.
- ESLint sin errores. Se conservan las advertencias informativas sobre imágenes HTML optimizadas previamente.
- `next build` completado: inicio, panel, API, autenticación y tarjetas como rutas dinámicas, con proxy de renovación de sesión.
- `deno check --node-modules-dir=manual` completado para la función Supabase y su esquema compartido.
- Catálogo: precios masculinos de US$100 por sesión, seis gift cards en niveles US$95/130/160, horarios, DST, entradas inválidas e identificadores únicos comprobados.
- Comprobación de origen: alias externo del servidor, origen ajeno, protocolo incorrecto, origen inválido y solicitudes cross-site.

## Supabase real

- API `health`: HTTP 200. Catálogo: HTTP 200, revisión 1, siete tratamientos y seis regalos.
- Dos reservas simultáneas para el mismo horario: una HTTP 201 y otra HTTP 409. La reserva guardada usa US$100 aunque la solicitud intente enviar otro precio. El horario ocupado deja de aparecer en disponibilidad.
- Solicitud de regalo navideño: HTTP 201 y precio de catálogo US$95, sin aceptar el precio enviado por el cliente.
- Domingo sin disponibilidad; hora inválida y honeypot rechazados.
- Panel sin token o con token inválido: HTTP 403. Lectura REST directa de citas con clave publicable: HTTP 401.
- PostgreSQL: la restricción de exclusión impide solapamientos; una cancelación libera el horario; una revisión antigua del catálogo produce conflicto. Esta prueba SQL se revirtió completamente.
- Las cuatro tablas tienen RLS y no conceden acceso a `anon` o `authenticated`; la función de edición solo se puede ejecutar con el rol de servicio.
- Storage: bucket privado, límite 3 MB y formatos JPG/PNG/WebP.

## Web Next.js y API

El servidor de producción local devuelve HTTP 200 para las páginas en español e inglés, con el contenido esperado, y para el formulario de acceso. El panel de datos anónimo devuelve HTTP 403. Las respuestas de administración no se almacenan en caché compartida.

La reserva desde la ruta Next.js se verificó contra la API y PostgreSQL. El control de origen usa el host solicitado por el navegador para admitir alias externos detrás del servidor, y sigue rechazando orígenes ajenos.

Las solicitudes artificiales se identifican como QA y se eliminan tras las comprobaciones. No se envían mensajes, correos ni pagos.

## Avisos y límites de la verificación

En la verificación inicial, antes de crear la cuenta, el asesor de seguridad no encontró advertencias ni errores. Informó cuatro tablas con [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): es intencional, ya que todos los permisos directos de cliente están revocados y el acceso se hace en la API. El asesor de rendimiento informó un [índice aún sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), esperado en una agenda recién creada; se conserva para consultas de agenda.

La cuenta administradora se creó el 25 de octubre de 2026 y se vinculó al panel; está pendiente de confirmar su correo y elegir su contraseña personal. Falta el despliegue en Netlify. Por eso, aún no se han verificado en ese destino el inicio y renovación de sesión con el propietario, las operaciones del panel, la carga de fotos ni la emisión y uso de tarjetas. El navegador remoto no pudo acceder al servidor local; las comprobaciones locales del HTML y la API se hicieron por HTTP. La comprobación visual del despliegue final queda pendiente.

## Preparación de la cuenta · 25 de octubre de 2026

- Cuenta creada mediante la API administrativa de Supabase Auth y vinculada por su identificador real a `admins`. No se han enviado correos ni elegido la contraseña personal de su titular.
- La API ahora exige `email_confirmed_at` además del usuario validado y la asignación de administrador. Las cuentas pendientes de confirmación siguen bloqueadas.
- El control de aprovisionamiento rechazó una credencial de control inválida. Se retiró tras crear la cuenta; su ruta devuelve HTTP 410 y no conserva operaciones de creación. El archivo de control temporal se eliminó.
- Se prepararon las páginas de activación y contraseña, con retorno PKCE y comprobación de rol. El cambio de contraseña requiere una sesión confirmada y autorizada. La comprobación de entrega del correo y la activación por su titular quedan pendientes del dominio y del remitente definitivo.

El asesor de seguridad posterior a la creación de la cuenta informa que está desactivada la [protección contra contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Supabase ofrece esa opción en Pro o superior; no se ha activado un plan de pago. El formulario exige una contraseña personal de al menos 12 caracteres y el servidor mantiene el bloqueo de cuentas sin confirmar.

Prueba HTTP local de activación completada: formulario 200; pantalla de contraseña sin sesión redirige al acceso (307); cambio de contraseña sin sesión 403; correo inválido 400; solicitud cross-site 403; retorno sin credenciales 303 a una ruta interna. Un destino externo en la consulta no produce redirección externa. Estas pruebas no enviaron correos ni cambiaron contraseñas. TypeScript, ESLint, la prueba de origen y la compilación Next.js volvieron a pasar.

## Preparación de Netlify · 25 de octubre de 2026

Se añadió `netlify.toml` para Node.js 24, salida `.next`, compilación pnpm y la elevación de dependencias indicada por Netlify para Next.js mediante `publicHoistPattern` en la configuración pnpm. El adaptador de Next.js se detecta automáticamente. El estado de Netlify CLI indica que aún no hay una cuenta conectada ni un proyecto vinculado. Las carpetas locales de Netlify y los archivos de entorno están excluidos de Git.

La compilación local con Netlify CLI 27.13.0 detectó Next.js Runtime 5.16.3. La compilación Next.js y el empaquetado de la función SSR principal pasaron. El empaquetado Edge no terminó porque se canceló una autorización de red del entorno. Por tanto, no se declara validado el paquete completo de Netlify ni publicado el sitio. La compilación alojada de Netlify y su verificación quedan pendientes de conectar la cuenta.

La instalación con el lockfile y `publicHoistPattern: ['*']` pasó; pnpm confirmó esa configuración. Tras el ajuste volvieron a pasar TypeScript y las comprobaciones de catálogo y origen. Se preparó la autorización oficial de Netlify CLI; no hay proyecto desplegado mientras esa autorización siga pendiente.

## Despliegue alojado en Netlify

Cuenta conectada y equipo NeyBg23 verificado en Free: 300 créditos al mes, sin recarga automática. Se creó el proyecto `sirley-gomez-spa` y se configuraron las tres variables públicas únicamente para producción, en los ámbitos de compilación y funciones. La primera compilación alojada terminó, pero produjo archivos estáticos de Next.js sin funciones ni redirecciones y la raíz devolvió 404. Se añadió explícitamente `@netlify/plugin-nextjs` sin fijar su versión para corregir ese empaquetado. La URL no se presenta como operativa hasta completar las comprobaciones HTTP.

El adaptador declarado para esta compilación es `@netlify/plugin-nextjs` 5.16.2, publicado el 5 de octubre de 2026 y compatible con la política de antigüedad mínima del repositorio. El intento de instalar 5.16.3 se detuvo por esa política; no se modificó la protección.
