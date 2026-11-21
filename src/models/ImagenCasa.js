const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ImagenCasa extends Model {}

ImagenCasa.init(
  {
    ruta: { type: DataTypes.STRING(255), allowNull: false },
    miniatura: { type: DataTypes.STRING(255), allowNull: false },
    esPrincipal: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, modelName: 'ImagenCasa', tableName: 'imagenes_casa' }
);

module.exports = ImagenCasa;
