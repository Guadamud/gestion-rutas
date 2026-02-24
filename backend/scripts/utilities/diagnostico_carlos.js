/**
 * Diagnóstico conductores y sus recargas
 * Ejecutar en el Shell de Render: node scripts/utilities/diagnostico_carlos.js
 */

const { sequelize } = require('../../config/database');

async function diagnostico() {
  try {
    console.log('🔍 DIAGNÓSTICO CONDUCTORES Y RECARGAS\n');

    // 1. Todos los clientes
    const [clientes] = await sequelize.query(`
      SELECT id, nombres, apellidos, "userId"
      FROM clientes ORDER BY id
    `);
    console.log('👥 CLIENTES:');
    clientes.forEach(c => console.log(`  ID:${c.id} | ${c.nombres} ${c.apellidos} | userId:${c.userId}`));

    // 2. Todos los conductores
    const [conductores] = await sequelize.query(`
      SELECT id, nombres, apellidos, "clienteId", saldo
      FROM conductores ORDER BY "clienteId"
    `);
    console.log('\n🚌 CONDUCTORES:');
    conductores.forEach(c => console.log(`  ID:${c.id} | ${c.nombres} ${c.apellidos} | clienteId:${c.clienteId} | saldo:$${c.saldo}`));

    // 3. TODAS las transacciones tipo 'recarga'
    const [recargas] = await sequelize.query(`
      SELECT id, "conductorId", "clienteId", tipo, estado, monto, "createdAt"
      FROM transacciones
      WHERE tipo = 'recarga'
      ORDER BY "createdAt" DESC
      LIMIT 30
    `);
    console.log(`\n💰 TRANSACCIONES tipo='recarga' (total: ${recargas.length}):`);
    if (recargas.length === 0) {
      console.log('  ❌ NO HAY NINGUNA transacción de tipo recarga en toda la BD');
    } else {
      recargas.forEach(r => console.log(
        `  ID:${r.id} | conductorId:${r.conductorId} | clienteId:${r.clienteId} | estado:${r.estado} | monto:$${r.monto} | fecha:${new Date(r.createdAt).toLocaleString()}`
      ));
    }

    // 4. Todos los tipos distintos de transacciones
    const [tipos] = await sequelize.query(`
      SELECT tipo, estado, COUNT(*) as total
      FROM transacciones
      GROUP BY tipo, estado
      ORDER BY tipo, estado
    `);
    console.log('\n📊 RESUMEN GLOBAL POR TIPO/ESTADO:');
    tipos.forEach(t => console.log(`  tipo:${t.tipo} | estado:${t.estado} | cantidad:${t.total}`));

    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnostico();


async function diagnostico() {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO - HISTORIAL COMPRAS\n');

    // 1. Buscar todos los clientes
    const [clientes] = await sequelize.query(`
      SELECT id, nombres, apellidos, email, saldo, "userId"
      FROM clientes
      ORDER BY id
    `);
    console.log('👥 CLIENTES EN BD:');
    clientes.forEach(c => console.log(`  ID:${c.id} | ${c.nombres} ${c.apellidos} | userId:${c.userId} | Saldo:$${c.saldo}`));

    if (clientes.length === 0) {
      console.log('  ❌ No hay clientes registrados');
      process.exit(0);
    }

    // 2. Para cada cliente, ver sus transacciones
    for (const cliente of clientes) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`👤 ${cliente.nombres} ${cliente.apellidos} (ID: ${cliente.id})`);
      console.log(`${'═'.repeat(60)}`);

      const [transacciones] = await sequelize.query(`
        SELECT id, tipo, estado, monto, "metodoPago", "solicitadoPor", "conductorId", "createdAt"
        FROM transacciones
        WHERE "clienteId" = ${cliente.id}
        ORDER BY "createdAt" DESC
        LIMIT 20
      `);

      if (transacciones.length === 0) {
        console.log('  ❌ No tiene transacciones');
      } else {
        console.log(`  📋 Total transacciones: ${transacciones.length}`);
        transacciones.forEach(t => {
          console.log(`  ID:${t.id} | tipo:${t.tipo} | estado:${t.estado} | monto:$${t.monto} | solicitadoPor:${t.solicitadoPor} | conductorId:${t.conductorId} | fecha:${new Date(t.createdAt).toLocaleDateString()}`);
        });
      }

      // Contar por tipoy estado
      const [resumen] = await sequelize.query(`
        SELECT tipo, estado, COUNT(*) as total, SUM(monto) as suma
        FROM transacciones
        WHERE "clienteId" = ${cliente.id}
        GROUP BY tipo, estado
        ORDER BY tipo, estado
      `);
      if (resumen.length > 0) {
        console.log('\n  📊 RESUMEN:');
        resumen.forEach(r => console.log(`    ${r.tipo} | ${r.estado} | cantidad:${r.total} | total:$${parseFloat(r.suma).toFixed(2)}`));
      }
    }

    console.log('\n\n✅ Diagnóstico completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnostico();
