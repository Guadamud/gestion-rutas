const { sequelize } = require('./config/database');

async function actualizarComprobanteText() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida');

    // Cambiar el tipo de dato de VARCHAR a TEXT
    await sequelize.query(`
      ALTER TABLE "transacciones" 
      ALTER COLUMN "comprobante" TYPE TEXT;
    `);

    console.log('✅ Columna comprobante actualizada a TEXT');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarComprobanteText();
