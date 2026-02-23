const { sequelize } = require('./config/database');
const Ruta = require('./models/Ruta');

async function syncRutas() {
  try {
    console.log('Sincronizando modelo de Rutas...');
    
    // Forzar sincronización del modelo (esto agregará las columnas faltantes)
    await Ruta.sync({ alter: true });
    
    console.log('✓ Modelo de Rutas sincronizado correctamente');
    console.log('✓ Columnas precio y distancia agregadas');
    
    // Verificar rutas existentes
    const rutas = await Ruta.findAll();
    console.log(`\nRutas existentes: ${rutas.length}`);
    
    rutas.forEach(ruta => {
      console.log(`ID: ${ruta.id}, ${ruta.origen} → ${ruta.destino}, Precio: $${ruta.precio || 0}, Distancia: ${ruta.distancia || 0} km`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

syncRutas();
