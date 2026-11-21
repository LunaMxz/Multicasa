require('dotenv').config();
const { Sequelize } = require('sequelize');

// Patrón SINGLETON: Node cachea los módulos, por lo que toda la app
// comparte esta única instancia de conexión a PostgreSQL.
const sequelize = new Sequelize(
  process.env.DB_NAME || 'multicasa',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
