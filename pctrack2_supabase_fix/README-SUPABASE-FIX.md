# PCTrack - correccion Supabase/Netlify

Esta version incluye una correccion para el error "Error agregando equipo".

Cambios principales:

- Repara automaticamente columnas faltantes en `users`, `devices` y `activity_log`.
- Repara las secuencias SERIAL de `users` y `activity_log` cuando se importaron IDs manuales.
- Si el historial (`activity_log`) falla, ya no bloquea la creacion del equipo.
- Mantiene `DATABASE_URL` para Supabase Transaction Pooler.

Variables requeridas en Netlify:

- `DATABASE_URL`: connection string de Supabase Transaction pooler.
- `SESSION_SECRET`: secreto largo para las sesiones.

Despues de subir esta version a GitHub, en Netlify usa:

- Deploy project without cache

