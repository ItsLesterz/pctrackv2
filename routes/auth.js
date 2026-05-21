const express = require('express');
const bcrypt = require('bcryptjs');
const { queryOne } = require('../db/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ ok: true, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error iniciando sesión.' });
  }
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'No autenticado.' });
  res.json(req.session.user);
});

module.exports = router;
