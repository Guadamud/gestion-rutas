const { sequelize } = require('./config/database');

async function agregarCampos() {
  try {
    console.log('🔄 Iniciando migración de campos...\n');

    // 1. Agregar columna aprobadoPorId en transacciones (minúscula)
    console.log('1. Agregando columna aprobadoPorId en transacciones...');
    await sequelize.query(`
      ALTER TABLE "transacciones" 
      ADD COLUMN IF NOT EXISTS "aprobadoPorId" INTEGER 
      REFERENCES "Users"(id) ON DELETE SET NULL;
    `);
    console.log('✅ Columna aprobadoPorId agregada\n');

    // 2. Agregar columna tipo_cierre en CierresCaja
    console.log('2. Agregando columna tipo_cierre en CierresCaja...');
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_CierreCaja_tipo_cierre') THEN
          CREATE TYPE "enum_CierreCaja_tipo_cierre" AS ENUM('diario', 'mensual');
        END IF;
      END $$;
    `);
    
    await sequelize.query(`
      ALTER TABLE "CierresCaja" 
      ADD COLUMN IF NOT EXISTS "tipo_cierre" "enum_CierreCaja_tipo_cierre" DEFAULT 'diario';
    `);
    console.log('✅ Columna tipo_cierre agregada\n');

    // 3. Agregar columna periodo en CierresCaja
    console.log('3. Agregando columna periodo en CierresCaja...');
    await sequelize.query(`
      ALTER TABLE "CierresCaja" 
      ADD COLUMN IF NOT EXISTS "periodo" VARCHAR(255);
    `);
    console.log('✅ Columna periodo agregada\n');

    // 4. Actualizar registros existentes con valores por defecto
    console.log('4. Actualizando registros existentes...');
    await sequelize.query(`
      UPDATE "CierresCaja"
      SET "periodo" = "fecha"::text
      WHERE "periodo" IS NULL;
    `);
    console.log('✅ Registros actualizados\n');

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

agregarCampos();
