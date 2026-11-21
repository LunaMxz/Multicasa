const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Casa extends Model {
  /** Imagen principal (requiere haber incluido `imagenes` en la consulta). */
  imagenPrincipal() {
    const imgs = this.imagenes || [];
    return imgs.find((i) => i.esPrincipal) || imgs[0] || null;
  }
}

Casa.init(
  {
    titulo: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: { type: DataTypes.TEXT },
    precio: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    recamaras: { type: DataTypes.INTEGER, defaultValue: 0 },
    banos: { type: DataTypes.INTEGER, defaultValue: 0 },
    ciudad: { type: DataTypes.STRING(80), allowNull: false },
    estado: { type: DataTypes.STRING(80), allowNull: false },
    cp: { type: DataTypes.STRING(10) },
    direccion: { type: DataTypes.STRING(200) },
    latitud: { type: DataTypes.DECIMAL(10, 7) },
    longitud: { type: DataTypes.DECIMAL(10, 7) },
    estatus: { type: DataTypes.ENUM('venta', 'vendida'), defaultValue: 'venta', allowNull: false },
  },
  { sequelize, modelName: 'Casa', tableName: 'casas' }
);

module.exports = Casa;
