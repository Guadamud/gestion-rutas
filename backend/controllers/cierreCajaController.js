const { CierreCaja, User, Transaccion, Frecuencia } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

// Obtener datos del día para cerrar caja (sin caché - datos dinámicos)
exports.obtenerDatosDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    const userId = req.user.id;

    // Solo cierre diario
    const fechaCierre = fecha || new Date().toISOString().split("T")[0];
    const fechaInicio = fechaCierre;
    const fechaFin = fechaCierre;
    const periodo = fechaCierre;

    // Calcular monto total del sistema - TODAS las solicitudes aprobadas SIN CIERRE (cualquier fecha)
    const transacciones = await Transaccion.findAll({
      where: {
        estado: "aprobada",
        tipo: "solicitud_compra",
        incluidoEnCierreId: null // Solo pendientes de cierre
      },
      order: [['fecha', 'ASC']]
    });

    const montoSistema = transacciones.reduce(
      (sum, t) => sum + parseFloat(t.monto || 0),
      0
    );

    // Contar solicitudes pendientes de cierre (cualquier fecha)
    const totalSolicitudes = await Transaccion.count({
      where: {
        tipo: "solicitud_compra",
        incluidoEnCierreId: null // Solo pendientes
      },
    });

    const solicitudesAprobadas = transacciones.length;

    // Contar frecuencias del día actual
    const totalFrecuencias = await Frecuencia.count({
      where: {
        fecha: fechaInicio,
      },
    });

    // Obtener rango de fechas de las transacciones pendientes
    let rangoFechas = "Sin transacciones pendientes";
    if (transacciones.length > 0) {
      const fechas = transacciones.map(t => new Date(t.fecha).toLocaleDateString('es-ES'));
      const fechasUnicas = [...new Set(fechas)].sort();
      if (fechasUnicas.length === 1) {
        rangoFechas = fechasUnicas[0];
      } else {
        rangoFechas = `${fechasUnicas[0]} - ${fechasUnicas[fechasUnicas.length - 1]} (${fechasUnicas.length} días)`;
      }
    }

    res.json({
      fecha: fechaInicio,
      periodo: periodo,
      monto_sistema: montoSistema.toFixed(2),
      total_solicitudes: totalSolicitudes,
      solicitudes_aprobadas: solicitudesAprobadas,
      total_frecuencias: totalFrecuencias,
      rango_fechas_pendientes: rangoFechas,
      incluye_dias_anteriores: transacciones.some(t => {
        const fechaT = new Date(t.fecha).toISOString().split('T')[0];
        return fechaT !== fechaInicio;
      })
    });
  } catch (error) {
    console.error("Error al obtener datos del día:", error);
    res.status(500).json({ error: "Error al obtener datos del día" });
  }
};

// Verificar clave de autorización del administrador
exports.verificarClaveAdmin = async (req, res) => {
  try {
    const { clave } = req.body;

    if (!clave) {
      return res.status(400).json({ error: "La clave es requerida" });
    }

    // Cache corto para verificaciones de clave (60s)
    const cacheKey = `admin_clave_verificacion`;
    const cachedAdmin = cacheService.get(cacheKey);
    
    const administrador = cachedAdmin || await User.findOne({
      where: { 
        rol: "admin",
        clave_autorizacion: { [Op.ne]: null }
      }
    });
    
    if (administrador && !cachedAdmin) {
      cacheService.set(cacheKey, administrador, 60);
    }

    if (!administrador) {
      return res.status(404).json({ 
        error: "No hay administradores con clave configurada. Configure una clave primero." 
      });
    }

    // Verificar si es una clave temporal que ha expirado
    if (administrador.es_clave_temporal && administrador.clave_expiracion) {
      const ahora = new Date();
      const expiracion = new Date(administrador.clave_expiracion);
      
      if (ahora > expiracion) {
        return res.status(401).json({ 
          error: "La clave temporal ha expirado. Contacta al administrador para establecer una nueva clave.",
          autorizado: false,
          clave_expirada: true
        });
      }
    }

    // Verificar si este usuario YA usó esta clave temporal
    if (administrador.es_clave_temporal) {
      const usuariosQueUsaron = administrador.clave_temporal_usada_por || [];
      if (usuariosQueUsaron.includes(req.user.id)) {
        return res.status(403).json({ 
          error: "Ya utilizaste esta clave temporal. Cada usuario solo puede usarla UNA VEZ.",
          autorizado: false,
          ya_usada: true
        });
      }
    }

    // Verificar la clave
    const claveValida = await bcrypt.compare(clave, administrador.clave_autorizacion);

    if (!claveValida) {
      return res.status(401).json({ 
        error: "Clave de autorización incorrecta",
        autorizado: false 
      });
    }

    // Ya no eliminamos la clave después de usarla
    // Solo se elimina cuando expire el tiempo establecido
    const esTemporal = administrador.es_clave_temporal;

    res.json({ 
      mensaje: "Clave verificada correctamente",
      autorizado: true,
      es_temporal: esTemporal,
      expira: administrador.clave_expiracion,
      administrador: {
        id: administrador.id,
        nombres: administrador.nombres,
        apellidos: administrador.apellidos
      }
    });
  } catch (error) {
    console.error("Error al verificar clave de administrador:", error);
    res.status(500).json({ error: "Error al verificar clave de autorización" });
  }
};

// Registrar cierre de caja
exports.registrarCierre = async (req, res) => {
  try {
    const {
      fecha,
      monto_real,
      observaciones,
      clave_admin, // Nueva: clave del administrador para autorizar
    } = req.body;

    // Validar que se proporcione la clave de autorización
    if (!clave_admin) {
      return res.status(400).json({ 
        error: "Se requiere la clave de autorización del administrador para cerrar caja" 
      });
    }

    // Obtener userId al inicio
    const userId = req.user.id;

    // Verificar la clave del administrador
    const administrador = await User.findOne({
      where: { 
        rol: "admin",
        clave_autorizacion: { [Op.ne]: null }
      }
    });

    if (!administrador) {
      return res.status(404).json({ 
        error: "No hay administradores con clave configurada" 
      });
    }

    // Verificar si es una clave temporal que ha expirado
    if (administrador.es_clave_temporal && administrador.clave_expiracion) {
      const ahora = new Date();
      const expiracion = new Date(administrador.clave_expiracion);
      
      if (ahora > expiracion) {
        return res.status(401).json({ 
          error: "❌ La clave temporal ha expirado. No se puede autorizar el cierre. Contacta al administrador." 
        });
      }
    }

    // Verificar si este usuario YA usó esta clave temporal
    if (administrador.es_clave_temporal) {
      const usuariosQueUsaron = administrador.clave_temporal_usada_por || [];
      if (usuariosQueUsaron.includes(userId)) {
        return res.status(403).json({ 
          error: "❌ Ya utilizaste esta clave temporal. Cada usuario solo puede usarla UNA VEZ. Contacta al administrador para obtener una nueva clave." 
        });
      }
    }

    const claveValida = await bcrypt.compare(clave_admin, administrador.clave_autorizacion);

    if (!claveValida) {
      return res.status(401).json({ 
        error: "❌ Clave de autorización incorrecta. Verifica la clave con el administrador." 
      });
    }

    // Si es clave temporal, registrar que este usuario ya la usó
    if (administrador.es_clave_temporal) {
      const usuariosQueUsaron = administrador.clave_temporal_usada_por || [];
      usuariosQueUsaron.push(userId);
      
      await User.update(
        { clave_temporal_usada_por: usuariosQueUsaron },
        { where: { id: administrador.id } }
      );
      
      console.log(`✅ Usuario ${userId} registrado como usuario de clave temporal`);
    }

    const fechaCierre = fecha || new Date().toISOString().split("T")[0];
    const periodoStr = fechaCierre;

    console.log('🔍 Verificando cierres existentes:', { periodoStr, userId });

    // Contar cuántos cierres ya existen para este día y este usuario
    const numeroCierresExistentes = await CierreCaja.count({
      where: { 
        periodo: periodoStr,
        cerradoPorId: userId 
      },
    });

    console.log(`📊 Cierres existentes hoy: ${numeroCierresExistentes}`);

    // Usar solo fechaCierre (diario)
    const fechaInicio = fechaCierre;
    const fechaFin = fechaCierre;

    // Obtener TODAS las solicitudes aprobadas SIN CIERRE (cualquier fecha)
    const transacciones = await Transaccion.findAll({
      where: {
        estado: "aprobada",
        tipo: "solicitud_compra",
        incluidoEnCierreId: null // IMPORTANTE: Solo las que NO están en un cierre
      },
      order: [['fecha', 'ASC']]
    });

    const montoSistema = transacciones.reduce(
      (sum, t) => sum + parseFloat(t.monto || 0),
      0
    );

    // Contar solo transacciones pendientes de cierre (cualquier fecha)
    const totalSolicitudes = await Transaccion.count({
      where: {
        tipo: "solicitud_compra",
        incluidoEnCierreId: null // Solo pendientes
      },
    });

    const solicitudesAprobadas = transacciones.length;

    // Determinar si incluye días anteriores
    const fechasTransacciones = transacciones.map(t => new Date(t.fecha).toISOString().split('T')[0]);
    const incluyeDiasAnteriores = fechasTransacciones.some(f => f !== fechaCierre);
    const fechasUnicas = [...new Set(fechasTransacciones)].sort();
    
    // Contar frecuencias del día actual
    const totalFrecuencias = await Frecuencia.count({
      where: {
        fecha: fechaCierre,
      },
    });

    // Calcular diferencia
    const diferencia = parseFloat(monto_real) - montoSistema;

    // Obtener hora actual
    const ahora = new Date();
    const horaCierre = ahora.toTimeString().split(" ")[0];

    // Determinar si es cierre parcial o final
    let tipoCierre = numeroCierresExistentes > 0 ? `Cierre Parcial #${numeroCierresExistentes + 1}` : 'Cierre Diario';
    
    // Añadir nota si incluye días anteriores
    if (incluyeDiasAnteriores) {
      tipoCierre += ` (incluye pendientes de ${fechasUnicas.length} días)`;
    }
    
    const observacionesFinal = observaciones 
      ? `${tipoCierre} - ${observaciones}` 
      : tipoCierre;

    // Crear registro de cierre
    const cierre = await CierreCaja.create({
      fecha: fechaCierre,
      tipo_cierre: "diario",
      periodo: periodoStr,
      hora_cierre: horaCierre,
      monto_sistema: montoSistema.toFixed(2),
      monto_real: parseFloat(monto_real).toFixed(2),
      diferencia: diferencia.toFixed(2),
      total_solicitudes: totalSolicitudes,
      solicitudes_aprobadas: solicitudesAprobadas,
      total_frecuencias: totalFrecuencias,
      observaciones: observacionesFinal,
      estado: "CERRADO",
      cerradoPorId: userId,
    });

    // Marcar TODAS las transacciones pendientes como incluidas en este cierre
    const [numActualizadas] = await Transaccion.update(
      { incluidoEnCierreId: cierre.id },
      {
        where: {
          estado: "aprobada",
          tipo: "solicitud_compra",
          incluidoEnCierreId: null // Solo marcar las que no tienen cierre aún
        }
      }
    );

    console.log(`✅ ${numActualizadas} transacciones marcadas con cierreId:`, cierre.id);
    if (incluyeDiasAnteriores) {
      console.log(`📅 Incluye transacciones de: ${fechasUnicas.join(', ')}`);
    }

    // Obtener el cierre con información del usuario
    const cierreCompleto = await CierreCaja.findByPk(cierre.id, {
      include: [
        {
          model: User,
          as: "cerradoPor",
          attributes: ["id", "nombres", "apellidos", "email"],
        },
      ],
    });

    // Invalidar cache de cierres, transacciones y frecuencias
    cacheService.delPattern('cierres_*');
    cacheService.delPattern('transacciones_*');
    cacheService.delPattern('frecuencias_*');
    cacheService.delPattern('solicitudes_*');

    res.status(201).json({
      mensaje: "Cierre de caja registrado exitosamente",
      cierre: cierreCompleto
    });
  } catch (error) {
    console.error("Error al registrar cierre de caja:", error);
    res.status(500).json({ error: "Error al registrar cierre de caja" });
  }
};

// Obtener historial de cierres
exports.obtenerHistorialCierres = async (req, res) => {
  try {
    const { mes, anio, limite, page, limit } = req.query;
    const userId = req.user.id;
    const userRol = req.user.rol;
    
    // Construir clave de cache basada en parámetros
    const cacheKey = `cierres_historial_${userRol}_${userId}_${mes || 'all'}_${anio || 'all'}_${limite || 'all'}_${page || 'all'}_${limit || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    // Si es admin, puede ver todos los cierres. Si no, solo los suyos.
    let whereCondition = {};
    
    if (userRol !== 'admin') {
      whereCondition.cerradoPorId = userId; // Solo cierres del usuario actual
    }
    // Si es admin, whereCondition queda vacío para ver todos

    if (mes && anio) {
      const mesNum = parseInt(mes);
      const anioNum = parseInt(anio);
      
      // Calcular primer y último día del mes en formato string
      const primerDia = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
      const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
      const ultimoDiaMes = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
      
      console.log('🔍 Filtrando historial:', { primerDia, ultimoDiaMes, userId, rol: userRol });
      
      whereCondition.fecha = {
        [Op.gte]: primerDia,
        [Op.lte]: ultimoDiaMes,
      };
    }
    
    // Soporte de paginación opcional
    const isPaginated = req.query.page || req.query.limit;
    let queryOptions = {
      where: whereCondition,
      include: [
        {
          model: User,
          as: "cerradoPor",
          attributes: ["id", "nombres", "apellidos", "email", "rol"],
        },
      ],
      order: [["fecha", "DESC"], ["hora_cierre", "DESC"]],
      limit: limite ? parseInt(limite) : undefined,
    };
    
    if (isPaginated && req.pagination) {
      Object.assign(queryOptions, req.pagination.sequelizeOptions);
    }

    const cierres = isPaginated 
      ? await CierreCaja.findAndCountAll(queryOptions)
      : await CierreCaja.findAll(queryOptions);

    console.log(`📋 Cierres encontrados para ${userRol}:`, isPaginated ? cierres.count : cierres.length);

    const response = isPaginated 
      ? { cierres: cierres.rows, ...req.pagination.metadata(cierres.count) }
      : cierres;
    
    cacheService.set(cacheKey, response, 180); // Cache de 3 minutos
    res.json(response);
  } catch (error) {
    console.error("Error al obtener historial de cierres:", error);
    res.status(500).json({ error: "Error al obtener historial de cierres" });
  }
};

// Obtener resumen mensual de cierres
exports.obtenerResumenMensual = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const userId = req.user.id;
    const userRol = req.user.rol;
    
    if (!mes || !anio) {
      return res.status(400).json({
        error: "Se requieren mes y año",
      });
    }
    
    const cacheKey = `cierres_resumen_${mes}_${anio}_${userRol}_${userId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    // Calcular primer y último día del mes en formato string
    const primerDia = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    const ultimoDia = new Date(anioNum, mesNum, 0).getDate();
    const ultimoDiaMes = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

    let whereCondition = {
      fecha: {
        [Op.gte]: primerDia,
        [Op.lte]: ultimoDiaMes,
      }
    };

    // Si no es admin, filtrar solo sus cierres
    if (userRol !== 'admin') {
      whereCondition.cerradoPorId = userId;
    }

    const cierres = await CierreCaja.findAll({
      where: whereCondition,
    });

    const resumen = {
      total_cierres: cierres.length,
      monto_sistema_total: 0,
      monto_real_total: 0,
      diferencia_total: 0,
      cierres_con_faltante: 0,
      cierres_con_sobrante: 0,
      cierres_exactos: 0,
    };

    cierres.forEach((cierre) => {
      resumen.monto_sistema_total += parseFloat(cierre.monto_sistema);
      resumen.monto_real_total += parseFloat(cierre.monto_real);
      resumen.diferencia_total += parseFloat(cierre.diferencia);

      const dif = parseFloat(cierre.diferencia);
      if (dif < 0) {
        resumen.cierres_con_faltante++;
      } else if (dif > 0) {
        resumen.cierres_con_sobrante++;
      } else {
        resumen.cierres_exactos++;
      }
    });
    
    cacheService.set(cacheKey, resumen, 300); // Cache de 5 minutos
    res.json(resumen);
  } catch (error) {
    console.error("Error al obtener resumen mensual:", error);
    res.status(500).json({ error: "Error al obtener resumen mensual" });
  }
};

// Obtener un cierre específico por fecha
exports.obtenerCierrePorFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const userId = req.user.id;
    const userRol = req.user.rol;
    
    const cacheKey = `cierre_fecha_${fecha}_${userRol}_${userId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    let whereCondition = { fecha };
    
    // Si no es admin, solo puede ver sus propios cierres
    if (userRol !== 'admin') {
      whereCondition.cerradoPorId = userId;
    }

    const cierre = await CierreCaja.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "cerradoPor",
          attributes: ["id", "nombres", "apellidos", "email", "rol"],
        },
      ],
    });

    if (!cierre) {
      return res.status(404).json({
        error: "No se encontró cierre de caja para esta fecha",
      });
    }
    
    cacheService.set(cacheKey, cierre, 600); // Cache de 10 minutos
    res.json(cierre);
  } catch (error) {
    console.error("Error al obtener cierre:", error);
    res.status(500).json({ error: "Error al obtener cierre" });
  }
};

// Obtener historial de solicitudes aprobadas por el usuario (para exportar)
exports.obtenerSolicitudesAprobadas = async (req, res) => {
  try {
    const { mes, anio, fecha_inicio, fecha_fin, cierre_id } = req.query;
    const userId = req.user.id;
    const userRol = req.user.rol;
    
    // Cache con parámetros específicos
    const cacheKey = `solicitudes_aprobadas_${cierre_id || 'no'}_${mes || 'all'}_${anio || 'all'}_${fecha_inicio || 'no'}_${fecha_fin || 'no'}_${userRol}_${userId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    let whereCondition = {
      estado: "aprobada"
    };

    // Si se especifica un cierre_id, buscar solicitudes de ese cierre
    if (cierre_id) {
      // Obtener el cierre para saber quién lo cerró
      const cierre = await CierreCaja.findByPk(parseInt(cierre_id));
      
      if (!cierre) {
        return res.status(404).json({ error: "Cierre no encontrado" });
      }
      
      // Admin y tesoreria pueden ver cualquier cierre; otros roles solo los suyos
      if (userRol === 'admin' || userRol === 'tesoreria' || cierre.cerradoPorId === userId) {
        whereCondition.incluidoEnCierreId = parseInt(cierre_id);
      } else {
        return res.status(403).json({ error: "No tienes permiso para ver este cierre" });
      }
    } else {
      // Si no hay cierre_id, filtrar por usuario actual (solo para no admin)
      if (userRol !== 'admin') {
        whereCondition.aprobadoPorId = userId;
      }
      
      if (fecha_inicio && fecha_fin) {
        // Si hay rango de fechas específico
        whereCondition.updatedAt = {
          [Op.gte]: new Date(fecha_inicio + " 00:00:00"),
          [Op.lte]: new Date(fecha_fin + " 23:59:59"),
        };
      } else if (mes && anio) {
        // Si hay mes y año
        const mesNum = parseInt(mes);
        const anioNum = parseInt(anio);
        whereCondition.updatedAt = {
          [Op.gte]: new Date(anioNum, mesNum - 1, 1),
          [Op.lt]: new Date(anioNum, mesNum, 1),
        };
      }
    }

    const solicitudes = await Transaccion.findAll({
      where: whereCondition,
      include: [
        {
          model: require("../models/Cliente"),
          attributes: ["id", "nombres", "apellidos", "email"],
        },
        {
          model: require("../models/Conductor"),
          attributes: ["id", "nombre", "cedula"],
        },
      ],
      order: [["updatedAt", "DESC"]],
    });

    console.log(`📋 Solicitudes encontradas para exportar:`, solicitudes.length, { cierre_id, mes, anio, fecha_inicio, fecha_fin, userRol });
    
    cacheService.set(cacheKey, solicitudes, 180); // Cache de 3 minutos (datos variables)
    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener solicitudes aprobadas:", error);
    res.status(500).json({ error: "Error al obtener solicitudes aprobadas" });
  }
};

// Obtener cierre de caja por ID con información del usuario
exports.obtenerCierrePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const userRol = req.user.rol;

    // Solo admin y tesoreria pueden ver detalles
    if (userRol !== "admin" && userRol !== "tesoreria") {
      return res.status(403).json({ 
        error: "No tienes permiso para ver detalles de cierres" 
      });
    }
    
    const cacheKey = `cierre_id_${id}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    const cierre = await CierreCaja.findByPk(id, {
      include: [
        {
          model: User,
          as: 'cerradoPor',
          attributes: ["id", "nombres", "apellidos", "email", "rol"]
        }
      ]
    });

    if (!cierre) {
      return res.status(404).json({ error: "Cierre de caja no encontrado" });
    }
    
    cacheService.set(cacheKey, cierre, 600); // Cache de 10 minutos
    res.json(cierre);
  } catch (error) {
    console.error("Error al obtener cierre por ID:", error);
    res.status(500).json({ error: "Error al obtener cierre de caja" });
  }
};
