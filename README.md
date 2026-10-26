# Sirley Gómez · Silhouette & Harmony

Sitio bilingüe de bienestar en Sterling, Virginia: maderoterapia, tratamientos corporales, reservas, panel administrativo y tarjetas de regalo.

## Estado

La web está publicada en **[sirley-gomez-spa.netlify.app](https://sirley-gomez-spa.netlify.app)** con Next.js en Netlify Free y PostgreSQL, Auth, Storage y la API `spa-api` en Supabase. Las reservas y solicitudes de regalo se verificaron desde la web hasta la base de datos. La cuenta administradora se activó el 26 de octubre de 2026 mediante la [herramienta privada del operador](ADMIN_ACCESS_SETUP.md); se comprobaron su confirmación, el permiso de administradora, el inicio de sesión y la carga del panel autenticado. La recuperación por correo sigue pendiente: la última prueba de Gmail rechazó la credencial SMTP con el error 535. Consulta [la guía de configuración](DEPLOY_NETLIFY_SUPABASE.md) y [las comprobaciones realizadas](VALIDATION.md).

La publicación se hace con una compilación alojada del código fuente; todavía no hay despliegue automático al subir cambios a GitHub.

## Funcionamiento

- Página y formularios en español e inglés; preferencia de idioma conservada.
- Reservas por formulario y WhatsApp. Las solicitudes quedan pendientes de confirmación. PostgreSQL impide citas superpuestas, incluso con solicitudes simultáneas.
- Agenda de lunes a sábado, 4:30–7:00 p. m., zona `America/New_York`, con cierres editables y adaptación al horario de verano.
- Sesiones para hombres a US$100; paquetes de seis por US$600 y ocho por US$800.
- Gift cards de cumpleaños y propuesta de Navidad: US$95, US$130 y US$160. La emisión requiere confirmar manualmente el pago; cada tarjeta tiene un código y un enlace único.
- Panel `/admin` para agenda, catálogo, precios, textos bilingües, fotografías y horarios. Acceso con Supabase Auth, correo verificado y autorización explícita en `admins`. Activación y recuperación de contraseña mediante enlace de correo.
- La dirección exacta se comparte personalmente al confirmar la cita.

## Arquitectura

`app/` contiene la web y las rutas Next.js. Su API reenvía las operaciones a `supabase/functions/spa-api/`, donde se validan las entradas, se verifica cada acceso administrativo y se consulta PostgreSQL o Storage. Las claves privadas permanecen en el entorno de Supabase; Netlify necesita únicamente la URL y la clave publicable.

Las cuatro tablas tienen RLS activado y no conceden acceso directo a los roles `anon` o `authenticated`. Iniciar sesión o registrar una cuenta no concede permisos administrativos. Las fotografías nuevas se guardan en un bucket privado dedicado; solo sus rutas de imagen se sirven mediante la API. JPG, PNG y WebP, hasta 3 MB.

`lib/content.ts` contiene el esquema de validación compartido y el catálogo inicial. Las ediciones posteriores se conservan en PostgreSQL, con control de revisión para evitar sobrescribir cambios de otro dispositivo.

## Desarrollo

Requiere Node.js 24 y pnpm 11.25.0.

```sh
corepack pnpm install
cp .env.example .env.local
# Configurar los valores públicos de Supabase en .env.local.
corepack pnpm dev
```

Para comprobar la aplicación:

```sh
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm verify:catalog
corepack pnpm verify:origin
corepack pnpm build
```

No se incluyen contraseñas, claves privadas, sesiones ni datos de clientes en el repositorio. El SQL de `supabase/migrations/` registra la estructura aplicada; no contiene registros de clientes ni credenciales. La configuración de Netlify y la cuenta del panel se preparan por separado según la guía.

## Derechos

La publicación del repositorio no concede una licencia general sobre la marca, fotografías o contenido comercial. Los avisos de licencia de dependencias y archivos de terceros se conservan en sus archivos correspondientes.
