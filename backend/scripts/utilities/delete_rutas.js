const { Ruta } = require('./models');

async function deleteRutas() {
  try {
    const count = await Ruta.count();
    console.log(`Total rutas en base de datos: ${count}`);
    
    if (count > 0) {
      await Ruta.destroy({ where: {} });
      console.log('✓ Todas las rutas han sido eliminadas');
    } else {
      console.log('No hay rutas para eliminar');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteRutas();
