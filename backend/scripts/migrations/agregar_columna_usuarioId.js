const { sequelize } = require('./config/database');

async function agregarColumna() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Agregar columna usuarioId a la tabla conductores
    await sequelize.query(`
      ALTER TABLE conductores 
      ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER 
      REFERENCES "Users"(id);
    `);

    console.log('✅ Columna usuarioId agregada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

agregarColumna();
