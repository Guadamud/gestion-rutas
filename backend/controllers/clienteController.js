const Cliente = require("../models/Cliente");
const User = require("../models/User");
const Transaccion = require("../models/Transaccion");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

// Obtener todos los clientes - con caché y paginación
exports.getAllClientes = async (req, res) => {
  try {
    const isPaginated = req.query.page || req.query.limit;
    
    if (isPaginated) {
      // CON PAGINACIÓN
      const { limit, offset, sort, order } = req.pagination || {
        limit: 10,
        offset: 0,
        sort: 'fechaRegistro',
        order: 'DESC'
      };
      
      const cacheKey = `clientes_page_${req.pagination?.page || 1}_limit_${limit}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { count, rows } = await Cliente.findAndCountAll({
        ...getSequelizePaginationOptions(req),
        order: [[sort, order]]
      });
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      cacheService.set(cacheKey, response, 300);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN
      const cacheKey = 'clientes_all';
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const clientes = await Cliente.findAll({
        order: [["fechaRegistro", "DESC"]]
      });
      
      cacheService.set(cacheKey, clientes, 300);
      res.json(clientes);
    }
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

// Obtener un cliente por ID - con caché
exports.getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `cliente_${id}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ message: "cliente no encontrado" });
    }
    
    cacheService.set(cacheKey, cliente, 600);
    res.json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ message: "Error al obtener cliente" });
  }
};

// Obtener cliente por userId - con caché
exports.getClienteByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `cliente_user_${userId}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    let cliente = await Cliente.findOne({ where: { userId } });
    
    // Si no existe el cliente, crear uno automáticamente
    if (!cliente) {
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      if (user.rol !== 'cliente') {
        return res.status(403).json({ message: "El usuario no tiene rol de cliente" });
      }
      
      // Crear cliente automáticamente
      cliente = await Cliente.create({
        userId: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        cedula: user.cedula,
        telefono: user.celular,
        email: user.email,
        direccion: ''
      });
      
      console.log(`cliente creado automáticamente para usuario ${userId}`);
      
      // Invalidar caché de listas
      cacheService.delPattern('clientes_*');
    }
    
    cacheService.set(cacheKey, cliente, 600);
    res.json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    res.status(500).json({ 
      message: "Error al obtener cliente",
      error: error.message 
    });
  }
};

// Crear nuevo cliente
exports.createCliente = async (req, res) => {
  try {
    const { userId, nombres, apellidos, cedula, telefono, email, direccion } = req.body;
    
    // Verificar si ya existe un cliente con esa cédula
    const clienteExistente = await Cliente.findOne({ where: { cedula } });
    if (clienteExistente) {
      return res.status(400).json({ message: "Ya existe un cliente con esa cédula" });
    }
    
    const nuevoCliente = await Cliente.create({
      userId,
      nombres,
      apellidos,
      cedula,
      telefono,
      email,
      direccion
    });
    
    // Invalidar caché
    cacheService.delPattern('clientes_*');
    
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);
    res.status(500).json({ message: "Error al crear cliente" });
  }
};

// Actualizar Cliente
exports.updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, telefono, email, direccion, estado } = req.body;
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    
    await cliente.update({
      nombres,
      apellidos,
      telefono,
      email,
      direccion,
      estado
    });
    
    // Invalidar caché
    cacheService.del(`cliente_${id}`);
    cacheService.delPattern('clientes_*');
    
    res.json(Cliente);
  } catch (error) {
    console.error("Error al actualizar Cliente:", error);
    res.status(500).json({ message: "Error al actualizar Cliente" });
  }
};

// Actualizar saldo del Cliente
exports.updateSaldo = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, operacion } = req.body; // operacion: 'agregar' o 'restar'
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    
    let nuevoSaldo = parseFloat(cliente.saldo);
    if (operacion === 'agregar') {
      nuevoSaldo += parseFloat(monto);
    } else if (operacion === 'restar') {
      nuevoSaldo -= parseFloat(monto);
    }
    
    await cliente.update({ saldo: nuevoSaldo });
    
    // Invalidar caché
    cacheService.del(`cliente_${id}`);
    cacheService.delPattern('clientes_*');
    
    res.json(cliente);
  } catch (error) {
    console.error("Error al actualizar saldo:", error);
    res.status(500).json({ message: "Error al actualizar saldo" });
  }
};

// Solicitar compra de saldo
exports.solicitarCompraSaldo = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, metodoPago, descripcion, solicitadoPor, conductorId, comprobante } = req.body;
    
    if (!monto || monto <= 0) {
      return res.status(400).json({ message: "Monto inválido" });
    }
    
    // Validar que si es depósito o transferencia, debe haber comprobante
    if ((metodoPago === 'deposito' || metodoPago === 'transferencia') && !comprobante) {
      return res.status(400).json({ message: "Debe subir el comprobante de pago para depósitos y transferencias" });
    }
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    
    // Crear una solicitud pendiente
    const Transaccion = require("../models/Transaccion");
    const solicitud = await Transaccion.create({
      clienteId: id,
      conductorId: conductorId || null,
      tipo: "solicitud_compra",
      estado: "pendiente",
      monto: parseFloat(monto),
      saldoAnterior: null,
      saldoNuevo: null,
      descripcion: descripcion || `Solicitud de compra de saldo - ${metodoPago}`,
      metodoPago,
      comprobante: comprobante || null,
      solicitadoPor: solicitadoPor || 'cliente'
    });
    
    res.json({ 
      message: "Solicitud de compra enviada. Espera la aprobación del administrador.",
      solicitud
    });
  } catch (error) {
    console.error("Error al solicitar compra de saldo:", error);
    res.status(500).json({ message: "Error al procesar la compra de saldo" });
  }
};

// Obtener solicitudes de compra pendientes (Admin)
exports.getSolicitudesPendientes = async (req, res) => {
  try {
    const Transaccion = require("../models/Transaccion");
    const solicitudes = await Transaccion.findAll({
      where: { 
        tipo: "solicitud_compra",
        estado: "pendiente"
      },
      include: [{
        model: Cliente,
        attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono']
      }],
      order: [["fecha", "DESC"]]
    });
    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({ message: "Error al obtener solicitudes" });
  }
};

// Obtener historial completo de solicitudes (Admin)
exports.getHistorialSolicitudes = async (req, res) => {
  try {
    const Transaccion = require("../models/Transaccion");
    const userId = req.user.id;
    const userRol = req.user.rol;
    
    const whereCondition = { 
      tipo: "solicitud_compra",
      estado: "aprobada", // Solo aprobadas
      aprobadoPorId: userId // SIEMPRE filtrar por el usuario actual
    };
    
    // Mostrar TODAS las solicitudes aprobadas por el usuario (cerradas y sin cerrar)
    // Ya no filtramos por incluidoEnCierreId
    
    const solicitudes = await Transaccion.findAll({
      where: whereCondition,
      include: [{
        model: Cliente,
        attributes: ['id', 'nombres', 'apellidos', 'email', 'telefono']
      }],
      order: [["fecha", "DESC"]]
    });
    
    console.log(`📋 Historial solicitudes aprobadas (usuario: ${userId}, rol: ${userRol}):`, solicitudes.length);
    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ message: "Error al obtener historial" });
  }
};

// Aprobar o rechazar solicitud de compra (Admin)
exports.procesarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion } = req.body; // "aprobar" o "rechazar"
    const userId = req.user.id; // ID del usuario de tesorería que está aprobando
    
    const Transaccion = require("../models/Transaccion");
    const solicitud = await Transaccion.findByPk(id);
    
    if (!solicitud) {
      return res.status(404).json({ message: "Solicitud no encontrada" });
    }
    
    if (solicitud.estado !== "pendiente") {
      return res.status(400).json({ message: "Esta solicitud ya fue procesada" });
    }
    
    if (accion === "aprobar") {
      console.log('Procesando aprobación de solicitud:', {
        id: solicitud.id,
        solicitadoPor: solicitud.solicitadoPor,
        conductorId: solicitud.conductorId,
        clienteId: solicitud.clienteId,
        monto: solicitud.monto,
        aprobadoPor: userId
      });
      
      // Si la solicitud fue hecha por un conductor, agregar saldo al conductor
      if (solicitud.solicitadoPor === 'conductor' && solicitud.conductorId) {
        console.log('Agregando saldo al conductor:', solicitud.conductorId);
        const Conductor = require("../models/Conductor");
        const conductor = await Conductor.findByPk(solicitud.conductorId);
        if (!conductor) {
          return res.status(404).json({ message: "Conductor no encontrado" });
        }
        
        const saldoAntesConductor = parseFloat(conductor.saldo || 0);
        const nuevoSaldoConductor = saldoAntesConductor + parseFloat(solicitud.monto);
        console.log('Saldo anterior conductor:', saldoAntesConductor, 'Nuevo saldo:', nuevoSaldoConductor);
        await conductor.update({ saldo: nuevoSaldoConductor });
        await solicitud.update({ 
          estado: "aprobada",
          aprobadoPorId: userId,
          saldoAnterior: saldoAntesConductor,
          saldoNuevo: nuevoSaldoConductor
        });
        
        // Invalidar caché del conductor y del cliente asociado
        cacheService.del(`conductor_${conductor.id}`);
        cacheService.del(`conductor_usuario_${conductor.usuarioId}`);
        cacheService.delPattern('conductores_*');
        if (solicitud.clienteId) {
          cacheService.del(`cliente_${solicitud.clienteId}`);
          cacheService.delPattern('clientes_*');
        }
        
        res.json({ 
          message: "Solicitud aprobada correctamente. Saldo agregado al conductor.",
          solicitud,
          nuevoSaldoConductor: nuevoSaldoConductor
        });
      } else {
        console.log('Agregando saldo al Cliente:', solicitud.clienteId);
        // Si la solicitud fue hecha por el dueño, agregar saldo al Cliente
        const cliente = await Cliente.findByPk(solicitud.clienteId);
        if (!cliente) {
          return res.status(404).json({ message: "Cliente no encontrado" });
        }
        
        const nuevoSaldo = parseFloat(cliente.saldo || 0) + parseFloat(solicitud.monto);
        console.log('Saldo anterior Cliente:', cliente.saldo, 'Nuevo saldo:', nuevoSaldo);
        const saldoAntesCliente = parseFloat(cliente.saldo || 0);
        await cliente.update({ saldo: nuevoSaldo });
        await solicitud.update({ 
          estado: "aprobada",
          aprobadoPorId: userId,
          saldoAnterior: saldoAntesCliente,
          saldoNuevo: nuevoSaldo
        });
        
        // Invalidar caché del cliente para que el saldo se refresque
        cacheService.del(`cliente_${solicitud.clienteId}`);
        cacheService.del(`cliente_user_${cliente.userId}`);
        cacheService.delPattern('clientes_*');
        
        res.json({ 
          message: "Solicitud aprobada correctamente",
          solicitud,
          nuevoSaldoCliente: nuevoSaldo
        });
      }
    } else if (accion === "rechazar") {
      await solicitud.update({ estado: "rechazada" });
      res.json({ 
        message: "Solicitud rechazada",
        solicitud
      });
    } else {
      res.status(400).json({ message: "AcciÃ³n invÃ¡lida" });
    }
  } catch (error) {
    console.error("Error al procesar solicitud:", error);
    res.status(500).json({ message: "Error al procesar solicitud" });
  }
};

// Obtener transacciones de compra de saldo del cliente
exports.getTransaccionesCompra = async (req, res) => {
  try {
    const { id } = req.params;

    const { Op } = require('sequelize');
    // Solo las solicitudes hechas por el propio cliente (no por conductor)
    const transacciones = await Transaccion.findAll({
      where: {
        clienteId: id,
        tipo: 'solicitud_compra',
        solicitadoPor: 'cliente'
      },
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 getTransaccionesCompra clienteId=${id}: ${transacciones.length} registros`);

    const resultado = transacciones.map(t => ({
      id: t.id,
      clienteId: t.clienteId,
      monto: t.monto,
      metodoPago: t.metodoPago,
      descripcion: t.descripcion,
      estado: t.estado,
      fecha: t.createdAt,
      solicitadoPor: t.solicitadoPor
    }));

    res.json(resultado);
  } catch (error) {
    console.error("❌ getTransaccionesCompra error:", error);
    res.status(500).json({ message: "Error al obtener transacciones", error: error.message, stack: error.stack });
  }
};

// Obtener recargas realizadas por los conductores del cliente
exports.getRecargasConductores = async (req, res) => {
  try {
    const { id } = req.params;
    const { Op } = require('sequelize');
    const Conductor = require('../models/Conductor');

    // Obtener todos los conductores del cliente
    const conductores = await Conductor.findAll({
      where: { clienteId: id },
      attributes: ['id', 'nombre', 'cedula']
    });

    console.log(`📊 getRecargasConductores clienteId=${id}: ${conductores.length} conductores encontrados`);

    if (conductores.length === 0) {
      return res.json([]);
    }

    const conductorIds = conductores.map(c => c.id);
    const conductorMap = {};
    conductores.forEach(c => { conductorMap[c.id] = c; });

    // Buscar recargas directas Y solicitudes_compra hechas por el conductor en nombre del cliente
    const recargas = await Transaccion.findAll({
      where: {
        [Op.or]: [
          // Recargas directas al conductor
          { conductorId: { [Op.in]: conductorIds }, tipo: 'recarga' },
          // Solicitudes de compra iniciadas por el conductor para el cliente
          { clienteId: id, tipo: 'solicitud_compra', solicitadoPor: 'conductor' }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    console.log(`📊 getRecargasConductores clienteId=${id}: ${recargas.length} registros encontrados`);

    const recargasFormateadas = recargas.map(r => {
      const cond = conductorMap[r.conductorId];
      return {
        id: r.id,
        conductorId: r.conductorId,
        conductorNombre: cond ? cond.nombre : 'N/A',
        conductorCedula: cond ? cond.cedula : 'N/A',
        monto: r.monto,
        metodoPago: r.metodoPago,
        descripcion: r.descripcion,
        estado: r.estado,
        fecha: r.createdAt,
        saldoAnterior: r.saldoAnterior,
        saldoNuevo: r.saldoNuevo
      };
    });

    res.json(recargasFormateadas);
  } catch (error) {
    console.error('❌ getRecargasConductores error:', error);
    res.status(500).json({ message: 'Error al obtener recargas', error: error.message });
  }
};

// Eliminar Cliente
exports.deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    
    await cliente.destroy();
    
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar Cliente:", error);
    res.status(500).json({ message: "Error al eliminar Cliente" });
  }
};


