const { Frecuencia, Ruta, Bus, Conductor, Cliente, ConfiguracionMantenimiento, LimiteRutaBus } = require("../models");
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

const getFrecuencias = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.rol;
    const isPaginated = req.query.page || req.query.limit;

    let whereClause = {};
    let cacheKeyPrefix = 'frecuencias';
    
    // Si es cliente, solo mostrar frecuencias de sus buses
    if (userRole === 'cliente') {
      // Primero obtener el registro del cliente usando el userId
      const cliente = await Cliente.findOne({
        where: { userId: userId }
      });
      
      if (cliente) {
        // Ahora obtener todos los buses del cliente usando el clienteId
        const buses = await Bus.findAll({
          where: { usuarioId: cliente.id }
        });
        
        const busIds = buses.map(bus => bus.id);
        
        // Filtrar frecuencias solo de esos buses
        if (busIds.length > 0) {
          whereClause.busId = busIds;
          cacheKeyPrefix = `frecuencias_cliente_${cliente.id}`;
        } else {
          // Si no tiene buses, retornar array vacío
          whereClause.busId = [];
        }
      } else {
        // Si no hay cliente, retornar array vacío
        whereClause.busId = [];
      }
    }
    // Si es conductor, mostrar solo sus frecuencias
    else if (userRole === 'conductor') {
      const conductor = await Conductor.findOne({
        where: { usuarioId: userId }
      });
      
      if (conductor) {
        whereClause.conductorId = conductor.id;
        cacheKeyPrefix = `frecuencias_conductor_${conductor.id}`;
      } else {
        whereClause.conductorId = null;
      }
    }
    // Si es admin o tesoreria, mostrar todas
    else {
      cacheKeyPrefix = 'frecuencias_all';
    }

    if (isPaginated) {
      // CON PAGINACIÓN
      const { limit, offset, sort, order } = req.pagination || {
        limit: 10,
        offset: 0,
        sort: 'fecha',
        order: 'DESC'
      };
      
      const cacheKey = `${cacheKeyPrefix}_page_${req.pagination?.page || 1}_limit_${limit}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { count, rows } = await Frecuencia.findAndCountAll({
        where: whereClause,
        include: [
          { model: Bus, required: false },
          { model: Conductor, required: false }
        ],
        ...getSequelizePaginationOptions(req),
        order: [[sort, order]]
      });
      
      // Cargar rutas manualmente
      for (let frec of rows) {
        if (frec.rutaId) {
          const ruta = await Ruta.findByPk(frec.rutaId);
          frec.dataValues.Ruta = ruta;
        }
      }
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      cacheService.set(cacheKey, response, 180);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN
      const cacheKey = cacheKeyPrefix;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const frecuencias = await Frecuencia.findAll({
        where: whereClause,
        include: [
          { model: Bus, required: false },
          { model: Conductor, required: false }
        ],
        order: [["fecha", "DESC"]],
      });
      
      // Cargar rutas manualmente
      for (let frec of frecuencias) {
        if (frec.rutaId) {
          const ruta = await Ruta.findByPk(frec.rutaId);
          frec.dataValues.Ruta = ruta;
        }
      }
      
      cacheService.set(cacheKey, frecuencias, 180);
      res.json(frecuencias);
    }
  } catch (error) {
    console.error('Error en getFrecuencias:', error);
    res.status(500).json({ message: "Error al obtener frecuencias" });
  }
};

const createFrecuencia = async (req, res) => {
  const { fecha, horaSalida, rutaId, busId, fechaSalida, conductorId } = req.body;

  try {
    // Verificar si hay una limpieza programada y si estamos en período de bloqueo
    const config = await ConfiguracionMantenimiento.findOne();
    
    if (config && config.bloquear_frecuencias) {
      const ahora = new Date();
      const inicioBloqueo = config.fecha_inicio_bloqueo ? new Date(config.fecha_inicio_bloqueo) : null;
      const finBloqueo = config.fecha_fin_bloqueo ? new Date(config.fecha_fin_bloqueo) : null;
      
      if (inicioBloqueo && finBloqueo && ahora >= inicioBloqueo && ahora <= finBloqueo) {
        const fechaLimpieza = config.fecha_limpieza ? new Date(config.fecha_limpieza).toLocaleDateString('es-ES') : 'pronto';
        return res.status(403).json({ 
          error: "SISTEMA EN MANTENIMIENTO",
          message: `No se pueden registrar frecuencias. El sistema realizará una limpieza anual el ${fechaLimpieza}. Por favor, intente después de esta fecha.`,
          fecha_limpieza: config.fecha_limpieza,
          fecha_fin_bloqueo: config.fecha_fin_bloqueo
        });
      }
    }

    // Obtener el costo de la ruta
    const ruta = await Ruta.findByPk(rutaId);
    if (!ruta) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    const costoRuta = parseFloat(ruta.precio || 0);
    
    // Obtener el bus para saber el clienteId
    const bus = await Bus.findByPk(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus no encontrado" });
    }

    // Verificar si existe un límite específico para este bus en esta ruta
    const limiteConfig = await LimiteRutaBus.findOne({
      where: {
        busId: busId,
        rutaId: rutaId
      }
    });

    if (limiteConfig) {
      const { Op } = require('sequelize');
      const fechaBusqueda = fechaSalida || fecha;
      
      // Contar cuántas veces este bus ha hecho ESTA RUTA ESPECÍFICA en el día
      const frecuenciasExistentes = await Frecuencia.count({
        where: {
          busId: busId,
          rutaId: rutaId,  // ← Clave: validar por ruta específica
          fecha: fechaBusqueda,
          estadoVerificacion: {
            [Op.in]: ['pendiente', 'verificado']
          }
        }
      });

      // Si ya alcanzó el límite para esta ruta, rechazar
      if (frecuenciasExistentes >= limiteConfig.limiteDiario) {
        return res.status(400).json({ 
          error: "LÍMITE DE RUTA ALCANZADO",
          message: `Este bus ha alcanzado su límite de ${limiteConfig.limiteDiario} viaje(s) en esta ruta por día. Ya tiene ${frecuenciasExistentes} frecuencia(s) de "${ruta.origen} → ${ruta.destino}" para el ${fechaBusqueda}.`,
          limiteDiario: limiteConfig.limiteDiario,
          frecuenciasRegistradas: frecuenciasExistentes,
          ruta: `${ruta.origen} → ${ruta.destino}`
        });
      }
    }

    // Obtener el conductor seleccionado
    if (!conductorId) {
      return res.status(400).json({ message: "Debe seleccionar un conductor" });
    }

    const conductor = await Conductor.findByPk(conductorId);
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }

    // Verificar que el conductor tenga saldo suficiente
    const saldoConductor = parseFloat(conductor.saldo || 0);
    if (saldoConductor < costoRuta) {
      return res.status(400).json({ 
        message: `El conductor no tiene saldo suficiente. Saldo actual: $${saldoConductor.toFixed(2)}, Costo de la ruta: $${costoRuta.toFixed(2)}` 
      });
    }

    // Restar del saldo del conductor
    await conductor.update({ saldo: saldoConductor - costoRuta });

    // Determinar quién registra (cliente o conductor)
    const registradoPor = req.user.rol === "conductor" ? "conductor" : "cliente";

    // Generar ticket ID único y código QR
    const ticketId = uuidv4();
    const qrCodeData = JSON.stringify({
      ticketId,
      rutaId,
      busId,
      conductorId,
      fecha: fechaSalida || fecha,
      horaSalida
    });
    
    // Generar el código QR como imagen base64
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    const nueva = await Frecuencia.create({
      fecha: fechaSalida || fecha,
      horaSalida,
      rutaId,
      busId,
      conductorId,
      registradoPor,
      ticketId,
      qrCode: qrCodeImage,
      estadoVerificacion: 'pendiente'
    });
    
    // Invalidar caché de frecuencias
    cacheService.delPattern('frecuencias_*');
    cacheService.del(`conductor_${conductorId}`);
    cacheService.del(`conductor_usuario_${conductor.usuarioId}`); // Invalidar también por usuarioId
    
    res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear frecuencia:', error);
    res.status(400).json({ message: "Error al registrar frecuencia", error: error.message });
  }
};

const updateFrecuencia = async (req, res) => {
  const { id } = req.params;
  const { fecha, horaSalida, rutaId, busId } = req.body;

  const frecuencia = await Frecuencia.findByPk(id);
  if (!frecuencia) return res.status(404).json({ message: "No encontrada" });

  frecuencia.fecha = fecha;
  frecuencia.horaSalida = horaSalida;
  frecuencia.rutaId = rutaId;
  frecuencia.busId = busId;

  await frecuencia.save();
  
  // Invalidar caché
  cacheService.delPattern('frecuencias_*');
  
  res.json(frecuencia);
};

const deleteFrecuencia = async (req, res) => {
  const { id } = req.params;
  const frecuencia = await Frecuencia.findByPk(id);
  if (!frecuencia) return res.status(404).json({ message: "No encontrada" });

  await frecuencia.destroy();
  
  // Invalidar caché
  cacheService.delPattern('frecuencias_*');
  
  res.json({ message: "Frecuencia eliminada correctamente" });
};

const getFrecuenciaById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const frecuencia = await Frecuencia.findByPk(id, {
      include: [
        { model: Bus, required: false },
        { model: Conductor, required: false }
      ]
    });

    if (!frecuencia) {
      return res.status(404).json({ message: "Frecuencia no encontrada" });
    }

    // Cargar ruta manualmente
    if (frecuencia.rutaId) {
      const ruta = await Ruta.findByPk(frecuencia.rutaId);
      frecuencia.dataValues.Ruta = ruta;
    }

    // Control de acceso: conductor solo puede ver sus propias frecuencias
    if (userRole === 'conductor') {
      const conductor = await Conductor.findOne({ where: { usuarioId: userId } });
      if (!conductor || frecuencia.conductorId !== conductor.id) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
    }

    res.json(frecuencia);
  } catch (error) {
    console.error('Error en getFrecuenciaById:', error);
    res.status(500).json({ message: "Error al obtener la frecuencia" });
  }
};

module.exports = {
  getFrecuencias,
  getFrecuenciaById,
  createFrecuencia,
  updateFrecuencia,
  deleteFrecuencia,
};
