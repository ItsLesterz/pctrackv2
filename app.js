const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');
const { initDB } = require('./db/database');

async function createApp() {
  await initDB();

  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(cookieSession({
    name: 'pctrack_session',
    keys: [process.env.SESSION_SECRET || 'pctrack-change-this-secret'],
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NETLIFY === 'true'
  }));

  // Rutas con /api para desarrollo local y sin /api para Netlify Functions.
  app.use(['/api/auth', '/auth'], require('./routes/auth'));
  app.use(['/api/devices', '/devices'], require('./routes/devices'));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}

module.exports = { createApp };
