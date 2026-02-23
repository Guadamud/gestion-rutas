const { sequelize } = require('./config/database');
const User = require('./models/User');

const agregarCampo = async () => {
  try {
    console.log('🔧 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');

    console.log('🔧 Agregando campo clave_temporal_usada_por...');
    
    // Sincronizar solo el modelo User con alter: true
    await User.sync({ alter: true });
    
    console.log('✅ Campo clave_temporal_usada_por agregado exitosamente');
    console.log('📋 Tipo: JSONB (array de IDs de usuarios)');
    console.log('📋 Propósito: Rastrear qué usuarios ya usaron la clave temporal');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

agregarCampo();
