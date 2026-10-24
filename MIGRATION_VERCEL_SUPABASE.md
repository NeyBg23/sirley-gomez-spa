# Migración a Vercel + Supabase

Estado: copia de trabajo de la versión inicial del sitio. Esta rama todavía NO es una aplicación
adaptada para desplegar en Vercel. No se ha creado ni modificado ningún proyecto
en Vercel o Supabase, y no se han contratado planes.

## Preparado

- Diseño, traducciones, imágenes, catálogo y panel copiados a una rama separada.
- Borrador PostgreSQL en `supabase/migrations/202610240001_spa_schema.sql`.
- Datos monetarios con tipos decimales, snapshots de precios y nombres bilingües.
- Restricción de PostgreSQL contra reservas superpuestas, incluso concurrentes.
- RLS habilitada sin acceso directo para visitantes ni usuarios ordinarios.
- Escritura de contenido con control de revisión para evitar sobrescribir cambios.

El SQL aún no se ha ejecutado ni validado contra un proyecto PostgreSQL real.

## Adaptación pendiente

1. Sustituir Vinext/Cloudflare por Next.js estándar, con comandos `next dev`,
   `next build` y `next start`. Conservar los componentes y estilos de la marca.
2. Sustituir D1 por Supabase PostgreSQL y sus operaciones transaccionales. Las
   validaciones de fechas y horarios siguen usando `America/New_York`.
3. Sustituir el inicio de sesión de ChatGPT por Supabase Auth. El acceso de
   administración dependerá de una identidad aprovisionada y verificada, y se
   comprobará en el servidor para cada operación. Registrar una cuenta no debe
   dar acceso al panel automáticamente.
4. Sustituir R2 por un bucket de Supabase Storage para las fotografías subidas.
   Conservar las imágenes incluidas en `public/` y el formato de las rutas.
5. Migrar los registros existentes y las imágenes subidas, si los hubiera,
   después de inventariar y exportar los datos actuales de forma autorizada.
6. Verificar el panel con una cuenta administradora real y otra sin permisos;
   probar reservas concurrentes, cambios de precios, gift cards y archivos.
7. Desplegar en un entorno de revisión antes de conectar el dominio definitivo.

## Conexiones necesarias

Seleccionar los proyectos de destino en Vercel y Supabase. Configurar sus secretos mediante los mecanismos seguros de los proveedores. No almacenar claves privadas en el código ni en Git.

## Costo informado, pendiente de elección del propietario

La documentación consultada indica Vercel Pro desde US$20/mes para uso comercial
y Supabase Pro desde US$25/mes. El plan gratuito de Supabase puede pausarse por
inactividad. No se ha autorizado ni realizado ninguna compra o cambio de plan.
