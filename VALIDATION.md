# Validación · 25 de octubre de 2026

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

La cuenta administradora se creó el 25 de octubre de 2026 y se vinculó al panel; está pendiente de confirmar su correo y elegir su contraseña personal. Aún no se han verificado el inicio y renovación de sesión con la titular, las operaciones del panel, la carga de fotos ni la emisión y uso de tarjetas. Esas pruebas requieren completar la configuración de retorno y entrega de correo en Supabase Auth y la activación personal. El dashboard de Supabase requiere iniciar sesión en el navegador para realizar esos ajustes; el conector disponible no los expone.

## Preparación de la cuenta · 25 de octubre de 2026

- Cuenta creada mediante la API administrativa de Supabase Auth y vinculada por su identificador real a `admins`. No se han enviado correos ni elegido la contraseña personal de su titular.
- La API ahora exige `email_confirmed_at` además del usuario validado y la asignación de administrador. Las cuentas pendientes de confirmación siguen bloqueadas.
- El control de aprovisionamiento rechazó una credencial de control inválida. Se retiró tras crear la cuenta; su ruta devuelve HTTP 410 y no conserva operaciones de creación. El archivo de control temporal se eliminó.
- Se prepararon las páginas de activación y contraseña, con retorno PKCE y comprobación de rol. El cambio de contraseña requiere una sesión confirmada y autorizada. La comprobación de entrega del correo y la activación por su titular quedan pendientes del dominio y del remitente definitivo.

El asesor de seguridad posterior a la creación de la cuenta informa que está desactivada la [protección contra contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Supabase ofrece esa opción en Pro o superior; no se ha activado un plan de pago. El formulario exige una contraseña personal de al menos 12 caracteres y el servidor mantiene el bloqueo de cuentas sin confirmar.

Prueba HTTP local de activación completada: formulario 200; pantalla de contraseña sin sesión redirige al acceso (307); cambio de contraseña sin sesión 403; correo inválido 400; solicitud cross-site 403; retorno sin credenciales 303 a una ruta interna. Un destino externo en la consulta no produce redirección externa. Estas pruebas no enviaron correos ni cambiaron contraseñas. TypeScript, ESLint, la prueba de origen y la compilación Next.js volvieron a pasar.

## Producción en Netlify Free

Publicada y verificada en `https://sirley-gomez-spa.netlify.app`, proyecto del equipo `NeyBg23` en Free: 300 créditos al mes, sin recarga automática. No se activaron planes de pago. La versión anterior de Sites conserva su configuración independiente.

- Código de la versión publicada: commit `bdd78be0f90bd26c74f3a20e751834e52f64ef07`.
- Compilación alojada `6ade7cc0e66492c204515e78`; despliegue `6ade7cc0e66492c204515e7a`, estado `ready`, publicado el 25 de octubre de 2026 a las 22:04:36 UTC.
- Se desplegaron la función SSR de Next.js, la función Edge de renovación de sesión y las reglas de redirección. El adaptador `@netlify/plugin-nextjs` 5.16.2 está declarado explícitamente y fijado en el lockfile. La política de antigüedad mínima de dependencias se conserva.
- Las tres variables públicas de Supabase y del origen final están guardadas para producción y se verificaron por lectura de la API. Usan todos los ámbitos predeterminados del plan Free; los ámbitos individuales requieren Pro. No hay claves de servicio en Netlify.
- El archivo fuente de compilación excluye archivos de entorno, sesiones, metadatos locales y dependencias instaladas. Este despliegue todavía no está vinculado a una integración automática con GitHub.

La primera compilación desde ZIP se corrigió para incluir el adaptador de Next.js y generar funciones, en lugar de servir `.next` como archivos estáticos. También se verificó el guardado real de las variables: los comandos iniciales de configuración no las habían creado. La versión final usa la configuración comprobada mediante la API oficial.

## Comprobaciones de la web publicada

- Inicio en español e inglés y catálogo: HTTP 200; siete tratamientos, seis regalos y sesión individual masculina de US$100.
- Formulario de acceso y activación: HTTP 200. Datos administrativos sin sesión: HTTP 403 y `no-store`.
- Dos solicitudes simultáneas al mismo horario desde la API de Netlify: HTTP 201 y 409; el horario ocupado dejó de estar disponible.
- PostgreSQL confirmó que la cita creada conservó el precio de US$100 pese al precio artificial enviado por el cliente.
- Solicitud de regalo navideño: HTTP 201, estado `requested`, precio US$95 en la respuesta y en PostgreSQL.
- Solicitud de cita cross-site: HTTP 403. Correo inválido de recuperación: HTTP 400, sin envío de mensajes.
- Pantalla de contraseña sin sesión: redirección 307 al acceso. Retorno de autenticación inválido: redirección interna 303, sin aceptar un destino externo.
- Se eliminaron únicamente la cita y el regalo sintéticos de esta prueba mediante sus referencias exactas y se confirmó que no quedan registros con esas referencias.
- Comprobación visual en navegador de la página de producción en español: logo, fotografías, tipografía, colores cálidos, precios, horarios y enlaces visibles. La página inglesa también se comprobó en navegador, incluida la actualización del idioma del documento a `en` tras la carga. La entrega de correo y las operaciones autenticadas del panel siguen pendientes.

Tras añadir el adaptador, TypeScript volvió a pasar. Los cambios posteriores a esta publicación solo actualizan documentación.
