const { Transaccion, CierreCaja } = require('./models');

async function corregirSolicitud() {
  try {
    console.log('🔧 Corrigiendo solicitud #2...\n');
    
    // Buscar la solicitud #2
    const solicitud = await Transaccion.findByPk(2);
    
    if (!solicitud) {
      console.log('❌ Solicitud #2 no encontrada');
      process.exit(1);
    }
    
    console.log('📌 Estado actual solicitud #2:');
    console.log(`   Estado: ${solicitud.estado}`);
    console.log(`   Aprobado por: ${solicitud.aprobadoPorId}`);
    console.log(`   Incluido en cierre: ${solicitud.incluidoEnCierreId}`);
    console.log(`   Updated: ${solicitud.updatedAt}\n`);
    
    // Buscar el cierre más reciente del usuario que aprobó esta solicitud
    const cierreReciente = await CierreCaja.findOne({
      where: {
        cerradoPorId: solicitud.aprobadoPorId,
        fecha: '2026-01-21'
      },
      order: [['id', 'DESC']]
    });
    
    if (!cierreReciente) {
      console.log('❌ No se encontró cierre para este usuario');
      process.exit(1);
    }
    
    console.log(`✅ Cierre encontrado: #${cierreReciente.id}`);
    console.log(`   Fecha: ${cierreReciente.fecha}`);
    console.log(`   Hora: ${cierreReciente.hora_cierre}`);
    console.log(`   Observaciones: ${cierreReciente.observaciones}\n`);
    
    // Actualizar la solicitud
    await solicitud.update({
      incluidoEnCierreId: cierreReciente.id
    });
    
    console.log(`✅ Solicitud #2 actualizada correctamente`);
    console.log(`   Ahora está incluida en el cierre #${cierreReciente.id}\n`);
    
    // Verificar
    const verificacion = await Transaccion.findByPk(2);
    console.log('🔍 Verificación:');
    console.log(`   Incluido en cierre: ${verificacion.incluidoEnCierreId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

corregirSolicitud();
