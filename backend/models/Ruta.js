const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Ruta = sequelize.define("Ruta", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  origen: { type: DataTypes.STRING, allowNull: false },
  destino: { type: DataTypes.STRING, allowNull: false },
  duracionAproximada: { type: DataTypes.STRING },
  precio: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  distancia: { type: DataTypes.INTEGER, defaultValue: 0 }, // en km
}, {
  tableName: 'Ruta',
  freezeTableName: true
});

module.exports = Ruta;
