/**
 * Crea las tablas, el administrador inicial y casas de ejemplo.
 *   npm run db:init     -> crea lo que falte
 *   npm run db:reset    -> BORRA todo y vuelve a crear
 */
require('dotenv').config();
const { sequelize, Casa } = require('../models');
const AuthService = require('../services/AuthService');
const UsuarioRepository = require('../repositories/UsuarioRepository');

const EJEMPLOS = [
  { titulo: 'Casa residencial en Los Pinos', precio: 2450000, recamaras: 3, banos: 2, ciudad: 'Saltillo', estado: 'Coahuila', cp: '25204', direccion: 'Blvd. Los Pinos 120', latitud: 25.4232, longitud: -100.9737 },
  { titulo: 'Residencia moderna con alberca', precio: 6800000, recamaras: 4, banos: 4, ciudad: 'Monterrey', estado: 'Nuevo León', cp: '64920', direccion: 'Av. Revolución 2500', latitud: 25.6514, longitud: -100.2895 },
  { titulo: 'Casa de un piso cerca del centro', precio: 1350000, recamaras: 2, banos: 1, ciudad: 'Torreón', estado: 'Coahuila', cp: '27000', direccion: 'Calle Morelos 450', latitud: 25.5428, longitud: -103.4068 },
  { titulo: 'Casa en fraccionamiento privado', precio: 3200000, recamaras: 3, banos: 3, ciudad: 'Ramos Arizpe', estado: 'Coahuila', cp: '25900', direccion: 'Fracc. Paseo del Valle 18', latitud: 25.5406, longitud: -100.9478 },
  { titulo: 'Departamento-casa de dos niveles', precio: 980000, recamaras: 2, banos: 2, ciudad: 'Saltillo', estado: 'Coahuila', cp: '25000', direccion: 'Calle Allende 77', latitud: 25.4383, longitud: -100.9924 },
  { titulo: 'Casa vendida en San Pedro', precio: 8900000, recamaras: 5, banos: 5, ciudad: 'San Pedro Garza García', estado: 'Nuevo León', cp: '66220', direccion: 'Calzada del Valle 300', latitud: 25.6501, longitud: -100.4026, estatus: 'vendida' },
];

(async () => {
  try {
    const force = process.argv.includes('--force');
    await sequelize.sync({ force });
    console.log(force ? 'Tablas recreadas (--force).' : 'Tablas sincronizadas.');

    const usuarios = new UsuarioRepository();
    if ((await usuarios.contar()) === 0) {
      await new AuthService(usuarios).crearAdmin({
        nombre: process.env.ADMIN_NOMBRE || 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@multicasa.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!',
      });
      console.log(`Administrador creado: ${process.env.ADMIN_EMAIL || 'admin@multicasa.com'}`);
    }

    if ((await Casa.count()) === 0) {
      await Casa.bulkCreate(EJEMPLOS.map((c) => ({ descripcion: 'Descripción de ejemplo. Sustituir con los datos reales de la propiedad.', ...c })));
      console.log(`${EJEMPLOS.length} casas de ejemplo insertadas.`);
    }
  } catch (err) {
    console.error('Error inicializando la BD:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
