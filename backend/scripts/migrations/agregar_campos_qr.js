const { sequelize } = require('./config/database');

async function agregarCamposQR() {
  try {
    // Agregar columnas para el sistema de QR
    await sequelize.query(`
      ALTER TABLE "Frecuencia" 
      ADD COLUMN IF NOT EXISTS "ticketId" VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS "qrCode" TEXT,
      ADD COLUMN IF NOT EXISTS "estadoVerificacion" VARCHAR(50) DEFAULT 'pendiente',
      ADD COLUMN IF NOT EXISTS "verificadoPor" INTEGER,
      ADD COLUMN IF NOT EXISTS "fechaVerificacion" TIMESTAMP;
    `);
    
    // Intentar agregar la constraint (puede fallar si ya existe)
    try {
      await sequelize.query(`
        ALTER TABLE "Frecuencia"
        ADD CONSTRAINT fk_verificador FOREIGN KEY ("verificadoPor") REFERENCES "Users"(id) ON DELETE SET NULL;
      `);
    } catch (err) {
      if (err.original?.code !== '42710') { // 42710 = constraint already exists
        throw err;
      }
      console.log('ℹ️  Constraint ya existe, continuando...');
    }
    
    console.log('✅ Campos de QR agregados exitosamente a la tabla Frecuencia');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar campos:', error);
    process.exit(1);
  }
}

agregarCamposQR();
