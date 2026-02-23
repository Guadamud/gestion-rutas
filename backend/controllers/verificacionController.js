const { Frecuencia, User, Ruta, Bus, Conductor } = require("../models");
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

/**
 * Verificar un código QR/ticket
 */
const verificarTicket = async (req, res) => {
  const { ticketId } = req.body;
  
  try {
    // Verificar que el usuario tenga rol de verificador
    if (req.user.rol !== 'verificador') {
      return res.status(403).json({ 
        message: "Solo los verificadores pueden realizar esta acción" 
      });
    }

    // Buscar la frecuencia por ticketId
    const frecuencia = await Frecuencia.findOne({
      where: { ticketId },
      include: [
        { 
          model: Bus, 
          required: false,
          attributes: ['id', 'placa', 'numero']
        },
        { 
          model: Conductor, 
          required: false,
          attributes: ['id', 'nombre', 'cedula', 'telefono']
        },
        {
          model: Ruta,
          required: false,
          attributes: ['id', 'origen', 'destino', 'precio']
        }
      ]
    });

    if (!frecuencia) {
      return res.status(404).json({ 
        message: "Ticket no encontrado",
        error: "TICKET_NOT_FOUND"
      });
    }

    // Verificar si el ticket ya fue usado
    if (frecuencia.estadoVerificacion === 'usado') {
      return res.status(400).json({ 
        message: "Este ticket ya fue utilizado anteriormente",
        error: "TICKET_ALREADY_USED",
        fechaVerificacion: frecuencia.fechaVerificacion,
        verificadoPor: frecuencia.verificadoPor
      });
    }

    // Cargar ruta si no fue incluida automáticamente
    if (frecuencia.rutaId && !frecuencia.Ruta) {
      const ruta = await Ruta.findByPk(frecuencia.rutaId);
      frecuencia.dataValues.Ruta = ruta;
    }

    // Actualizar el estado a "usado"
    await frecuencia.update({
      estadoVerificacion: 'usado',
      verificadoPor: req.user.id,
      fechaVerificacion: new Date()
    });
    
    // Invalidar cache de verificaciones y frecuencias
    cacheService.delPattern('verificaciones_*');
    cacheService.delPattern('frecuencias_*');
    cacheService.delPattern(`ticket_${ticketId}`);

    // Obtener información del verificador
    const verificador = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombres', 'apellidos', 'cedula']
    });

    res.json({
      message: "Ticket verificado exitosamente",
      frecuencia: {
        ...frecuencia.toJSON(),
        Verificador: verificador
      }
    });
  } catch (error) {
    console.error('Error al verificar ticket:', error);
    res.status(500).json({ 
      message: "Error al verificar el ticket", 
      error: error.message 
    });
  }
};

/**
 * Obtener información de un ticket sin marcarlo como usado
 */
const consultarTicket = async (req, res) => {
  const { ticketId } = req.params;
  
  try {
    const cacheKey = `ticket_${ticketId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }
    
    const frecuencia = await Frecuencia.findOne({
      where: { ticketId },
      include: [
        { 
          model: Bus, 
          required: false,
          attributes: ['id', 'placa', 'numero']
        },
        { 
          model: Conductor, 
          required: false,
          attributes: ['id', 'nombre', 'cedula', 'telefono']
        },
        {
          model: Ruta,
          required: false,
          attributes: ['id', 'origen', 'destino', 'precio']
        }
      ]
    });

    if (!frecuencia) {
      return res.status(404).json({ 
        message: "Ticket no encontrado" 
      });
    }

    // Cargar ruta si no fue incluida automáticamente
    if (frecuencia.rutaId && !frecuencia.Ruta) {
      const ruta = await Ruta.findByPk(frecuencia.rutaId);
      frecuencia.dataValues.Ruta = ruta;
    }

    // Si está usado, obtener info del verificador
    let verificador = null;
    if (frecuencia.verificadoPor) {
      verificador = await User.findByPk(frecuencia.verificadoPor, {
        attributes: ['id', 'nombres', 'apellidos', 'cedula']
      });
    }
    
    const response = {
      ...frecuencia.toJSON(),
      Verificador: verificador
    };
    
    cacheService.set(cacheKey, response, 60); // Cache de 1 minuto (dato volátil)
    res.json(response);
  } catch (error) {
    console.error('Error al consultar ticket:', error);
    res.status(500).json({ 
      message: "Error al consultar el ticket", 
      error: error.message 
    });
  }
};

/**
 * Obtener historial de verificaciones realizadas por un verificador
 */
const getHistorialVerificaciones = async (req, res) => {
  try {
    if (req.user.rol !== 'verificador' && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: "No tiene permisos para ver este historial" 
      });
    }
    
    const userRol = req.user.rol;
    const userId = req.user.id;
    const cacheKey = `verificaciones_historial_${userRol}_${userId}_${req.query.page || 'all'}_${req.query.limit || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      return res.json(cached);
    }

    const whereClause = req.user.rol === 'verificador' 
      ? { verificadoPor: req.user.id, estadoVerificacion: 'usado' }
      : { estadoVerificacion: 'usado' };
    
    const isPaginated = req.query.page || req.query.limit;
    let queryOptions = {
      where: whereClause,
      include: [
        { 
          model: Bus, 
          required: false,
          attributes: ['id', 'placa', 'numero']
        },
        { 
          model: Conductor, 
          required: false,
          attributes: ['id', 'nombre', 'cedula', 'telefono']
        },
        {
          model: Ruta,
          required: false,
          attributes: ['id', 'origen', 'destino', 'precio']
        }
      ],
      order: [['fechaVerificacion', 'DESC']]
    };
    
    if (isPaginated && req.pagination) {
      Object.assign(queryOptions, req.pagination.sequelizeOptions);
    }

    const verificaciones = isPaginated
      ? await Frecuencia.findAndCountAll(queryOptions)
      : await Frecuencia.findAll(queryOptions);

    // Cargar información adicional si es necesario
    const rows = isPaginated ? verificaciones.rows : verificaciones;
    for (let frec of rows) {
      if (frec.rutaId && !frec.Ruta) {
        const ruta = await Ruta.findByPk(frec.rutaId);
        frec.dataValues.Ruta = ruta;
      }
      
      // Cargar verificador
      if (frec.verificadoPor) {
        const verificador = await User.findByPk(frec.verificadoPor, {
          attributes: ['id', 'nombres', 'apellidos', 'cedula']
        });
        frec.dataValues.Verificador = verificador;
      }
    }
    
    const response = isPaginated
      ? { verificaciones: rows, ...req.pagination.metadata(verificaciones.count) }
      : verificaciones;
    
    cacheService.set(cacheKey, response, 180); // Cache de 3 minutos
    res.json(response);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ 
      message: "Error al obtener historial de verificaciones", 
      error: error.message 
    });
  }
};

/**
 * Regenerar código QR para una frecuencia existente
 */
const regenerarQR = async (req, res) => {
  const { id } = req.params;
  
  try {
    const frecuencia = await Frecuencia.findByPk(id);
    
    if (!frecuencia) {
      return res.status(404).json({ message: "Frecuencia no encontrada" });
    }

    // Solo permitir regenerar si no ha sido verificado
    if (frecuencia.estadoVerificacion === 'usado') {
      return res.status(400).json({ 
        message: "No se puede regenerar el QR de un ticket ya usado" 
      });
    }

    // Generar nuevo ticket ID y QR
    const nuevoTicketId = uuidv4();
    const qrCodeData = JSON.stringify({
      ticketId: nuevoTicketId,
      frecuenciaId: frecuencia.id,
      fecha: frecuencia.fecha,
      horaSalida: frecuencia.horaSalida
    });
    
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    // Actualizar frecuencia
    await frecuencia.update({
      ticketId: nuevoTicketId,
      qrCode: qrCodeImage,
      estadoVerificacion: 'pendiente'
    });
    
    // Invalidar cache
    cacheService.delPattern('verificaciones_*');
    cacheService.delPattern('frecuencias_*');
    cacheService.delPattern(`ticket_*`);

    res.json({
      message: "Código QR regenerado exitosamente",
      ticketId: nuevoTicketId,
      qrCode: qrCodeImage
    });
  } catch (error) {
    console.error('Error al regenerar QR:', error);
    res.status(500).json({ 
      message: "Error al regenerar el código QR", 
      error: error.message 
    });
  }
};

module.exports = {
  verificarTicket,
  consultarTicket,
  getHistorialVerificaciones,
  regenerarQR
};
