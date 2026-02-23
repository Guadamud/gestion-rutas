const cron = require('node-cron');
const { Frecuencia, Transaccion, CierreCaja, ConfiguracionMantenimiento } = require("../models");
const { Op } = require("sequelize");

let tareaLimpieza = null;
let intervaloLimpieza = null;

/**
 * Inicializar el servicio de limpieza automática
 */
async function iniciarServicioLimpieza() {
  try {
    console.log('🔧 Iniciando servicio de limpieza automática...');
    
    // Revisar cada hora si debe ejecutarse la limpieza
    tareaLimpieza = cron.schedule('0 * * * *', async () => {
      await verificarYEjecutarLimpieza();
    });

    console.log('✅ Servicio de limpieza automática iniciado');
  } catch (error) {
    console.error('❌ Error al iniciar servicio de limpieza:', error);
  }
}

/**
 * Verificar si debe ejecutarse la limpieza y ejecutarla
 */
async function verificarYEjecutarLimpieza() {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (!config || !config.limpieza_automatica_activa) {
      return; // No está activada
    }

    // Si ya hay una limpieza en progreso, continuar con ella
    if (config.limpieza_automatica_en_progreso) {
      await continuarLimpiezaGradual(config);
      return;
    }

    // Verificar si es el horario programado
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    
    if (horaActual === config.limpieza_automatica_horario) {
      console.log(`🕐 Hora de limpieza: ${horaActual}. Iniciando limpieza automática...`);
      await iniciarLimpiezaGradual(config);
    }
  } catch (error) {
    console.error('❌ Error en verificación de limpieza:', error);
  }
}

/**
 * Iniciar una nueva limpieza gradual
 */
async function iniciarLimpiezaGradual(config) {
  try {
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 1); // Datos mayores a 1 año

    // Contar registros antiguos
    const frecuenciasAntiguas = await Frecuencia.count({
      where: { createdAt: { [Op.lt]: fechaLimite } }
    });

    const transaccionesAntiguas = await Transaccion.count({
      where: {
        createdAt: { [Op.lt]: fechaLimite },
        estado: { [Op.ne]: 'pendiente' }
      }
    });

    const cierresAntiguos = await CierreCaja.count({
      where: { createdAt: { [Op.lt]: fechaLimite } }
    });

    const totalAntiguos = frecuenciasAntiguas + transaccionesAntiguas + cierresAntiguos;

    if (totalAntiguos === 0) {
      console.log('ℹ️  No hay datos antiguos para eliminar');
      return;
    }

    console.log(`📊 Datos antiguos encontrados: ${totalAntiguos} registros`);
    console.log(`   - Frecuencias: ${frecuenciasAntiguas}`);
    console.log(`   - Transacciones: ${transaccionesAntiguas}`);
    console.log(`   - Cierres: ${cierresAntiguos}`);

    // Marcar inicio de limpieza
    await config.update({
      limpieza_automatica_en_progreso: true,
      limpieza_automatica_fecha_inicio: new Date(),
      limpieza_automatica_progreso: {
        eliminados: 0,
        restantes: totalAntiguos,
        porcentaje: 0
      }
    });

    // Iniciar ciclos de eliminación
    await continuarLimpiezaGradual(config);
    
    // Programar siguientes ciclos
    const intervaloMinutos = config.limpieza_automatica_intervalo || 5;
    if (intervaloLimpieza) {
      clearInterval(intervaloLimpieza);
    }
    
    intervaloLimpieza = setInterval(async () => {
      const configActual = await ConfiguracionMantenimiento.findOne();
      if (configActual?.limpieza_automatica_en_progreso) {
        await continuarLimpiezaGradual(configActual);
      } else {
        clearInterval(intervaloLimpieza);
        intervaloLimpieza = null;
      }
    }, intervaloMinutos * 60 * 1000);

  } catch (error) {
    console.error('❌ Error al iniciar limpieza gradual:', error);
  }
}

/**
 * Continuar con la limpieza gradual (eliminar un lote)
 */
async function continuarLimpiezaGradual(config) {
  try {
    const lote = config.limpieza_automatica_lote || 1000;
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);

    const lotePorTabla = Math.ceil(lote / 3);
    let eliminadosEsteCliclo = 0;

    // Eliminar frecuencias antiguas
    const frecuenciasEliminar = await Frecuencia.findAll({
      where: { createdAt: { [Op.lt]: fechaLimite } },
      limit: lotePorTabla,
      attributes: ['id']
    });

    if (frecuenciasEliminar.length > 0) {
      await Frecuencia.destroy({
        where: { id: { [Op.in]: frecuenciasEliminar.map(f => f.id) } }
      });
      eliminadosEsteCliclo += frecuenciasEliminar.length;
    }

    // Eliminar transacciones antiguas (no pendientes)
    const transaccionesEliminar = await Transaccion.findAll({
      where: {
        createdAt: { [Op.lt]: fechaLimite },
        estado: { [Op.ne]: 'pendiente' }
      },
      limit: lotePorTabla,
      attributes: ['id']
    });

    if (transaccionesEliminar.length > 0) {
      await Transaccion.destroy({
        where: { id: { [Op.in]: transaccionesEliminar.map(t => t.id) } }
      });
      eliminadosEsteCliclo += transaccionesEliminar.length;
    }

    // Eliminar cierres antiguos
    const cierresEliminar = await CierreCaja.findAll({
      where: { createdAt: { [Op.lt]: fechaLimite } },
      limit: lotePorTabla,
      attributes: ['id']
    });

    if (cierresEliminar.length > 0) {
      await CierreCaja.destroy({
        where: { id: { [Op.in]: cierresEliminar.map(c => c.id) } }
      });
      eliminadosEsteCliclo += cierresEliminar.length;
    }

    // Actualizar progreso
    const progresoActual = config.limpieza_automatica_progreso || { eliminados: 0, restantes: 0 };
    const totalEliminados = (progresoActual.eliminados || 0) + eliminadosEsteCliclo;
    const restantes = Math.max(0, (progresoActual.restantes || 0) - eliminadosEsteCliclo);
    const totalOriginal = totalEliminados + restantes;
    const porcentaje = totalOriginal > 0 ? Math.min(100, Math.round((totalEliminados / totalOriginal) * 100)) : 100;

    await config.update({
      limpieza_automatica_progreso: {
        eliminados: totalEliminados,
        restantes: restantes,
        porcentaje: porcentaje
      }
    });

    console.log(`🧹 Lote procesado: ${eliminadosEsteCliclo} registros eliminados`);
    console.log(`   📊 Progreso: ${porcentaje}% (${totalEliminados}/${totalOriginal})`);

    // Si terminó, marcar como completada
    if (restantes <= 0 || eliminadosEsteCliclo === 0) {
      await config.update({
        limpieza_automatica_en_progreso: false,
        limpieza_automatica_fecha_fin: new Date(),
        ultima_limpieza: new Date(),
        registros_eliminados_ultima: {
          frecuencias: progresoActual.eliminados || 0,
          total: totalEliminados
        }
      });

      if (intervaloLimpieza) {
        clearInterval(intervaloLimpieza);
        intervaloLimpieza = null;
      }

      console.log(`✅ Limpieza automática completada. Total eliminados: ${totalEliminados}`);
    }

  } catch (error) {
    console.error('❌ Error en ciclo de limpieza gradual:', error);
  }
}

/**
 * Detener el servicio de limpieza automática
 */
function detenerServicioLimpieza() {
  if (tareaLimpieza) {
    tareaLimpieza.stop();
    tareaLimpieza = null;
  }
  if (intervaloLimpieza) {
    clearInterval(intervaloLimpieza);
    intervaloLimpieza = null;
  }
  console.log('🛑 Servicio de limpieza automática detenido');
}

module.exports = {
  iniciarServicioLimpieza,
  detenerServicioLimpieza
};
