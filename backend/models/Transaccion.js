const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Transaccion = sequelize.define("Transaccion", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  conductorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "conductores",
      key: "id"
    }
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "clientes",
      key: "id"
    }
  },
  tipo: {
    type: DataTypes.ENUM("recarga", "cobro", "ajuste", "solicitud_compra"),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM("pendiente", "aprobada", "rechazada", "completada"),
    defaultValue: "completada"
  },
  monto: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  saldoAnterior: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true 
  },
  saldoNuevo: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true 
  },
  descripcion: { 
    type: DataTypes.TEXT 
  },
  metodoPago: {
    type: DataTypes.STRING
  },
  comprobante: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Imagen base64 del comprobante de pago'
  },
  solicitadoPor: {
    type: DataTypes.ENUM("cliente", "conductor"),
    defaultValue: "cliente",
    allowNull: false
  },
  aprobadoPorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "Users",
      key: "id"
    },
    comment: 'ID del usuario de tesorería que aprobó la solicitud'
  },
  incluidoEnCierreId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'incluidoencierreid', // Nombre real en PostgreSQL (minúsculas)
    references: {
      model: "CierresCaja",
      key: "id"
    },
    comment: 'ID del cierre de caja en el que se incluyó esta transacción'
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: "transacciones"
});

module.exports = Transaccion;
