const { sequelize, CierreCaja, Transaccion, User } = require('./models');

async function eliminarCierresTesorero() {
  try {
    console.log('🗑️  Iniciando eliminación de cierres de tesorero...');

    // Buscar el usuario tesorero por rol
    const tesorero = await User.findOne({
      where: {
        rol: 'tesoreria'
      }
    });

    if (!tesorero) {
      console.log('❌ No se encontró el usuario tesorero');
      console.log('Listando todos los usuarios:');
      const usuarios = await User.findAll();
      usuarios.forEach(u => {
        console.log(`- ${u.nombres} ${u.apellidos} (${u.email}) - Rol: ${u.rol}`);
      });
      return;
    }

    console.log(`✅ Usuario encontrado: ${tesorero.nombres} ${tesorero.apellidos} (ID: ${tesorero.id})`);

    // Obtener todos los cierres de este tesorero
    const cierres = await CierreCaja.findAll({
      where: {
        cerradoPorId: tesorero.id
      }
    });

    console.log(`📊 Cierres encontrados: ${cierres.length}`);

    if (cierres.length === 0) {
      console.log('ℹ️  No hay cierres para eliminar');
      return;
    }

    // Obtener los IDs de los cierres
    const cierreIds = cierres.map(c => c.id);
    console.log(`🔢 IDs de cierres a eliminar: ${cierreIds.join(', ')}`);

    // Primero, liberar las transacciones (poner incluidoEnCierreId a NULL)
    const [transaccionesActualizadas] = await Transaccion.update(
      { incluidoEnCierreId: null },
      {
        where: {
          incluidoEnCierreId: cierreIds
        }
      }
    );

    console.log(`✅ Transacciones liberadas: ${transaccionesActualizadas}`);

    // Ahora eliminar los cierres
    const cierresEliminados = await CierreCaja.destroy({
      where: {
        cerradoPorId: tesorero.id
      }
    });

    console.log(`✅ Cierres eliminados: ${cierresEliminados}`);
    console.log('🎉 Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error al eliminar cierres:', error);
  } finally {
    await sequelize.close();
  }
}

eliminarCierresTesorero();
