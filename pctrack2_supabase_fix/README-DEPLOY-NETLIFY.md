# PCTrack - Deploy en Netlify con base de datos persistente

Esta version fue adaptada para Netlify:

- Frontend estatico: `public/`
- API Express: `netlify/functions/api.js`
- Base de datos persistente: PostgreSQL
- Sesion: cookie firmada, compatible con serverless

## Opcion recomendada: Netlify Database

1. Sube este proyecto a GitHub.
2. En Netlify: **Add new site** -> **Import an existing project**.
3. Selecciona el repo.
4. Build command: `npm run build`
5. Publish directory: `public`
6. Deploy.
7. En el sitio de Netlify, entra a **Database** y crea/conecta Netlify Database si Netlify no la creo automaticamente.
8. Configura esta variable de entorno:
   - `SESSION_SECRET`: un texto largo, privado y aleatorio.

Netlify detectara `netlify/database/migrations/202605210001_initial_schema.sql` y creara las tablas con los datos actuales.

## Opcion alternativa: Supabase / Neon / otro Postgres

En Netlify -> Site configuration -> Environment variables, agrega:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/base?sslmode=require
SESSION_SECRET=un_texto_largo_y_privado
```

La app crea las tablas automaticamente al arrancar. Si quieres conservar exactamente los datos iniciales, ejecuta el SQL de:

```text
netlify/database/migrations/202605210001_initial_schema.sql
```

## Credenciales iniciales

- Usuario: `admin`
- Contraseña: `admingr01@`

Cambia esa contraseña despues de entrar, o crea una ruta administrativa para cambiar usuarios antes de usarlo en produccion.

## Prueba local

Con una base PostgreSQL disponible:

```bash
cp .env.example .env
npm install
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

## Notas importantes

No uses el archivo `db/pctrack.db` en Netlify para datos reales. En serverless el almacenamiento en disco no es una base persistente para escrituras. Esta version usa PostgreSQL para que los equipos y el historial no se pierdan.
