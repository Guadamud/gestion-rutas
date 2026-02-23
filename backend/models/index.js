const { sequelize } = require("../config/database");
const User = require("./User");
const Cliente = require("./Cliente");
const Conductor = require("./Conductor");
const Bus = require("./Bus");
const Ruta = require("./Ruta");
const Frecuencia = require("./Frecuencia");
const Transaccion = require("./Transaccion");
const Cooperativa = require("./Cooperativa");
const CierreCaja = require("./CierreCaja");
const ConfiguracionMantenimiento = require("./ConfiguracionMantenimiento");
const LimiteRutaBus = require("./LimiteRutaBus");

// Definir relaciones entre modelos

// User - Cliente (1:1)
User.hasOne(Cliente, { foreignKey: "userId", onDelete: "CASCADE" });
Cliente.belongsTo(User, { foreignKey: "userId" });

// Cliente - Conductor (1:N)
Cliente.hasMany(Conductor, { foreignKey: "clienteId", onDelete: "CASCADE" });
Conductor.belongsTo(Cliente, { foreignKey: "clienteId" });

// Cliente - Bus (1:N)
Cliente.hasMany(Bus, { foreignKey: "usuarioId", onDelete: "CASCADE" });
Bus.belongsTo(Cliente, { foreignKey: "usuarioId" });

// Cliente - Transaccion (1:N)
Cliente.hasMany(Transaccion, { foreignKey: "clienteId", onDelete: "CASCADE" });
Transaccion.belongsTo(Cliente, { foreignKey: "clienteId" });

// Conductor - Transaccion (1:N)
Conductor.hasMany(Transaccion, { foreignKey: "conductorId", onDelete: "CASCADE" });
Transaccion.belongsTo(Conductor, { foreignKey: "conductorId" });

// Conductor - Frecuencia (1:N)
Conductor.hasMany(Frecuencia, { foreignKey: "conductorId", onDelete: "SET NULL" });
Frecuencia.belongsTo(Conductor, { foreignKey: "conductorId" });

// Bus - Frecuencia (1:N)
Bus.hasMany(Frecuencia, { foreignKey: "busId", onDelete: "SET NULL" });
Frecuencia.belongsTo(Bus, { foreignKey: "busId" });

// Ruta - Frecuencia (1:N)
Ruta.hasMany(Frecuencia, { foreignKey: "rutaId", onDelete: "SET NULL" });
Frecuencia.belongsTo(Ruta, { foreignKey: "rutaId" });

// User - CierreCaja (1:N)
User.hasMany(CierreCaja, { foreignKey: "cerradoPorId", onDelete: "CASCADE" });
CierreCaja.belongsTo(User, { foreignKey: "cerradoPorId", as: "cerradoPor" });

// CierreCaja - Transaccion (1:N)
CierreCaja.hasMany(Transaccion, { foreignKey: "incluidoEnCierreId", onDelete: "SET NULL" });
Transaccion.belongsTo(CierreCaja, { foreignKey: "incluidoEnCierreId", as: "cierreAsociado" });

// User - Transaccion (1:N) - Usuario de tesorería que aprobó
User.hasMany(Transaccion, { foreignKey: "aprobadoPorId", onDelete: "SET NULL" });
Transaccion.belongsTo(User, { foreignKey: "aprobadoPorId", as: "aprobadoPor" });

// Bus - LimiteRutaBus (1:N)
Bus.hasMany(LimiteRutaBus, { foreignKey: "busId", onDelete: "CASCADE" });
LimiteRutaBus.belongsTo(Bus, { foreignKey: "busId" });

// Ruta - LimiteRutaBus (1:N)
Ruta.hasMany(LimiteRutaBus, { foreignKey: "rutaId", onDelete: "CASCADE" });
LimiteRutaBus.belongsTo(Ruta, { foreignKey: "rutaId" });

// Cooperativa - Cliente (1:N)
Cooperativa.hasMany(Cliente, { foreignKey: "cooperativaId", onDelete: "SET NULL" });
Cliente.belongsTo(Cooperativa, { foreignKey: "cooperativaId" });

// Cooperativa - Bus (1:N)
Cooperativa.hasMany(Bus, { foreignKey: "cooperativaId", onDelete: "SET NULL" });
Bus.belongsTo(Cooperativa, { foreignKey: "cooperativaId" });

module.exports = {
  sequelize,
  User,
  Cliente,
  Conductor,
  Bus,
  Ruta,
  Frecuencia,
  Transaccion,
  Cooperativa,
  CierreCaja,
  ConfiguracionMantenimiento,
  LimiteRutaBus
};
