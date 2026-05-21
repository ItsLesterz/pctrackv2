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
    // Si no está corriendo dentro de Netlify Database, usamos el error claro de abajo.
  }

  throw new Error('Falta DATABASE_URL. En Netlify crea/conecta una base Postgres y configura DATABASE_URL, o usa Netlify Database.');
}

function sqlWithPgParams(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function initDB() {
  if (initialized) return;

  const connectionString = await getConnectionString();
  pool = new pg.Pool({
    connectionString,
    ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });

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
  `);

  const adminRow = await queryOne('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!adminRow) {
    const hash = bcrypt.hashSync('admingr01@', 10);
    await run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
  }

  initialized = true;
  console.log('✅ Base de datos Postgres lista');
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

module.exports = { initDB, query, queryOne, run, uid };
