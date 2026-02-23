const { sequelize } = require('./config/database');

async function agregarComprobante() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Agregar columna comprobante
    await sequelize.query(`
      ALTER TABLE "transacciones" 
      ADD COLUMN IF NOT EXISTS "comprobante" VARCHAR(255)
    `);
    
    console.log('✅ Columna comprobante agregada a transacciones');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

agregarComprobante();
