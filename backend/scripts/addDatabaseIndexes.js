/**
 * Script para añadir índices a las tablas de la base de datos
 * 
 * Este script mejora el rendimiento de las consultas más frecuentes
 * añadiendo índices en las columnas más utilizadas
 */

require("dotenv").config();
const { sequelize } = require("../config/database");

const addIndexes = async () => {
  try {
    console.log('🔧 Iniciando creación de índices...\n');

    // ==================== TABLA USERS ====================
    console.log('📊 Añadiendo índices a tabla Users...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users (email);
    `);
    console.log('  ✅ Índice creado: idx_users_email');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_rol 
      ON users (rol);
    `);
    console.log('  ✅ Índice creado: idx_users_rol');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_cedula 
      ON users (cedula);
    `);
    console.log('  ✅ Índice creado: idx_users_cedula');

    // ==================== TABLA CLIENTES ====================
    console.log('\n📊 Añadiendo índices a tabla Clientes...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_userid 
      ON clientes ("userId");
    `);
    console.log('  ✅ Índice creado: idx_clientes_userid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_email 
      ON clientes (email);
    `);
    console.log('  ✅ Índice creado: idx_clientes_email');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_cedula 
      ON clientes (cedula);
    `);
    console.log('  ✅ Índice creado: idx_clientes_cedula');

    // ==================== TABLA CONDUCTORES ====================
    console.log('\n📊 Añadiendo índices a tabla Conductores...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conductores_clienteid 
      ON conductores ("clienteId");
    `);
    console.log('  ✅ Índice creado: idx_conductores_clienteid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conductores_cedula 
      ON conductores (cedula);
    `);
    console.log('  ✅ Índice creado: idx_conductores_cedula');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conductores_estado 
      ON conductores (estado);
    `);
    console.log('  ✅ Índice creado: idx_conductores_estado');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_conductores_telefono 
      ON conductores (telefono);
    `);
    console.log('  ✅ Índice creado: idx_conductores_telefono');

    // ==================== TABLA BUSES ====================
    console.log('\n📊 Añadiendo índices a tabla Buses...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buses_usuarioid 
      ON buses ("usuarioId");
    `);
    console.log('  ✅ Índice creado: idx_buses_usuarioid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buses_placa 
      ON buses (placa);
    `);
    console.log('  ✅ Índice creado: idx_buses_placa');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buses_estado 
      ON buses (estado);
    `);
    console.log('  ✅ Índice creado: idx_buses_estado');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buses_numero 
      ON buses (numero);
    `);
    console.log('  ✅ Índice creado: idx_buses_numero');

    // ==================== TABLA RUTAS ====================
    console.log('\n📊 Añadiendo índices a tabla Rutas...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_origen 
      ON "Ruta" (origen);
    `);
    console.log('  ✅ Índice creado: idx_rutas_origen');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_destino 
      ON "Ruta" (destino);
    `);
    console.log('  ✅ Índice creado: idx_rutas_destino');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_precio 
      ON "Ruta" (precio);
    `);
    console.log('  ✅ Índice creado: idx_rutas_precio');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_rutas_origen_destino 
      ON "Ruta" (origen, destino);
    `);
    console.log('  ✅ Índice creado: idx_rutas_origen_destino (compuesto)');

    // ==================== TABLA FRECUENCIAS ====================
    console.log('\n📊 Añadiendo índices a tabla Frecuencias...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_frecuencias_conductorid 
      ON "Frecuencia" ("conductorId");
    `);
    console.log('  ✅ Índice creado: idx_frecuencias_conductorid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_frecuencias_busid 
      ON "Frecuencia" ("busId");
    `);
    console.log('  ✅ Índice creado: idx_frecuencias_busid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_frecuencias_rutaid 
      ON "Frecuencia" ("rutaId");
    `);
    console.log('  ✅ Índice creado: idx_frecuencias_rutaid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_frecuencias_fecha 
      ON "Frecuencia" (fecha);
    `);
    console.log('  ✅ Índice creado: idx_frecuencias_fecha');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_frecuencias_estadover 
      ON "Frecuencia" ("estadoVerificacion");
    `);
    console.log('  ✅ Índice creado: idx_frecuencias_estadover');

    // ==================== TABLA TRANSACCIONES ====================
    console.log('\n📊 Añadiendo índices a tabla Transacciones...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_clienteid 
      ON transacciones ("clienteId");
    `);
    console.log('  ✅ Índice creado: idx_transacciones_clienteid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_conductorid 
      ON transacciones ("conductorId");
    `);
    console.log('  ✅ Índice creado: idx_transacciones_conductorid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_fecha 
      ON transacciones (fecha);
    `);
    console.log('  ✅ Índice creado: idx_transacciones_fecha');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_estado 
      ON transacciones (estado);
    `);
    console.log('  ✅ Índice creado: idx_transacciones_estado');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_tipo 
      ON transacciones (tipo);
    `);
    console.log('  ✅ Índice creado: idx_transacciones_tipo');

    // ==================== TABLA COOPERATIVAS ====================
    console.log('\n📊 Añadiendo índices a tabla Cooperativas...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cooperativas_nombre 
      ON cooperativas (nombre);
    `);
    console.log('  ✅ Índice creado: idx_cooperativas_nombre');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cooperativas_ruc 
      ON cooperativas (ruc);
    `);
    console.log('  ✅ Índice creado: idx_cooperativas_ruc');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cooperativas_estado 
      ON cooperativas (estado);
    `);
    console.log('  ✅ Índice creado: idx_cooperativas_estado');

    // ==================== TABLA CIERRE CAJA ====================
    console.log('\n📊 Añadiendo índices a tabla Cierre de Caja...');
    
    // La tabla se llama CierresCaja (plural) según la lista
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cierrecaja_fecha 
      ON "CierresCaja" (fecha);
    `);
    console.log('  ✅ Índice creado: idx_cierrecaja_fecha');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_cierrecaja_cerradopor 
      ON "CierresCaja" ("cerradoPorId");
    `);
    console.log('  ✅ Índice creado: idx_cierrecaja_cerradopor');

    // ==================== TABLA LIMITE RUTA BUS ====================
    console.log('\n📊 Añadiendo índices a tabla Límite Ruta Bus...');
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_limiterutabus_busid 
      ON limites_ruta_bus ("busId");
    `);
    console.log('  ✅ Índice creado: idx_limiterutabus_busid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_limiterutabus_rutaid 
      ON limites_ruta_bus ("rutaId");
    `);
    console.log('  ✅ Índice creado: idx_limiterutabus_rutaid');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_limiterutabus_bus_ruta 
      ON limites_ruta_bus ("busId", "rutaId");
    `);
    console.log('  ✅ Índice creado: idx_limiterutabus_bus_ruta (compuesto)');

    console.log('\n✅ ¡Todos los índices han sido creados exitosamente!');
    console.log('📈 El rendimiento del sistema ha sido optimizado.');
    
  } catch (error) {
    console.error('\n❌ Error al crear índices:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  addIndexes()
    .then(() => {
      console.log('\n🎉 Proceso completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = addIndexes;
