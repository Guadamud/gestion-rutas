/**
 * Script para corregir saldos de clientes/conductores con solicitudes aprobadas
 * que no se reflejaron debido al bug de falta de actualización de saldo.
 *
 * SEGURO PARA RE-EJECUTAR: Solo aplica solicitudes donde saldoNuevo es NULL
 * (indica que el saldo nunca fue aplicado al aprobar).
 */

const path = require('path');
const { Op } = require('sequelize');

// Configurar la ruta del módulo de modelos
const modelsPath = path.join(__dirname, '../../models');
const { Cliente, Conductor, Transaccion } = require(modelsPath);

async function corregirSaldosSolicitudesAprobadas() {
  try {
    console.log('🔧 Iniciando corrección de saldos...\n');

    // Solo buscar solicitudes aprobadas donde saldoNuevo es NULL
    // (significa que se aprobaron antes del fix y el saldo nunca se aplicó)
    const solicitudesAprobadas = await Transaccion.findAll({
      where: {
        tipo: 'solicitud_compra',
        estado: 'aprobada',
        saldoNuevo: { [Op.is]: null }
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`📋 Encontradas ${solicitudesAprobadas.length} solicitudes aprobadas SIN saldo aplicado\n`);

    if (solicitudesAprobadas.length === 0) {
      console.log('✅ Todas las solicitudes ya tienen el saldo aplicado correctamente.\n');
      process.exit(0);
      return;
    }

    let clientesActualizados = 0;
    let conductoresActualizados = 0;
    let errores = 0;

    for (const solicitud of solicitudesAprobadas) {
      try {
        console.log(`\n⚙️  Procesando solicitud ID: ${solicitud.id}`);
        console.log(`   Tipo solicitante: ${solicitud.solicitadoPor}`);
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

          await conductor.update({ saldo: nuevoSaldo });
          await solicitud.update({ saldoAnterior, saldoNuevo: nuevoSaldo });
          conductoresActualizados++;
          console.log(`   ✅ Conductor actualizado`);

        } else {
          // Actualizar saldo del cliente (dueño de bus)
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
          
          await cliente.update({ saldo: nuevoSaldo });
          await solicitud.update({ saldoAnterior, saldoNuevo: nuevoSaldo });
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
