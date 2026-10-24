# Validación de la primera versión

- TypeScript: compilación sin errores.
- Build de Vinext: correcto para inicio, administración, API y tarjetas emitidas.
- Catálogo: validado con Zod; todos los servicios masculinos equivalen a US$100 por sesión; cumpleaños y Navidad tienen niveles US$95 / US$130 / US$160.
- Calendario: pruebas de fecha local de Sterling en horario de verano y estándar; rechazo de horarios de configuración invertidos e identificadores de catálogo duplicados.
- SQLite: dos solicitudes concurrentes con horarios superpuestos permiten una sola reserva. Cancelar libera el horario.
- Navegador: cambio completo entre español e inglés, precios de paquetes e individuales para hombres, formulario de agenda, fecha elegida con calendario nativo y horarios de una sesión de 75 minutos (último inicio 5:45 p. m.).
- Flujo local de cita: solicitud registrada, referencia generada y precio de US$100 verificado en D1; enlace de WhatsApp contiene la referencia y el mensaje traducido.
- Flujo local de Navidad: personalización y solicitud registrada por US$95; no se cobra ni se emite una tarjeta antes de confirmar manualmente el pago.
- Panel: el acceso anónimo muestra inicio de sesión; los datos se protegen además en cada operación del servidor. La comprobación visual de una sesión autenticada del propietario queda para el primer ingreso, ya que la vista local no simula esa identidad.
- Celular: vista de 375 px útiles, menú desplegable y botón WhatsApp dentro del ancho; ancho del documento igual al de la vista, sin desplazamiento horizontal.
- Las solicitudes de QA existen únicamente en la base local de la vista previa. No se incluyen en el despliegue.

Las duraciones corporales femeninas de 60 minutos y las experiencias de Navidad están identificadas en el panel como configuraciones iniciales editables para revisión por el negocio.
