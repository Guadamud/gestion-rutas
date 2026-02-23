const { sequelize } = require('./config/database');
const { ConfiguracionMantenimiento } = require('./models');

async function crearTablaMantenimiento() {
  try {
    console.log('📋 Creando tabla ConfiguracionMantenimientos...');
    
    // Sincronizar solo este modelo
    await ConfiguracionMantenimiento.sync({ alter: true });
    
    console.log('✅ Tabla ConfiguracionMantenimientos creada exitosamente');
    
    // Verificar si existe un registro
    const count = await ConfiguracionMantenimiento.count();
    console.log(`📊 Registros actuales: ${count}`);
    
    if (count === 0) {
      console.log('ℹ️  No hay configuración. Se creará al programar la primera limpieza.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla:', error);
    process.exit(1);
  }
}

crearTablaMantenimiento();
