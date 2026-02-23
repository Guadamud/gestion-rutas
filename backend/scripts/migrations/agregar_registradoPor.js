const { sequelize } = require('./config/database');

async function actualizar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Agregar columna registradoPor
    await sequelize.query(`
      ALTER TABLE "Frecuencia" 
      ADD COLUMN IF NOT EXISTS "registradoPor" VARCHAR(255)
    `);
    
    console.log('✅ Columna registradoPor agregada');

    // Crear el enum si no existe
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_Frecuencia_registradoPor AS ENUM ('cliente', 'conductor');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Enum registradoPor creado');

    // Cambiar tipo de columna a enum
    await sequelize.query(`
      ALTER TABLE "Frecuencia" 
      ALTER COLUMN "registradoPor" TYPE enum_Frecuencia_registradoPor 
      USING "registradoPor"::enum_Frecuencia_registradoPor
    `);
    
    console.log('✅ Columna convertida a enum');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

actualizar();
