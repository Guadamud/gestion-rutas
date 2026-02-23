const { sequelize } = require('../../config/database');

async function actualizar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la base de datos\n');

    // Crear la tabla limites_ruta_bus
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "limites_ruta_bus" (
        "id" SERIAL PRIMARY KEY,
        "busId" INTEGER NOT NULL REFERENCES "buses"("id") ON DELETE CASCADE,
        "rutaId" INTEGER NOT NULL REFERENCES "Ruta"("id") ON DELETE CASCADE,
        "limiteDiario" INTEGER NOT NULL DEFAULT 1 CHECK ("limiteDiario" >= 1 AND "limiteDiario" <= 50),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "unique_bus_ruta" UNIQUE ("busId", "rutaId")
      )
    `);
    
    console.log('✅ Tabla limites_ruta_bus creada correctamente');
    
    // Agregar comentario a la tabla
    await sequelize.query(`
      COMMENT ON TABLE "limites_ruta_bus" IS 'Configuración de límites diarios por bus y ruta específica'
    `);
    
    await sequelize.query(`
      COMMENT ON COLUMN "limites_ruta_bus"."limiteDiario" IS 'Número máximo de veces que este bus puede hacer esta ruta por día'
    `);
    
    console.log('✅ Comentarios agregados a la tabla y columnas');
    
    // Crear índices para mejorar rendimiento
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_limites_busId" ON "limites_ruta_bus"("busId")
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_limites_rutaId" ON "limites_ruta_bus"("rutaId")
    `);
    
    console.log('✅ Índices creados para mejorar rendimiento');
    console.log('\n📋 Migración completada exitosamente');
    console.log('ℹ️  Ahora puedes configurar límites específicos por bus y ruta');
    console.log('ℹ️  Ejemplo: Bus ABC-1234 puede hacer "Paján → Guayaquil" máx 2 veces/día');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  }
}

actualizar();
