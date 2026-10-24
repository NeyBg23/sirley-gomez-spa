# Sirley Gómez · Silhouette & Harmony

Sitio bilingüe de bienestar en Sterling, Virginia: tratamientos corporales, maderoterapia, reservas, panel administrativo y tarjetas de regalo.

## Estado de este repositorio

Código fuente completo de la primera versión construida con Sites/Cloudflare, publicado para continuar su adaptación a **Vercel + Supabase**.

**Todavía no está adaptado para desplegar directamente en Vercel.** La versión actual usa Vinext, D1, R2 y el inicio de sesión de ChatGPT. Se conservarán el diseño, las imágenes y las traducciones al sustituir esas dependencias.

- `app/`: página pública, panel, formularios, API y tarjetas digitales.
- `public/images/`: imágenes de marca optimizadas.
- `lib/content.ts`: catálogo inicial y textos en español e inglés.
- `db/` y `drizzle/`: esquema de la versión original.
- `supabase/migrations/`: borrador PostgreSQL para la migración.
- `MIGRATION_VERCEL_SUPABASE.md`: pasos de adaptación pendientes.
- `VALIDATION.md`: comprobaciones realizadas en la versión original.

## Contenido y precios

- Atención de lunes a sábado, 4:30–7:00 p. m., hora local de Sterling, con cita previa.
- Tratamientos para hombres: US$100 por sesión; paquetes de 6 por US$600 y 8 por US$800.
- Gift cards de cumpleaños y propuesta de Navidad en tres niveles: US$95, US$130 y US$160.
- Las duraciones corporales no indicadas en el material tienen 60 minutos como configuración inicial editable.

## Configuración

Las credenciales y la base de datos se configuran por separado. Este repositorio no incluye claves, contraseñas, sesiones ni registros de clientes. Para la migración se necesitarán Supabase Auth, PostgreSQL y Storage, y las variables del proyecto de Vercel.

El borrador SQL no se ha aplicado a un proyecto Supabase. No se debe activar una agenda de producción hasta terminar la adaptación y verificar reservas, permisos y almacenamiento.

## Derechos

La publicación del repositorio no concede una licencia general sobre la marca, fotografías o contenido comercial. Los avisos de licencia de las dependencias y archivos de terceros se conservan en sus archivos correspondientes.
