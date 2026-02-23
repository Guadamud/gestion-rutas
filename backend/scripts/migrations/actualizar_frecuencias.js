const { Frecuencia, Conductor } = require('./models');

async function actualizarFrecuencias() {
  try {
    // Obtener el conductor disponible
    const conductor = await Conductor.findOne();
    
    if (!conductor) {
      console.log('No hay conductores disponibles');
      process.exit(1);
    }
    
    console.log(`Actualizando frecuencias con conductor: ${conductor.nombre} (ID: ${conductor.id})`);
    
    // Actualizar todas las frecuencias sin conductor
    const result = await Frecuencia.update(
      { conductorId: conductor.id },
      { where: { conductorId: null } }
    );
    
    console.log(`✓ ${result[0]} frecuencias actualizadas`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

actualizarFrecuencias();
