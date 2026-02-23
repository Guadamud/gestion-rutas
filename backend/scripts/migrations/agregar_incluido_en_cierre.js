const { sequelize } = require('./config/database');

async function agregarCampoIncluidoEnCierre() {
  try {
    console.log('🔄 Agregando campo incluidoEnCierreId a tabla transacciones...');
    
    // Verificar si la columna ya existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'transacciones' 
      AND COLUMN_NAME = 'incluidoEnCierreId'
    `);
    
    if (results.length > 0) {
      console.log('ℹ️  La columna incluidoEnCierreId ya existe');
    } else {
      // Agregar la columna (sin COMMENT en PostgreSQL)
      await sequelize.query(`
        ALTER TABLE transacciones 
        ADD COLUMN incluidoEnCierreId INT NULL
      `);
      
      // Agregar comentario en PostgreSQL
      await sequelize.query(`
        COMMENT ON COLUMN transacciones.incluidoEnCierreId 
        IS 'ID del cierre de caja en el que se incluyó esta transacción'
      `);
      
      // Agregar la foreign key
      await sequelize.query(`
        ALTER TABLE transacciones 
        ADD CONSTRAINT fk_transacciones_cierre
        FOREIGN KEY (incluidoEnCierreId) 
        REFERENCES "CierresCaja"(id)
        ON DELETE SET NULL
      `);
      
      console.log('✅ Columna incluidoEnCierreId agregada correctamente');
    }
    
    // Mostrar estadísticas
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN incluidoEnCierreId IS NULL THEN 1 ELSE 0 END) as sin_cierre,
        SUM(CASE WHEN incluidoEnCierreId IS NOT NULL THEN 1 ELSE 0 END) as con_cierre
      FROM transacciones
      WHERE tipo = 'solicitud_compra'
      AND estado = 'aprobada'
    `);
    
    console.log('\n📊 Estadísticas de solicitudes aprobadas:');
    console.log(`   - Total: ${stats[0].total}`);
    console.log(`   - Sin cierre: ${stats[0].sin_cierre}`);
    console.log(`   - Con cierre: ${stats[0].con_cierre}`);
    
  } catch (error) {
    console.error('❌ Error al agregar campo:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
agregarCampoIncluidoEnCierre()
  .then(() => {
    console.log('\n✅ Migración completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
