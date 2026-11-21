const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Usuario extends Model {}

Usuario.init(
  {
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    rol: { type: DataTypes.ENUM('admin'), defaultValue: 'admin', allowNull: false },
  },
  { sequelize, modelName: 'Usuario', tableName: 'usuarios' }
);

module.exports = Usuario;
