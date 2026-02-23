const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Conductor = sequelize.define("Conductor", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "clientes",
      key: "id"
    }
  },
  nombre: { 
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
    allowNull: true 
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Users",
      key: "id"
    }
  },
  tipoLicencia: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  vencimientoLicencia: { 
    type: DataTypes.DATEONLY, 
    allowNull: false 
  },
  saldo: { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 0.00,
    get() {
      const value = this.getDataValue('saldo');
      return value ? parseFloat(value) : 0;
    }
  },
  totalFrecuencias: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0 
  },
  ingresosTotales: { 
    type: DataTypes.DECIMAL(10, 2), 
    defaultValue: 0.00 
  },
  estado: {
    type: DataTypes.ENUM("activo", "inactivo"),
    defaultValue: "activo"
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: "conductores"
});

module.exports = Conductor;
