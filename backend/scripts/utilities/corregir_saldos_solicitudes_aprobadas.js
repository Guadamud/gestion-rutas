/**
 * Script para corregir saldos de clientes/conductores con solicitudes aprobadas
 * que no se reflejaron debido al bug de redeclaración de variables
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Configurar la ruta del módulo de modelos
const modelsPath = path.join(__dirname, '../../models');
const { Cliente, Conductor, Transaccion } = require(modelsPath);

async function corregirSaldosSolicitudesAprobadas() {
  try {
    console.log('🔧 Iniciando corrección de saldos...\n');

    // Buscar todas las solicitudes aprobadas
    const solicitudesAprobadas = await Transaccion.findAll({
      where: {
        tipo: 'solicitud_compra',
        estado: 'aprobada'
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`📋 Encontradas ${solicitudesAprobadas.length} solicitudes aprobadas\n`);

    let clientesActualizados = 0;
    let conductoresActualizados = 0;
    let errores = 0;

    for (const solicitud of solicitudesAprobadas) {
      try {
        console.log(`\n⚙️  Procesando solicitud ID: ${solicitud.id}`);
        console.log(`   Tipo: ${solicitud.solicitadoPor}`);
        console.log(`   Monto: $${solicitud.monto}`);

        if (solicitud.solicitadoPor === 'conductor' && solicitud.conductorId) {
          // Actualizar saldo del conductor
          const conductor = await Conductor.findByPk(solicitud.conductorId);
          
          if (!conductor) {
            console.log(`   ❌ Conductor no encontrado (ID: ${solicitud.conductorId})`);
            errores++;
            continue;
          }

          const saldoAnterior = parseFloat(conductor.saldo || 0);
          const nuevoSaldo = saldoAnterior + parseFloat(solicitud.monto);
          
          console.log(`   👤 Conductor: ${conductor.nombres} ${conductor.apellidos}`);
          console.log(`   💰 Saldo anterior: $${saldoAnterior}`);
          console.log(`   💰 Nuevo saldo: $${nuevoSaldo}`);
          
          // NO actualizar si el saldo ya fue aplicado
          // (verificamos si el saldo actual ya incluye esta transacción)
          const montoEsperado = solicitudesAprobadas
            .filter(s => s.conductorId === conductor.id && s.id <= solicitud.id)
            .reduce((sum, s) => sum + parseFloat(s.monto), 0);
          
          if (Math.abs(conductor.saldo - montoEsperado) < 0.01) {
            console.log(`   ✅ Saldo ya está correcto, omitiendo...`);
            continue;
          }

          await conductor.update({ saldo: nuevoSaldo });
          conductoresActualizados++;
          console.log(`   ✅ Conductor actualizado`);

        } else {
          // Actualizar saldo del cliente (dueño)
          const cliente = await Cliente.findByPk(solicitud.clienteId, {
            attributes: ['id', 'nombres', 'apellidos', 'saldo']
          });
          
          if (!cliente) {
            console.log(`   ❌ Cliente no encontrado (ID: ${solicitud.clienteId})`);
            errores++;
            continue;
          }

          const saldoAnterior = parseFloat(cliente.saldo || 0);
          const nuevoSaldo = saldoAnterior + parseFloat(solicitud.monto);
          
          console.log(`   👤 Cliente: ${cliente.nombres} ${cliente.apellidos}`);
          console.log(`   💰 Saldo anterior: $${saldoAnterior}`);
          console.log(`   💰 Nuevo saldo: $${nuevoSaldo}`);
          
          // NO actualizar si el saldo ya fue aplicado
          const montoEsperado = solicitudesAprobadas
            .filter(s => s.clienteId === cliente.id && s.solicitadoPor !== 'conductor' && s.id <= solicitud.id)
            .reduce((sum, s) => sum + parseFloat(s.monto), 0);
          
          if (Math.abs(cliente.saldo - montoEsperado) < 0.01) {
            console.log(`   ✅ Saldo ya está correcto, omitiendo...`);
            continue;
          }

          await cliente.update({ saldo: nuevoSaldo });
          clientesActualizados++;
          console.log(`   ✅ Cliente actualizado`);
        }

      } catch (error) {
        console.error(`   ❌ Error procesando solicitud ${solicitud.id}:`, error.message);
        errores++;
      }
    }

    console.log('\n\n═══════════════════════════════════');
    console.log('📊 RESUMEN DE CORRECCIÓN');
    console.log('═══════════════════════════════════');
    console.log(`✅ Clientes actualizados: ${clientesActualizados}`);
    console.log(`✅ Conductores actualizados: ${conductoresActualizados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📋 Total solicitudes procesadas: ${solicitudesAprobadas.length}`);
    console.log('═══════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar el script
corregirSaldosSolicitudesAprobadas();
