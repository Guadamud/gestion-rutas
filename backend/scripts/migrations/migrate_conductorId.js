const { sequelize } = require('./config/database');

async function migrate() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Conexión exitosa');

    console.log('Eliminando restricción NOT NULL de conductorId...');
    await sequelize.query('ALTER TABLE transacciones ALTER COLUMN "conductorId" DROP NOT NULL;');
    console.log('✓ Columna conductorId ahora permite valores NULL');

    await sequelize.close();
    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error.message);
    process.exit(1);
  }
}

migrate();
