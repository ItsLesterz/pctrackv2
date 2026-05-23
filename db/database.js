const bcrypt = require('bcryptjs');
const pg = require('pg');

let pool;
let initialized = false;

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function getConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NETLIFY_DATABASE_URL) return process.env.NETLIFY_DATABASE_URL;
  if (process.env.NETLIFY_DB_URL) return process.env.NETLIFY_DB_URL;

  try {
    const netlifyDatabase = await import('@netlify/database');
    if (typeof netlifyDatabase.getConnectionString === 'function') {
      return netlifyDatabase.getConnectionString();
    }
  } catch (err) {
    // Si no esta corriendo dentro de Netlify Database, usamos el error claro de abajo.
  }

  throw new Error('Falta DATABASE_URL. En Netlify configura DATABASE_URL con el connection string de Supabase/Postgres.');
}

function sqlWithPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function repairSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      interval_months INTEGER DEFAULT 6,
      last_maint DATE,
      location TEXT DEFAULT '',
      assigned_to TEXT DEFAULT '',
      client_name TEXT DEFAULT '',
      client_phone TEXT DEFAULT '',
      client_email TEXT DEFAULT '',
      service_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id SERIAL PRIMARY KEY,
      message TEXT NOT NULL,
      color TEXT DEFAULT 'blue',
      device_id TEXT,
      "user" TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

    ALTER TABLE devices ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS interval_months INTEGER DEFAULT 6;
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_maint DATE;
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_to TEXT DEFAULT '';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT '';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS client_email TEXT DEFAULT '';
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS service_count INTEGER DEFAULT 0;
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE devices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue';
    ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS device_id TEXT;
    ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS "user" TEXT;
    ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  `);

  await pool.query(`
    SELECT setval(
      pg_get_serial_sequence('users', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1),
      true
    );

    SELECT setval(
      pg_get_serial_sequence('activity_log', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM activity_log), 1),
      true
    );
  `);
}

async function initDB() {
  if (initialized) return;

  const connectionString = await getConnectionString();

  pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
  });

  await repairSchema();

  const adminRow = await queryOne('SELECT id FROM users WHERE username = ?', ['admin']);

  if (!adminRow) {
    const hash = bcrypt.hashSync('admingr01@', 10);
    await run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
  }

  initialized = true;
  console.log('Base de datos Postgres lista');
}

async function query(sql, params = []) {
  if (!pool) await initDB();

  const result = await pool.query(sqlWithPgParams(sql), params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  if (!pool) await initDB();

  await pool.query(sqlWithPgParams(sql), params);
}

module.exports = {
  initDB,
  query,
  queryOne,
  run,
  uid
};