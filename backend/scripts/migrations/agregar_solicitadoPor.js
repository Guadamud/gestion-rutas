const { sequelize } = require('./config/database');

async function agregarSolicitadoPor() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos');

    // Primero crear el tipo ENUM si no existe
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_transacciones_solicitadoPor') THEN
          CREATE TYPE "enum_transacciones_solicitadoPor" AS ENUM ('cliente', 'conductor');
          RAISE NOTICE 'Tipo ENUM creado exitosamente';
        END IF;
      END $$;
    `);

    // Agregar columna solicitadoPor si no existe
    await sequelize.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'transacciones' 
          AND column_name = 'solicitadoPor'
        ) THEN
          ALTER TABLE transacciones 
          ADD COLUMN "solicitadoPor" "enum_transacciones_solicitadoPor" DEFAULT 'cliente' NOT NULL;
          
          RAISE NOTICE 'Columna solicitadoPor agregada exitosamente';
        ELSE
          RAISE NOTICE 'La columna solicitadoPor ya existe';
        END IF;
      END $$;
    `);

    console.log('Migración completada');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
}

agregarSolicitadoPor();
