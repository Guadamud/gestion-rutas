const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombres: { type: DataTypes.STRING, allowNull: false },
  apellidos: { type: DataTypes.STRING, allowNull: false },
  cedula: { type: DataTypes.STRING, unique: true, allowNull: false },
  celular: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  rol: {
    type: DataTypes.ENUM("admin", "tesoreria", "cliente", "conductor", "verificador"),
    defaultValue: "cliente",
  },
  clave_autorizacion: { 
    type: DataTypes.STRING, 
    allowNull: true,
    comment: "Clave de 4-6 dígitos para autorizar cierres de caja (hasheada con bcrypt)"
  },
  clave_autorizacion_texto: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: "Clave de autorización en texto plano (solo para visualización del admin)"
  },
  es_clave_temporal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Indica si la clave actual es temporal o definitiva"
  },
  clave_expiracion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha y hora de expiración de la clave temporal"
  },
  clave_temporal_usada_por: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: "Array de IDs de usuarios que ya usaron esta clave temporal (cada usuario solo puede usarla UNA VEZ)"
  },
  tema_preferido: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'azulProfesional',
    comment: "Tema de colores preferido por el usuario (azulProfesional, verdeNaturaleza, naranjaEnergia, etc.)"
  },
});

module.exports = User;
