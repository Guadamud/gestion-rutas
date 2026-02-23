const cron = require('node-cron');
const { User } = require('../models');
const { Op } = require('sequelize');

let jobActivo = null;

/**
 * Servicio para eliminar automáticamente las claves temporales expiradas
 */
const iniciarServicioLimpiezaClaves = () => {
  if (jobActivo) {
    console.log('⚠️  Servicio de limpieza de claves temporales ya está activo');
    return;
  }

  // Ejecutar cada 5 minutos
  jobActivo = cron.schedule('*/5 * * * *', async () => {
    try {
      await limpiarClavesExpiradas();
    } catch (error) {
      console.error('❌ Error en limpieza de claves temporales:', error);
    }
  });

  console.log('✅ Servicio de limpieza de claves temporales iniciado (cada 5 minutos)');
  
  // Ejecutar inmediatamente al iniciar
  limpiarClavesExpiradas();
};

/**
 * Buscar y eliminar claves temporales expiradas
 */
const limpiarClavesExpiradas = async () => {
  try {
    const ahora = new Date();
    
    // Buscar usuarios con claves temporales expiradas
    const usuariosConClavesExpiradas = await User.findAll({
      where: {
        es_clave_temporal: true,
        clave_expiracion: {
          [Op.lt]: ahora // Menor que ahora = expirada
        }
      },
      attributes: ['id', 'nombres', 'apellidos', 'clave_expiracion']
    });

    if (usuariosConClavesExpiradas.length === 0) {
      console.log('🔍 No hay claves temporales expiradas para eliminar');
      return;
    }

    console.log(`🗑️  Encontradas ${usuariosConClavesExpiradas.length} claves temporales expiradas`);

    // Eliminar las claves expiradas
    const resultado = await User.update(
      {
        clave_autorizacion: null,
        clave_autorizacion_texto: null,
        es_clave_temporal: false,
        clave_expiracion: null,
        clave_temporal_usada_por: [] // Limpiar la lista también
      },
      {
        where: {
          es_clave_temporal: true,
          clave_expiracion: {
            [Op.lt]: ahora
          }
        }
      }
    );

    console.log(`✅ ${resultado[0]} claves temporales expiradas eliminadas exitosamente`);
    
    // Mostrar detalles
    usuariosConClavesExpiradas.forEach(usuario => {
      console.log(`   - ${usuario.nombres} ${usuario.apellidos} (expiró: ${usuario.clave_expiracion.toLocaleString('es-ES')})`);
    });

  } catch (error) {
    console.error('❌ Error al limpiar claves expiradas:', error);
  }
};

/**
 * Detener el servicio de limpieza
 */
const detenerServicioLimpiezaClaves = () => {
  if (jobActivo) {
    jobActivo.stop();
    jobActivo = null;
    console.log('🛑 Servicio de limpieza de claves temporales detenido');
  }
};

module.exports = {
  iniciarServicioLimpiezaClaves,
  detenerServicioLimpiezaClaves,
  limpiarClavesExpiradas // Exportar para poder ejecutar manualmente
};
