require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../../config/database');

async function agregarDesactivadoPor() {
  try {
    console.log('Iniciando migración: Agregar columna desactivadoPor a tabla buses...');

    await sequelize.query(`
      ALTER TABLE buses 
      ADD COLUMN "desactivadoPor" VARCHAR(10) 
      CHECK ("desactivadoPor" IN ('admin', 'cliente'))
    `);

    console.log('✅ Columna desactivadoPor agregada correctamente');
    console.log('   - Tipo: VARCHAR(10) con constraint CHECK');
    console.log('   - Valores permitidos: admin, cliente');
    console.log('   - NULL permitido (solo se completa cuando estado=inactivo)');

  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar la migración
agregarDesactivadoPor();
