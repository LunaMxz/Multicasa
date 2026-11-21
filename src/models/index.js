const sequelize = require('../config/database');
const Casa = require('./Casa');
const ImagenCasa = require('./ImagenCasa');
const Usuario = require('./Usuario');

// Una casa tiene muchas imágenes
Casa.hasMany(ImagenCasa, { as: 'imagenes', foreignKey: 'casaId', onDelete: 'CASCADE' });
ImagenCasa.belongsTo(Casa, { foreignKey: 'casaId' });

module.exports = { sequelize, Casa, ImagenCasa, Usuario };
