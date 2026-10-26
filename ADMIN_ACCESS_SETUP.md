# Asignar una contraseña al acceso existente

El 26 de octubre de 2026 se probaron las invitaciones autorizadas. Gmail rechazó la autenticación SMTP con `535 5.7.8 Username and Password not accepted`. El aviso de guardado del dashboard no comprueba que el proveedor acepte la credencial. La cuenta administradora sigue creada y vinculada; el envío y la activación no se han completado.

Como alternativa, la API administrativa oficial permite asignar una contraseña y confirmar administrativamente **esa cuenta concreta**. El script `scripts/configure-admin-access.mjs` prepara esa operación. No crea usuarios, no elimina la cuenta pendiente, no cambia su correo, no concede roles y no desactiva la confirmación del resto de cuentas. El inicio de sesión del panel sigue comprobando correo confirmado y pertenencia a `admins`.

## Ejecutar en el equipo privado de quien administra el proyecto

Requiere Node.js 24 y una terminal interactiva. El archivo es independiente: no necesita instalar las dependencias de la web. No ejecutarlo como parte de la compilación, en Netlify, en un navegador ni en una terminal compartida o grabada.

1. Descarga `scripts/configure-admin-access.mjs` desde este repositorio. Abre una terminal en la carpeta donde lo guardaste y ejecuta:

   ```sh
   node configure-admin-access.mjs
   ```

   Si trabajas desde la raíz del repositorio, usa `node scripts/configure-admin-access.mjs`.

2. Comprueba que la cabecera diga **(v2)**. Cada pregunta aparece en su propia línea, seguida de `> `; esto evita que PowerShell borre visualmente la pregunta al preparar la entrada. Introduce el UID y el correo de la cuenta ya registrada en **Supabase → Authentication → Users**. El script consulta exclusivamente ese UID y comprueba que coincide con el correo y que ya tiene permiso de administradora.
3. Copia una **Secret key** del mismo proyecto desde **Project Settings → API Keys** y pégala **solo en el aviso oculto de esta terminal privada**. Usa una clave que comience por `sb_secret_`. No sirve una clave publicable ni una contraseña de Google. No modificar archivos de entorno ni pasar secretos como argumentos.
4. Revisa el correo de la cuenta que muestra la terminal. Si cuentas con la autorización de su titular para configurar su acceso, escribe `ACTIVAR`. Esta confirmación es administrativa; no acredita que se haya abierto un mensaje en el buzón de la titular.
5. Escribe la nueva contraseña del panel dos veces. Ambos campos están ocultos. Usa al menos 12 caracteres y un máximo de 72 bytes; una contraseña con caracteres ASCII simplifica este límite.
6. El script envía una única actualización a Supabase Auth con la contraseña y `email_confirm: true`. Después verifica que se mantienen UID, correo y permiso de administradora y que la cuenta aparece confirmada. Si hay un fallo de red, comprueba el estado antes de repetir; el script no reintenta escrituras automáticamente.
7. Cuando aparezca **Acceso configurado**, abre <https://sirley-gomez-spa.netlify.app/admin> e inicia sesión con el correo y la contraseña elegida. Esa prueba de navegador sigue pendiente hasta que la realice quien configure el acceso. La contraseña se entrega a su titular por un canal privado.

La clave secreta y la contraseña no se imprimen, no se guardan en archivos y no forman parte del repositorio. Se mantienen en memoria del proceso durante la operación; al terminar, cierra la terminal. Las peticiones solo pueden ir al origen HTTPS fijo de este proyecto, rechazan redirecciones y no muestran cuerpos de error del proveedor. La operación no despliega un endpoint administrativo nuevo.

La recuperación por correo y las notificaciones de seguridad habilitadas siguen dependiendo del SMTP. La asignación manual de contraseña no repara Gmail. Las notificaciones que estén activadas pueden requerir resolver el SMTP antes de que Supabase complete una actualización; en caso de error, revisar Auth Logs.

## Comprobaciones

```sh
node --test scripts/configure-admin-access.test.mjs
node scripts/configure-admin-access.mjs --help
```

Las pruebas usan respuestas simuladas sin peticiones de red. Cubren la conservación de la identidad, la confirmación específica, la negativa a modificar otras cuentas o usuarios sin el rol, la confirmación del operador, límites y repetición de contraseña, rechazo de claves publicables y errores sin claves ni contraseñas. No se ha ejecutado la actualización sobre la cuenta real ni se ha elegido una contraseña para su titular.

Referencias: [actualizar una cuenta con la API administrativa](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid), [claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
