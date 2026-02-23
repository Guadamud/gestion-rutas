const { sequelize } = require('./config/database');
const Conductor = require('./models/Conductor');

async function actualizar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Buscar conductor con usuarioId 28
    const conductor = await Conductor.findOne({
      where: { usuarioId: 28 }
    });

    if (conductor) {
      console.log('=== CONDUCTOR ACTUAL ===');
      console.log('ID:', conductor.id);
      console.log('Nombre:', conductor.nombre);
      console.log('Saldo actual:', conductor.saldo);

      // Actualizar saldo a 10.00
      await conductor.update({ saldo: '10.00' });
      
      console.log('\n✅ Saldo actualizado a 10.00');
      
      // Verificar
      await conductor.reload();
      console.log('Saldo nuevo:', conductor.saldo);
    } else {
      console.log('❌ Conductor no encontrado');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

actualizar();
