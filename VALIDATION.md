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

El asesor de seguridad no encontró advertencias ni errores. Informó cuatro tablas con [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): es intencional, ya que todos los permisos directos de cliente están revocados y el acceso se hace en la API. El asesor de rendimiento informó un [índice aún sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), esperado en una agenda recién creada; se conserva para consultas de agenda.

Faltan la cuenta administradora real y el despliegue en Vercel. Por eso, aún no se han verificado en ese destino el inicio y renovación de sesión con el propietario, las operaciones del panel, la carga de fotos ni la emisión y uso de tarjetas. El navegador remoto no pudo acceder al servidor local; las comprobaciones locales del HTML y la API se hicieron por HTTP. La comprobación visual del despliegue final queda pendiente.
