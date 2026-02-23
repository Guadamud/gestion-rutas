const { Ruta } = require('./models');

async function updateRuta() {
  try {
    const ruta = await Ruta.findByPk(5);
    
    if (ruta) {
      ruta.precio = 2.50;
      ruta.distancia = 80;
      await ruta.save();
      
      console.log('✓ Ruta actualizada:');
      console.log(`  ID: ${ruta.id}`);
      console.log(`  Origen: ${ruta.origen}`);
      console.log(`  Destino: ${ruta.destino}`);
      console.log(`  Precio: $${ruta.precio}`);
      console.log(`  Distancia: ${ruta.distancia} km`);
    } else {
      console.log('Ruta no encontrada');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateRuta();
