const { sequelize } = require('./config/database');

async function actualizarEnumEstadoVerificacion() {
  try {
    // Crear el tipo ENUM si no existe
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_Frecuencia_estadoVerificacion" AS ENUM ('pendiente', 'verificado', 'usado');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    // Eliminar el valor por defecto temporalmente
    await sequelize.query(`
      ALTER TABLE "Frecuencia" 
      ALTER COLUMN "estadoVerificacion" DROP DEFAULT;
    `);
    
    // Modificar la columna para usar el tipo ENUM
    await sequelize.query(`
      ALTER TABLE "Frecuencia" 
      ALTER COLUMN "estadoVerificacion" TYPE "enum_Frecuencia_estadoVerificacion" 
      USING "estadoVerificacion"::"enum_Frecuencia_estadoVerificacion";
    `);
    
    // Restaurar el valor por defecto
    await sequelize.query(`
      ALTER TABLE "Frecuencia" 
      ALTER COLUMN "estadoVerificacion" SET DEFAULT 'pendiente';
    `);
    
    console.log('✅ Tipo ENUM de estadoVerificacion creado/actualizado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al actualizar ENUM:', error);
    process.exit(1);
  }
}

actualizarEnumEstadoVerificacion();
