const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CierreCaja = sequelize.define(
  "CierreCaja",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Fecha del cierre de caja",
    },
    tipo_cierre: {
      type: DataTypes.ENUM("diario"),
      allowNull: false,
      defaultValue: "diario",
      comment: "Tipo de cierre: diario",
    },
    periodo: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Periodo del cierre (fecha del cierre diario)",
    },
    hora_cierre: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Hora en que se realizó el cierre",
    },
    monto_sistema: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Monto total registrado en el sistema",
    },
    monto_real: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Monto real contado físicamente",
    },
    diferencia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Diferencia entre monto real y sistema (real - sistema)",
    },
    total_solicitudes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Número total de solicitudes procesadas",
    },
    solicitudes_aprobadas: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Número de solicitudes aprobadas",
    },
    total_frecuencias: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Número total de frecuencias del día",
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Observaciones o notas sobre el cierre",
    },
    estado: {
      type: DataTypes.ENUM("CERRADO", "REABIERTO", "AJUSTADO"),
      defaultValue: "CERRADO",
      comment: "Estado del cierre de caja",
    },
    cerradoPorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      comment: "ID del usuario que realizó el cierre",
    },
  },
  {
    tableName: "CierresCaja",
    timestamps: true,
  }
);

module.exports = CierreCaja;
