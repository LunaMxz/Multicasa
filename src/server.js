require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL conectado');
    app.listen(PORT, () => console.log(`Multicasa en http://localhost:${PORT}`));
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:', err.message);
    console.error('¿Creaste la BD y configuraste el archivo .env?');
    process.exit(1);
  }
})();
