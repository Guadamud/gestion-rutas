const { sequelize } = require('./config/database');
const Cooperativa = require('./models/Cooperativa');

async function insertarCooperativas() {
  try {
    console.log('🔄 Insertando cooperativas iniciales...\n');

    // Sincronizar la tabla de cooperativas
    await Cooperativa.sync({ alter: true });

    const cooperativas = [
      { nombre: 'Cooperativa 7 de Noviembre', ruc: '1390116000001', descripcion: 'Cooperativa de transporte interprovincial' },
      { nombre: 'Cooperativa 24 de Septiembre', ruc: '1390122116001', descripcion: 'Cooperativa de transporte interprovincial - Trans Paján' },
      { nombre: 'Cooperativa Jipijapa', ruc: null, descripcion: 'Cooperativa de transporte interprovincial' },
      { nombre: 'Cooperativa Cacique Guale', ruc: null, descripcion: 'Cooperativa de transporte' },
      { nombre: 'Cooperativa 24 de Mayo', ruc: '1390116841001', descripcion: 'Cooperativa de transporte de pasajeros en buses intraprovinciales' },
      { nombre: 'Cooperativa 15 de Octubre', ruc: '1390010717001', descripcion: 'Cooperativa de transporte' },
      { nombre: 'Cooperativa 13 de Diciembre', ruc: '1390141412001', descripcion: 'Cooperativa de transportes' },
      { nombre: 'Compañía Manabi Transman', ruc: '1391787219001', descripcion: 'Compañía de transporte de pasajeros Manabi S.A.' },
      { nombre: 'Compañía San Jacinto Cotranscascol', ruc: '1391851642001', descripcion: 'Compañía de transporte intracantonal San Jacinto de Cascol S.A' }
    ];

    for (const coop of cooperativas) {
      const [cooperativa, created] = await Cooperativa.findOrCreate({
        where: { nombre: coop.nombre },
        defaults: coop
      });

      if (created) {
        console.log(`✅ Cooperativa creada: ${cooperativa.nombre}`);
      } else {
        console.log(`ℹ️  Cooperativa ya existe: ${cooperativa.nombre}`);
      }
    }

    console.log('\n✅ Proceso completado\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

insertarCooperativas();
