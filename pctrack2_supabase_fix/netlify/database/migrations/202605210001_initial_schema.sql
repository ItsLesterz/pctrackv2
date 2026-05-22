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

INSERT INTO users (id, username, password, role, created_at) VALUES
  (1, 'admin', '$2a$10$ftIwJ3af0BaRxoJO/SAmuO7ecos8x0tmTV7nyN1RceHF0s6KTG50e', 'admin', '2026-04-30 21:35:12+00')
ON CONFLICT (username) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM users), 1), true);

INSERT INTO devices (id, name, description, status, interval_months, last_maint, location, assigned_to, created_at, updated_at) VALUES
  ('mom07p4vz85ltiuj2hn', 'Macbook Pro Intel i9 2019', '', 'done', 6, '2026-05-01', 'IT Department', 'Lester Hernandez Cruz', '2026-04-30 21:36:41+00', '2026-05-01 18:07:00+00'),
  ('mon85gdko4ga8xhb7a', 'CLON', 'Intel i7 12700, 64 GB Ram', 'done', 6, '2026-05-01', 'Piso 7', 'Flordelis Maria Hernandez Rivera', '2026-05-01 18:06:39+00', '2026-05-01 18:06:39+00'),
  ('mon87zexgli30szyfc8', 'Asus A16', 'Asus A16, Ryzen 7 7735HS , 32GB Ram, RADEON RX 7700S', 'done', 6, '2026-03-30', 'Piso 7', 'Rudis Alejandro Ramos Alvarez', '2026-05-01 18:08:37+00', '2026-05-01 18:09:30+00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO activity_log (id, message, color, device_id, "user", created_at) VALUES
  (10, 'Equipo agregado: CLON', 'green', 'mon85gdko4ga8xhb7a', 'admin', '2026-05-01 18:06:39+00'),
  (11, 'Mantenimiento completado: Macbook Pro Intel i9 2019', 'green', 'mom07p4vz85ltiuj2hn', 'admin', '2026-05-01 18:07:00+00'),
  (12, 'Equipo agregado: Asus A16', 'green', 'mon87zexgli30szyfc8', 'admin', '2026-05-01 18:08:37+00'),
  (13, 'Equipo editado: Asus A16', 'blue', 'mon87zexgli30szyfc8', 'admin', '2026-05-01 18:09:16+00'),
  (14, 'Mantenimiento completado: Asus A16', 'green', 'mon87zexgli30szyfc8', 'admin', '2026-05-01 18:09:19+00'),
  (15, 'Equipo editado: Asus A16', 'blue', 'mon87zexgli30szyfc8', 'admin', '2026-05-01 18:09:30+00')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('activity_log','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM activity_log), 1), true);
