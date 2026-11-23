
/**
 * Inicialización de la base de datos Multicasa.
 *
 * npm run db:init  -> sincroniza tablas y agrega datos faltantes
 * npm run db:reset -> BORRA y recrea las tablas (solo desarrollo)
 */

require('dotenv').config();

const { sequelize, Casa } = require('../models');
const AuthService = require('../services/AuthService');
const UsuarioRepository = require('../repositories/UsuarioRepository');

const EJEMPLOS = [
  {
    titulo: 'Casa residencial en Los Pinos',
    precio: 2450000,
    recamaras: 3,
    banos: 2,
    ciudad: 'Saltillo',
    estado: 'Coahuila',
    cp: '25204',
    direccion: 'Blvd. Los Pinos 120',
    latitud: 25.4232,
    longitud: -100.9737,
    estatus: 'venta'
  },
  {
    titulo: 'Residencia moderna con alberca',
    precio: 6800000,
    recamaras: 4,
    banos: 4,
    ciudad: 'Monterrey',
    estado: 'Nuevo León',
    cp: '64920',
    direccion: 'Av. Revolución 2500',
    latitud: 25.6514,
    longitud: -100.2895,
    estatus: 'venta'
  },
  {
    titulo: 'Casa de un piso cerca del centro',
    precio: 1350000,
    recamaras: 2,
    banos: 1,
    ciudad: 'Torreón',
    estado: 'Coahuila',
    cp: '27000',
    direccion: 'Calle Morelos 450',
    latitud: 25.5428,
    longitud: -103.4068,
    estatus: 'venta'
  },
  {
    titulo: 'Casa en fraccionamiento privado',
    precio: 3200000,
    recamaras: 3,
    banos: 3,
    ciudad: 'Ramos Arizpe',
    estado: 'Coahuila',
    cp: '25900',
    direccion: 'Fracc. Paseo del Valle 18',
    latitud: 25.5406,
    longitud: -100.9478,
    estatus: 'venta'
  },
  {
    titulo: 'Departamento-casa de dos niveles',
    precio: 980000,
    recamaras: 2,
    banos: 2,
    ciudad: 'Saltillo',
    estado: 'Coahuila',
    cp: '25000',
    direccion: 'Calle Allende 77',
    latitud: 25.4383,
    longitud: -100.9924,
    estatus: 'venta'
  },
  {
    titulo: 'Casa vendida en San Pedro',
    precio: 8900000,
    recamaras: 5,
    banos: 5,
    ciudad: 'San Pedro Garza García',
    estado: 'Nuevo León',
    cp: '66220',
    direccion: 'Calzada del Valle 300',
    latitud: 25.6501,
    longitud: -100.4026,
    estatus: 'vendida'
  },
  {
    titulo: 'Casa familiar al norte de Saltillo',
    precio: 1850000,
    recamaras: 3,
    banos: 2,
    ciudad: 'Saltillo',
    estado: 'Coahuila',
    cp: '25210',
    direccion: 'Zona norte de Saltillo',
    latitud: 25.463,
    longitud: -100.979,
    estatus: 'venta'
  },
  {
    titulo: 'Residencia amplia en Saltillo',
    precio: 4750000,
    recamaras: 4,
    banos: 3,
    ciudad: 'Saltillo',
    estado: 'Coahuila',
    cp: '25230',
    direccion: 'Zona residencial norte',
    latitud: 25.457,
    longitud: -100.951,
    estatus: 'venta'
  },
  {
    titulo: 'Casa económica en Ramos Arizpe',
    precio: 890000,
    recamaras: 2,
    banos: 1,
    ciudad: 'Ramos Arizpe',
    estado: 'Coahuila',
    cp: '25900',
    direccion: 'Zona centro de Ramos Arizpe',
    latitud: 25.54,
    longitud: -100.955,
    estatus: 'venta'
  },
  {
    titulo: 'Casa moderna en Torreón',
    precio: 2750000,
    recamaras: 3,
    banos: 2,
    ciudad: 'Torreón',
    estado: 'Coahuila',
    cp: '27000',
    direccion: 'Zona residencial de Torreón',
    latitud: 25.554,
    longitud: -103.42,
    estatus: 'venta'
  },
  {
    titulo: 'Residencia de lujo en Monterrey',
    precio: 7500000,
    recamaras: 5,
    banos: 4,
    ciudad: 'Monterrey',
    estado: 'Nuevo León',
    cp: '64000',
    direccion: 'Zona residencial de Monterrey',
    latitud: 25.678,
    longitud: -100.311,
    estatus: 'venta'
  },
  {
    titulo: 'Casa vendida en Saltillo',
    precio: 1600000,
    recamaras: 3,
    banos: 2,
    ciudad: 'Saltillo',
    estado: 'Coahuila',
    cp: '25000',
    direccion: 'Zona centro de Saltillo',
    latitud: 25.431,
    longitud: -100.998,
    estatus: 'vendida'
  },
  {
    titulo: 'Departamento moderno en Monterrey',
    precio: 2100000,
    recamaras: 2,
    banos: 2,
    ciudad: 'Monterrey',
    estado: 'Nuevo León',
    cp: '64000',
    direccion: 'Zona centro de Monterrey',
    latitud: 25.67,
    longitud: -100.309,
    estatus: 'venta'
  },
  {
    titulo: 'Casa con jardín en Arteaga',
    precio: 3850000,
    recamaras: 3,
    banos: 3,
    ciudad: 'Arteaga',
    estado: 'Coahuila',
    cp: '25350',
    direccion: 'Zona centro de Arteaga',
    latitud: 25.447,
    longitud: -100.847,
    estatus: 'venta'
  },
  {
    titulo: 'Residencia vendida en Torreón',
    precio: 4250000,
    recamaras: 4,
    banos: 3,
    ciudad: 'Torreón',
    estado: 'Coahuila',
    cp: '27000',
    direccion: 'Zona residencial de Torreón',
    latitud: 25.558,
    longitud: -103.405,
    estatus: 'vendida'
  }
];

async function inicializar() {
  try {
    const force = process.argv.includes('--force');

    await sequelize.sync({ force });

    console.log(
      force
        ? 'Tablas recreadas.'
        : 'Tablas sincronizadas.'
    );

    // Crear administrador si no existen usuarios.
    const usuarios = new UsuarioRepository();

    if ((await usuarios.contar()) === 0) {
      await new AuthService(usuarios).crearAdmin({
        nombre: process.env.ADMIN_NOMBRE || 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@multicasa.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!'
      });

      console.log('Administrador creado.');
    }

    // Insertar casas faltantes sin repetir títulos.
    let insertadas = 0;
    let existentes = 0;

    for (const casa of EJEMPLOS) {
      const [, creada] = await Casa.findOrCreate({
        where: { titulo: casa.titulo },
        defaults: {
          descripcion:
            'Propiedad de demostración para el proyecto Multicasa.',
          ...casa
        }
      });

      if (creada) {
        insertadas++;
      } else {
        existentes++;
      }
    }

    console.log('Casas nuevas:', insertadas);
    console.log('Casas ya existentes:', existentes);
    console.log('Total en la base:', await Casa.count());
    console.log('Inicialización finalizada correctamente.');

  } catch (err) {
    console.error(
      'Error inicializando la BD:',
      err.message
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

inicializar();
