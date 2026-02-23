const { sequelize } = require('../../config/database');

async function agregarCampoTemaPreferido() {
  try {
    console.log('Agregando campo tema_preferido a la tabla users...');
    
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS tema_preferido VARCHAR(50) DEFAULT 'azulProfesional';
    `);
    
    console.log('✅ Campo tema_preferido agregado correctamente');
    
    // Actualizar usuarios existentes con el tema por defecto
    await sequelize.query(`
      UPDATE users 
      SET tema_preferido = 'azulProfesional' 
      WHERE tema_preferido IS NULL;
    `);
    
    console.log('✅ Usuarios existentes actualizados con tema por defecto');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar campo tema_preferido:', error);
    process.exit(1);
  }
}

agregarCampoTemaPreferido();
