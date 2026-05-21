const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

createApp()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`\n✅ PCTrack corriendo en → http://localhost:${PORT}`);
      console.log('   Usuario: admin | Contraseña: admingr01@\n');
    });
  })
  .catch((err) => {
    console.error('Error iniciando la aplicación:', err);
    process.exit(1);
  });
