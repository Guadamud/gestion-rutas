require("dotenv").config();
const { sequelize } = require("../../config/database");

async function agregarCooperativaIdAClientesYBuses() {
  try {
    console.log("🚀 Iniciando migración: Agregar cooperativaId a clientes y buses...\n");

    // 1. Agregar columna cooperativaId a tabla clientes
    console.log("📝 Agregando cooperativaId a tabla clientes...");
    await sequelize.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS "cooperativaId" INTEGER
      REFERENCES cooperativas(id) ON DELETE SET NULL;
    `);
    console.log("✅ Campo cooperativaId agregado a clientes\n");

    // 2. Agregar columna cooperativaId a tabla buses  
    console.log("📝 Agregando cooperativaId a tabla buses...");
    await sequelize.query(`
      ALTER TABLE buses 
      ADD COLUMN IF NOT EXISTS "cooperativaId" INTEGER
      REFERENCES cooperativas(id) ON DELETE SET NULL;
    `);
    console.log("✅ Campo cooperativaId agregado a buses\n");

    // 3. Crear índice para mejorar búsquedas
    console.log("📝 Creando índices...");
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_cooperativa 
      ON clientes("cooperativaId");
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buses_cooperativa 
      ON buses("cooperativaId");
    `);
    console.log("✅ Índices creados\n");

    console.log("✅ ¡Migración completada exitosamente!\n");

  } catch (error) {
    console.error("❌ Error en la migración:", error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

agregarCooperativaIdAClientesYBuses();
