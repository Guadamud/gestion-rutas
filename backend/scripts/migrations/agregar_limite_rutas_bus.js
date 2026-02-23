const { sequelize } = require('../../config/database');

async function actualizar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la base de datos\n');

    // Agregar columna limiteRutas a la tabla buses
    await sequelize.query(`
      ALTER TABLE "buses" 
      ADD COLUMN IF NOT EXISTS "limiteRutas" INTEGER DEFAULT NULL
    `);
    
    console.log('✅ Columna limiteRutas agregada a la tabla buses');
    
    // Agregar un comentario a la columna para documentación
    await sequelize.query(`
      COMMENT ON COLUMN "buses"."limiteRutas" IS 'Límite de frecuencias diarias que puede realizar este bus'
    `);
    
    console.log('✅ Comentario agregado a la columna limiteRutas');
    console.log('\n📋 Migración completada exitosamente');
    console.log('ℹ️  Los buses ahora pueden tener un límite de rutas/frecuencias diarias configurable');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  }
}

actualizar();
