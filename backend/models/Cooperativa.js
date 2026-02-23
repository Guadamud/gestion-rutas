const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Cooperativa = sequelize.define("Cooperativa", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false,
    unique: true
  },
  ruc: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM("activo", "inactivo"),
    defaultValue: "activo"
  }
}, {
  timestamps: true,
  tableName: "cooperativas"
});

module.exports = Cooperativa;
