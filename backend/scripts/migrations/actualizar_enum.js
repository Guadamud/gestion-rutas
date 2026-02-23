const { sequelize } = require('./config/database');

async function actualizarEnum() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Actualizar el enum agregando 'conductor'
    await sequelize.query(`
      ALTER TYPE "enum_Users_rol" ADD VALUE IF NOT EXISTS 'conductor';
    `);

    console.log('✅ Enum actualizado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

actualizarEnum();
