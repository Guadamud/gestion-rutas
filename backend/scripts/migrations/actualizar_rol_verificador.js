const { sequelize } = require('./config/database');

async function actualizarRolVerificador() {
  try {
    // Primero, obtenemos el tipo ENUM actual
    const result = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'enum_Users_rol';
    `);
    
    const currentValues = result[0].map(r => r.enumlabel);
    console.log('Valores actuales del ENUM:', currentValues);
    
    // Si 'verificador' no está en la lista, lo agregamos
    if (!currentValues.includes('verificador')) {
      await sequelize.query(`
        ALTER TYPE "enum_Users_rol" ADD VALUE 'verificador';
      `);
      console.log('✅ Rol "verificador" agregado al ENUM exitosamente');
    } else {
      console.log('ℹ️  El rol "verificador" ya existe');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar rol:', error);
    process.exit(1);
  }
}

actualizarRolVerificador();
