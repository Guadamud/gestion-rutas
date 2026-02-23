const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Cliente = sequelize.define("Cliente", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users",
      key: "id"
    }
  },
  nombres: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  apellidos: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  cedula: { 
    type: DataTypes.STRING, 
    unique: true, 
    allowNull: false 
  },
  telefono: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  email: { 
    type: DataTypes.STRING, 
    unique: true, 
    allowNull: false 
  },
  direccion: { 
    type: DataTypes.STRING 
  },
  saldo: { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 0.00,
    get() {
      const value = this.getDataValue('saldo');
      return value ? parseFloat(value) : 0;
    }
  },
  estado: {
    type: DataTypes.ENUM("activo", "inactivo"),
    defaultValue: "activo"
  },
  cooperativaId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "cooperativas",
      key: "id"
    }
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: "clientes"
});

module.exports = Cliente;
