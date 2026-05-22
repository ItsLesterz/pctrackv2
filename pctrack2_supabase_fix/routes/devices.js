const express = require('express');
const { query, queryOne, run, uid } = require('../db/database');
const router = express.Router();

function auth(req, res, next) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'No autenticado.' });
  next();
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

router.get('/', auth, async (req, res) => {
  try {
    const devices = await query('SELECT * FROM devices ORDER BY created_at DESC');
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cargando equipos.' });
  }
});

router.get('/meta/log', auth, async (req, res) => {
  try {
    const logs = await query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 150');
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cargando historial.' });
  }
});

router.delete('/meta/log', auth, async (req, res) => {
  try {
    await run('DELETE FROM activity_log');
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando historial.' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const d = await queryOne('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    if (!d) return res.status(404).json({ error: 'Equipo no encontrado.' });
    res.json(d);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error cargando equipo.' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, description, status, interval_months, last_maint, location, assigned_to } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });

    const id = uid();
    await run(
      'INSERT INTO devices (id,name,description,status,interval_months,last_maint,location,assigned_to) VALUES (?,?,?,?,?,?,?,?)',
      [id, name.trim(), description || '', status || 'pending', parseInt(interval_months) || 6, last_maint || null, location || '', assigned_to || '']
    );
    try {
      await run('INSERT INTO activity_log (message,color,device_id,"user") VALUES (?,?,?,?)',
        [`Equipo agregado: ${name.trim()}`, 'green', id, req.session.user.username]);
    } catch (logErr) {
      console.error('Error registrando historial al agregar equipo:', logErr);
    }

    res.status(201).json(await queryOne('SELECT * FROM devices WHERE id = ?', [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error agregando equipo.' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, status, interval_months, last_maint, location, assigned_to } = req.body;
    const existing = await queryOne('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Equipo no encontrado.' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });

    await run(
      'UPDATE devices SET name=?,description=?,status=?,interval_months=?,last_maint=?,location=?,assigned_to=?,updated_at=NOW() WHERE id=?',
      [name.trim(), description || '', status || 'pending', parseInt(interval_months) || 6, last_maint || null, location || '', assigned_to || '', req.params.id]
    );
    try {
      await run('INSERT INTO activity_log (message,color,device_id,"user") VALUES (?,?,?,?)',
        [`Equipo editado: ${name.trim()}`, 'blue', req.params.id, req.session.user.username]);
    } catch (logErr) {
      console.error('Error registrando historial al editar equipo:', logErr);
    }

    res.json(await queryOne('SELECT * FROM devices WHERE id = ?', [req.params.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando equipo.' });
  }
});

router.patch('/:id/done', auth, async (req, res) => {
  try {
    const d = await queryOne('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    if (!d) return res.status(404).json({ error: 'Equipo no encontrado.' });

    await run('UPDATE devices SET status=\'done\',last_maint=?,updated_at=NOW() WHERE id=?', [todayStr(), req.params.id]);
    try {
      await run('INSERT INTO activity_log (message,color,device_id,"user") VALUES (?,?,?,?)',
        [`Mantenimiento completado: ${d.name}`, 'green', req.params.id, req.session.user.username]);
    } catch (logErr) {
      console.error('Error registrando historial de mantenimiento:', logErr);
    }

    res.json(await queryOne('SELECT * FROM devices WHERE id = ?', [req.params.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error marcando mantenimiento.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const d = await queryOne('SELECT * FROM devices WHERE id = ?', [req.params.id]);
    if (!d) return res.status(404).json({ error: 'Equipo no encontrado.' });

    await run('DELETE FROM devices WHERE id = ?', [req.params.id]);
    try {
      await run('INSERT INTO activity_log (message,color,"user") VALUES (?,?,?)',
        [`Equipo eliminado: ${d.name}`, 'red', req.session.user.username]);
    } catch (logErr) {
      console.error('Error registrando historial al eliminar equipo:', logErr);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando equipo.' });
  }
});

module.exports = router;
