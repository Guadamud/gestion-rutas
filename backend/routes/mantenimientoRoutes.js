const express = require("express");
const { sequelize } = require("../config/database");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const { Frecuencia, Transaccion, CierreCaja, ConfiguracionMantenimiento } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

/**
 * Endpoint para limpieza anual de datos
 * Elimina: frecuencias, transacciones (historial de compras), cierres de caja
 * Mantiene: usuarios y sus saldos
 */
router.post("/limpiar-datos-anuales", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log("🗑️ Iniciando limpieza anual de datos...");
    
    // Validar que no haya datos pendientes
    const solicitudesPendientes = await Transaccion.count({
      where: {
        tipo: 'solicitud_compra',
        estado: 'pendiente'
      }
    });
    
    const frecuenciasPendientes = await Frecuencia.count({
      where: {
        estadoVerificacion: 'pendiente'
      }
    });
    
    const transaccionesSinCerrar = await Transaccion.count({
      where: {
        incluidoEnCierreId: null,
        estado: 'aprobada',
        tipo: 'solicitud_compra'
      }
    });
    
    // Bloquear limpieza si hay pendientes
    if (solicitudesPendientes > 0 || frecuenciasPendientes > 0 || transaccionesSinCerrar > 0) {
      await transaction.rollback();
      
      const problemas = [];
      if (solicitudesPendientes > 0) problemas.push(`${solicitudesPendientes} solicitudes pendientes de aprobar/rechazar`);
      if (frecuenciasPendientes > 0) problemas.push(`${frecuenciasPendientes} frecuencias pendientes de verificar`);
      if (transaccionesSinCerrar > 0) problemas.push(`${transaccionesSinCerrar} transacciones aprobadas sin incluir en cierre de caja`);
      
      return res.status(400).json({
        message: "No se puede realizar la limpieza. Hay procesos pendientes:",
        pendientes: {
          solicitudes: solicitudesPendientes,
          frecuencias: frecuenciasPendientes,
          transaccionesSinCerrar: transaccionesSinCerrar
        },
        detalles: problemas
      });
    }

    // Contar registros antes de eliminar
    const countFrecuencias = await Frecuencia.count();
    const countTransacciones = await Transaccion.count();
    const countCierres = await CierreCaja.count();

    // Eliminar frecuencias
    await Frecuencia.destroy({ where: {}, transaction });
    console.log(`✅ Eliminadas ${countFrecuencias} frecuencias`);

    // Eliminar transacciones (historial de compras de saldo)
    await Transaccion.destroy({ where: {}, transaction });
    console.log(`✅ Eliminadas ${countTransacciones} transacciones`);

    // Eliminar cierres de caja
    await CierreCaja.destroy({ where: {}, transaction });
    console.log(`✅ Eliminados ${countCierres} cierres de caja`);

    // Hacer commit primero
    await transaction.commit();
    console.log('✅ Transacción completada exitosamente');

    // Reiniciar secuencias DESPUÉS del commit (sin transacción)
    const frecuenciaTable = Frecuencia.getTableName();
    const transaccionTable = Transaccion.getTableName();
    const cierreTable = CierreCaja.getTableName();

    try {
      await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('${frecuenciaTable}', 'id'), 1, false)`
      );
      console.log('✅ Secuencia Frecuencias reiniciada');
    } catch (e) {
      console.log('⚠️ No se pudo reiniciar secuencia Frecuencias:', e.message);
    }

    try {
      await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('${transaccionTable}', 'id'), 1, false)`
      );
      console.log('✅ Secuencia Transacciones reiniciada');
    } catch (e) {
      console.log('⚠️ No se pudo reiniciar secuencia Transacciones:', e.message);
    }

    try {
      await sequelize.query(
        `SELECT setval(pg_get_serial_sequence('${cierreTable}', 'id'), 1, false)`
      );
      console.log('✅ Secuencia CierreCajas reiniciada');
    } catch (e) {
      console.log('⚠️ No se pudo reiniciar secuencia CierreCajas:', e.message);
    }

    res.json({
      message: "Limpieza anual completada exitosamente",
      registrosEliminados: {
        frecuencias: countFrecuencias,
        transacciones: countTransacciones,
        cierresCaja: countCierres,
        total: countFrecuencias + countTransacciones + countCierres
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error en limpieza anual:", error);
    res.status(500).json({
      message: "Error al realizar la limpieza anual de datos",
      error: error.message
    });
  }
});

/**
 * Obtener estadísticas de datos para confirmar antes de limpiar
 */
router.get("/estadisticas-limpieza", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const countFrecuencias = await Frecuencia.count();
    const countTransacciones = await Transaccion.count();
    const countCierres = await CierreCaja.count();
    
    // Contar datos pendientes que bloquean la limpieza
    const solicitudesPendientes = await Transaccion.count({
      where: {
        tipo: 'solicitud_compra',
        estado: 'pendiente'
      }
    });
    
    const frecuenciasPendientes = await Frecuencia.count({
      where: {
        estadoVerificacion: 'pendiente'
      }
    });
    
    const transaccionesSinCerrar = await Transaccion.count({
      where: {
        incluidoEnCierreId: null,
        estado: 'aprobada',
        tipo: 'solicitud_compra'
      }
    });

    res.json({
      frecuencias: countFrecuencias,
      transacciones: countTransacciones,
      cierresCaja: countCierres,
      total: countFrecuencias + countTransacciones + countCierres,
      pendientes: {
        solicitudes: solicitudesPendientes,
        frecuencias: frecuenciasPendientes,
        transaccionesSinCerrar: transaccionesSinCerrar,
        total: solicitudesPendientes + frecuenciasPendientes + transaccionesSinCerrar
      },
      puedeLimpiar: solicitudesPendientes === 0 && frecuenciasPendientes === 0 && transaccionesSinCerrar === 0
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      message: "Error al obtener estadísticas",
      error: error.message
    });
  }
});

/**
 * Configurar limpieza programada
 */
router.post("/configurar-limpieza", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { fecha_limpieza, fecha_inicio_bloqueo, fecha_fin_bloqueo } = req.body;

    if (!fecha_limpieza) {
      return res.status(400).json({ message: "La fecha de limpieza es requerida" });
    }

    // Validar que las fechas sean futuras
    const ahora = new Date();
    const fechaLimpiezaDate = new Date(fecha_limpieza);
    
    if (fechaLimpiezaDate < ahora) {
      return res.status(400).json({ message: "La fecha de limpieza debe ser futura" });
    }

    // Validar orden de fechas de bloqueo si están presentes
    if (fecha_inicio_bloqueo && fecha_fin_bloqueo) {
      const inicioDate = new Date(fecha_inicio_bloqueo);
      const finDate = new Date(fecha_fin_bloqueo);
      
      if (inicioDate >= finDate) {
        return res.status(400).json({ message: "La fecha de inicio debe ser antes que la fecha de fin del bloqueo" });
      }
    }

    // Buscar o crear configuración
    let config = await ConfiguracionMantenimiento.findOne();
    
    if (!config) {
      config = await ConfiguracionMantenimiento.create({
        limpieza_programada: true,
        fecha_limpieza: fechaLimpiezaDate,
        fecha_inicio_bloqueo: fecha_inicio_bloqueo ? new Date(fecha_inicio_bloqueo) : null,
        fecha_fin_bloqueo: fecha_fin_bloqueo ? new Date(fecha_fin_bloqueo) : null,
        bloquear_frecuencias: !!fecha_inicio_bloqueo,
        notificacion_enviada: false
      });
    } else {
      await config.update({
        limpieza_programada: true,
        fecha_limpieza: fechaLimpiezaDate,
        fecha_inicio_bloqueo: fecha_inicio_bloqueo ? new Date(fecha_inicio_bloqueo) : null,
        fecha_fin_bloqueo: fecha_fin_bloqueo ? new Date(fecha_fin_bloqueo) : null,
        bloquear_frecuencias: !!fecha_inicio_bloqueo,
        notificacion_enviada: false
      });
    }

    res.json({
      message: "Limpieza programada configurada exitosamente",
      configuracion: config
    });
  } catch (error) {
    console.error("Error al configurar limpieza:", error);
    res.status(500).json({ message: error.message || "Error al configurar limpieza programada" });
  }
});

/**
 * Obtener configuración actual de limpieza
 */
router.get("/configuracion-limpieza", verifyToken, async (req, res) => {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (!config) {
      return res.json({
        limpieza_programada: false,
        esta_en_periodo_bloqueo: false,
        dias_restantes: null
      });
    }

    const ahora = new Date();
    const fechaLimpieza = config.fecha_limpieza ? new Date(config.fecha_limpieza) : null;
    const estaEnPeriodoBloqueo = config.bloquear_frecuencias && 
      config.fecha_inicio_bloqueo && 
      config.fecha_fin_bloqueo &&
      ahora >= new Date(config.fecha_inicio_bloqueo) && 
      ahora <= new Date(config.fecha_fin_bloqueo);

    let diasRestantes = null;
    if (fechaLimpieza && fechaLimpieza > ahora) {
      diasRestantes = Math.ceil((fechaLimpieza - ahora) / (1000 * 60 * 60 * 24));
    }

    res.json({
      ...config.toJSON(),
      esta_en_periodo_bloqueo: estaEnPeriodoBloqueo,
      dias_restantes: diasRestantes,
      debe_notificar: diasRestantes !== null && diasRestantes <= 5 && !config.notificacion_enviada
    });
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({ message: error.message || "Error al obtener configuración" });
  }
});

/**
 * Cancelar limpieza programada
 */
router.post("/cancelar-limpieza", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (config) {
      await config.update({
        limpieza_programada: false,
        fecha_limpieza: null,
        fecha_inicio_bloqueo: null,
        fecha_fin_bloqueo: null,
        bloquear_frecuencias: false,
        notificacion_enviada: false
      });
    }

    res.json({ message: "Limpieza programada cancelada" });
  } catch (error) {
    console.error("Error al cancelar limpieza:", error);
    res.status(500).json({ message: error.message || "Error al cancelar limpieza" });
  }
});

/**
 * Marcar notificación como enviada
 */
router.post("/marcar-notificacion-enviada", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (config) {
      await config.update({ notificacion_enviada: true });
    }

    res.json({ message: "Notificación marcada como enviada" });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    res.status(500).json({ message: error.message || "Error al marcar notificación" });
  }
});

/**
 * Configurar limpieza automática gradual
 */
router.post("/configurar-limpieza-automatica", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const { 
      activa, 
      horario = "03:00", 
      lote = 1000, 
      intervalo = 5 
    } = req.body;

    if (lote < 100 || lote > 10000) {
      return res.status(400).json({ 
        message: "El tamaño de lote debe estar entre 100 y 10,000 registros" 
      });
    }

    if (intervalo < 1 || intervalo > 60) {
      return res.status(400).json({ 
        message: "El intervalo debe estar entre 1 y 60 minutos" 
      });
    }

    let config = await ConfiguracionMantenimiento.findOne();
    
    if (!config) {
      config = await ConfiguracionMantenimiento.create({
        limpieza_automatica_activa: activa,
        limpieza_automatica_horario: horario,
        limpieza_automatica_lote: lote,
        limpieza_automatica_intervalo: intervalo
      });
    } else {
      await config.update({
        limpieza_automatica_activa: activa,
        limpieza_automatica_horario: horario,
        limpieza_automatica_lote: lote,
        limpieza_automatica_intervalo: intervalo
      });
    }

    res.json({
      message: activa 
        ? "Limpieza automática activada. Se ejecutará gradualmente sin detener el sistema" 
        : "Limpieza automática desactivada",
      configuracion: config
    });
  } catch (error) {
    console.error("Error al configurar limpieza automática:", error);
    res.status(500).json({ message: error.message || "Error al configurar limpieza automática" });
  }
});

/**
 * Ejecutar un ciclo de limpieza gradual (elimina un lote de registros antiguos)
 */
router.post("/ejecutar-limpieza-gradual", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (!config || !config.limpieza_automatica_activa) {
      return res.status(400).json({ 
        message: "La limpieza automática no está activada" 
      });
    }

    const lote = config.limpieza_automatica_lote || 1000;
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 1); // Datos mayores a 1 año

    // Contar registros antiguos
    const frecuenciasAntiguas = await Frecuencia.count({
      where: {
        createdAt: { [Op.lt]: fechaLimite }
      }
    });

    const transaccionesAntiguas = await Transaccion.count({
      where: {
        createdAt: { [Op.lt]: fechaLimite },
        estado: { [Op.ne]: 'pendiente' }
      }
    });

    const cierresAntiguos = await CierreCaja.count({
      where: {
        createdAt: { [Op.lt]: fechaLimite }
      }
    });

    const totalAntiguos = frecuenciasAntiguas + transaccionesAntiguas + cierresAntiguos;

    if (totalAntiguos === 0) {
      // Marcar como completada
      await config.update({
        limpieza_automatica_en_progreso: false,
        limpieza_automatica_fecha_fin: new Date(),
        limpieza_automatica_progreso: {
          eliminados: 0,
          restantes: 0,
          porcentaje: 100
        }
      });

      return res.json({
        message: "No hay datos antiguos para eliminar",
        progreso: {
          eliminados: 0,
          restantes: 0,
          porcentaje: 100
        }
      });
    }

    // Iniciar limpieza si no está en progreso
    if (!config.limpieza_automatica_en_progreso) {
      await config.update({
        limpieza_automatica_en_progreso: true,
        limpieza_automatica_fecha_inicio: new Date(),
        limpieza_automatica_progreso: {
          eliminados: 0,
          restantes: totalAntiguos,
          porcentaje: 0
        }
      });
    }

    // Eliminar un lote de cada tipo
    const lotePorTabla = Math.ceil(lote / 3);
    let eliminadosEsteCliclo = 0;

    // Eliminar frecuencias antiguas
    const frecuenciasEliminar = await Frecuencia.findAll({
      where: {
        createdAt: { [Op.lt]: fechaLimite }
      },
      limit: lotePorTabla,
      attributes: ['id']
    });

    if (frecuenciasEliminar.length > 0) {
      await Frecuencia.destroy({
        where: {
          id: { [Op.in]: frecuenciasEliminar.map(f => f.id) }
        }
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
        where: {
          id: { [Op.in]: transaccionesEliminar.map(t => t.id) }
        }
      });
      eliminadosEsteCliclo += transaccionesEliminar.length;
    }

    // Eliminar cierres antiguos
    const cierresEliminar = await CierreCaja.findAll({
      where: {
        createdAt: { [Op.lt]: fechaLimite }
      },
      limit: lotePorTabla,
      attributes: ['id']
    });

    if (cierresEliminar.length > 0) {
      await CierreCaja.destroy({
        where: {
          id: { [Op.in]: cierresEliminar.map(c => c.id) }
        }
      });
      eliminadosEsteCliclo += cierresEliminar.length;
    }

    // Actualizar progreso
    const progresoActual = config.limpieza_automatica_progreso || { eliminados: 0 };
    const totalEliminados = (progresoActual.eliminados || 0) + eliminadosEsteCliclo;
    const restantes = totalAntiguos - totalEliminados;
    const porcentaje = Math.min(100, Math.round((totalEliminados / totalAntiguos) * 100));

    await config.update({
      limpieza_automatica_progreso: {
        eliminados: totalEliminados,
        restantes: Math.max(0, restantes),
        porcentaje: porcentaje
      }
    });

    // Si terminó, marcar como completada
    if (restantes <= 0) {
      await config.update({
        limpieza_automatica_en_progreso: false,
        limpieza_automatica_fecha_fin: new Date()
      });
    }

    res.json({
      message: `Lote procesado: ${eliminadosEsteCliclo} registros eliminados`,
      progreso: {
        eliminados: totalEliminados,
        restantes: Math.max(0, restantes),
        porcentaje: porcentaje,
        enProgreso: restantes > 0
      }
    });

  } catch (error) {
    console.error("Error en limpieza gradual:", error);
    res.status(500).json({ 
      message: "Error al ejecutar limpieza gradual", 
      error: error.message 
    });
  }
});

/**
 * Detener limpieza automática en progreso
 */
router.post("/detener-limpieza-automatica", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (config && config.limpieza_automatica_en_progreso) {
      await config.update({
        limpieza_automatica_en_progreso: false,
        limpieza_automatica_fecha_fin: new Date()
      });

      res.json({ 
        message: "Limpieza automática detenida",
        progreso: config.limpieza_automatica_progreso
      });
    } else {
      res.json({ message: "No hay limpieza en progreso" });
    }
  } catch (error) {
    console.error("Error al detener limpieza:", error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtener progreso de limpieza automática
 */
router.get("/progreso-limpieza-automatica", verifyToken, async (req, res) => {
  try {
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (!config) {
      return res.json({
        activa: false,
        enProgreso: false,
        progreso: null
      });
    }

    res.json({
      activa: config.limpieza_automatica_activa,
      enProgreso: config.limpieza_automatica_en_progreso,
      progreso: config.limpieza_automatica_progreso,
      fechaInicio: config.limpieza_automatica_fecha_inicio,
      fechaFin: config.limpieza_automatica_fecha_fin,
      horario: config.limpieza_automatica_horario,
      lote: config.limpieza_automatica_lote,
      intervalo: config.limpieza_automatica_intervalo
    });
  } catch (error) {
    console.error("Error al obtener progreso:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
