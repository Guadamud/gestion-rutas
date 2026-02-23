const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Bus = sequelize.define("Bus", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero: { type: DataTypes.INTEGER, allowNull: false },
  placa: { type: DataTypes.STRING, allowNull: false, unique: true },
  modelo: { type: DataTypes.STRING, allowNull: false },
  empresa: { type: DataTypes.STRING, allowNull: true },
  capacidad: { type: DataTypes.INTEGER, defaultValue: 45 },
  estado: { type: DataTypes.ENUM("activo", "inactivo"), defaultValue: "activo" },
  desactivadoPor: {
    type: DataTypes.ENUM("admin", "cliente"),
    allowNull: true,
    comment: 'Indica quién desactivó el bus (solo se usa cuando estado=inactivo)'
  },
  cooperativaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "cooperativas",
      key: "id"
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "clientes",
      key: "id"
    }
  }
}, {
  timestamps: true,
  tableName: "buses"
});

module.exports = Bus;
