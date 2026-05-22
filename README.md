# 🖥️ PCTrack — Sistema de Mantenimiento de Equipos

## ⚡ Requisitos

- Node.js v18+ (cualquier versión, incluyendo v25)
- npm

## 🚀 Pasos para iniciar

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start

# 3. Abrir en el navegador
# http://localhost:3000
```

## 📦 Stack

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js + Express |
| Base de datos | **sql.js** (SQLite puro JS, sin compilación nativa) |
| Auth | express-session + bcryptjs |
| Frontend | Bootstrap 5 + Vanilla JS |

> **¿Por qué sql.js?** La librería `better-sqlite3` requiere compilación nativa con C++ y no es compatible con Node.js v22+. `sql.js` es SQLite compilado a WebAssembly — funciona en cualquier versión de Node sin necesidad de compilar nada.

## 🗂️ Estructura

```
pctrack/
├── server.js
├── package.json
├── db/
│   ├── database.js      ← Inicialización SQLite + seed
│   └── pctrack.db       ← Se crea automáticamente
├── routes/
│   ├── auth.js
│   └── devices.js
└── public/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```
