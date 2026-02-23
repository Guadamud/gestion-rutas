const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Frecuencia = sequelize.define("Frecuencia", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  horaSalida: { type: DataTypes.TIME, allowNull: false },
  registradoPor: { type: DataTypes.ENUM("cliente", "conductor"), allowNull: true },
  ticketId: { type: DataTypes.STRING, unique: true, allowNull: true },
  qrCode: { type: DataTypes.TEXT, allowNull: true },
  estadoVerificacion: { 
    type: DataTypes.ENUM("pendiente", "verificado", "usado"), 
    defaultValue: "pendiente" 
  },
  verificadoPor: { type: DataTypes.INTEGER, allowNull: true },
  fechaVerificacion: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'Frecuencia',
  freezeTableName: true
});

module.exports = Frecuencia;
