const { sequelize } = require('./config/database');

async function actualizarCierreCaja() {
  try {
    console.log('🔄 Actualizando modelo CierreCaja...');
    
    // Eliminar el valor 'mensual' del ENUM tipo_cierre
    await sequelize.query(`
      ALTER TABLE CierresCaja 
      MODIFY tipo_cierre ENUM('diario') NOT NULL DEFAULT 'diario'
      COMMENT 'Tipo de cierre: diario';
    `);
    
    console.log('✅ Modelo CierreCaja actualizado correctamente');
    console.log('   - tipo_cierre ahora solo acepta: diario');
    console.log('   - Los cierres existentes se mantienen');
    
    // Mostrar estadísticas
    const [cierres] = await sequelize.query(`
      SELECT tipo_cierre, COUNT(*) as cantidad 
      FROM CierresCaja 
      GROUP BY tipo_cierre
    `);
    
    console.log('\n📊 Estadísticas de cierres:');
    cierres.forEach(c => {
      console.log(`   - ${c.tipo_cierre}: ${c.cantidad} registros`);
    });
    
  } catch (error) {
    console.error('❌ Error al actualizar:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
actualizarCierreCaja()
  .then(() => {
    console.log('\n✅ Actualización completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
