const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ConfiguracionMantenimiento = sequelize.define("ConfiguracionMantenimiento", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  limpieza_programada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Si está activada la limpieza programada",
  },
  fecha_limpieza: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha y hora programada para la limpieza",
  },
  notificacion_enviada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Si ya se envió la notificación a los usuarios",
  },
  bloquear_frecuencias: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Bloquear creación de frecuencias durante la limpieza",
  },
  fecha_inicio_bloqueo: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Inicio del período de bloqueo",
  },
  fecha_fin_bloqueo: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fin del período de bloqueo",
  },
  ultima_limpieza: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de la última limpieza realizada",
  },
  registros_eliminados_ultima: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: "Estadísticas de la última limpieza",
  },
  
  // Campos para limpieza automática gradual
  limpieza_automatica_activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Si está activa la limpieza automática gradual en segundo plano",
  },
  limpieza_automatica_horario: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "03:00",
    comment: "Horario para ejecutar limpieza automática (HH:MM)",
  },
  limpieza_automatica_lote: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    comment: "Cantidad de registros a eliminar por lote en limpieza gradual",
  },
  limpieza_automatica_intervalo: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: "Minutos de espera entre lotes en limpieza gradual",
  },
  limpieza_automatica_en_progreso: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Si hay una limpieza automática ejecutándose actualmente",
  },
  limpieza_automatica_progreso: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: "Progreso actual de la limpieza automática {eliminados, restantes, porcentaje}",
  },
  limpieza_automatica_fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de inicio de la limpieza automática actual",
  },
  limpieza_automatica_fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de finalización de la última limpieza automática",
  },
});

module.exports = ConfiguracionMantenimiento;
