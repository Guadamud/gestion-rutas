const Conductor = require("../models/Conductor");
const Transaccion = require("../models/Transaccion");
const Cliente = require("../models/Cliente");
const { Frecuencia } = require("../models");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

// Obtener todos los conductores (para admin) - con caché y paginación
exports.getAllConductores = async (req, res) => {
  try {
    const isPaginated = req.query.page || req.query.limit;
    
    if (isPaginated) {
      // CON PAGINACIÓN
      const { limit, offset, sort, order } = req.pagination || {
        limit: 10,
        offset: 0,
        sort: 'id',
        order: 'ASC'
      };
      
      const cacheKey = `conductores_admin_page_${req.pagination?.page || 1}_limit_${limit}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { count, rows } = await Cliente.findAndCountAll({
        include: [{
          model: Conductor,
          as: 'Conductors'
        }],
        ...getSequelizePaginationOptions(req)
      });
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      cacheService.set(cacheKey, response, 300);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN
      const cacheKey = 'conductores_admin_all';
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const clientes = await Cliente.findAll({
        include: [{
          model: Conductor,
          as: 'Conductors'
        }]
      });
      
      cacheService.set(cacheKey, clientes, 300);
      res.json(clientes);
    }
  } catch (error) {
    console.error("Error al obtener conductores:", error);
    res.status(500).json({ message: "Error al obtener conductores" });
  }
};

// Obtener todos los conductores de un cliente - con caché
exports.getConductoresByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const cacheKey = `conductores_cliente_${clienteId}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const conductores = await Conductor.findAll({
      where: { clienteId },
      order: [["fechaRegistro", "DESC"]]
    });
    
    // Contar frecuencias reales para cada conductor
    for (let conductor of conductores) {
      const totalFrecuencias = await Frecuencia.count({
        where: { conductorId: conductor.id }
      });
      conductor.dataValues.totalFrecuencias = totalFrecuencias;
    }
    
    cacheService.set(cacheKey, conductores, 300);
    res.json(conductores);
  } catch (error) {
    console.error("Error al obtener conductores:", error);
    res.status(500).json({ message: "Error al obtener conductores" });
  }
};

// Obtener conductor por usuarioId - con caché
exports.getConductorByUsuarioId = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const cacheKey = `conductor_usuario_${usuarioId}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const conductor = await Conductor.findOne({
      where: { usuarioId: parseInt(usuarioId) }
    });
    
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    
    cacheService.set(cacheKey, conductor, 600);
    res.json(conductor);
  } catch (error) {
    console.error("Error al obtener conductor:", error);
    res.status(500).json({ message: "Error al obtener conductor" });
  }
};

// Obtener un conductor por ID - con caché
exports.getConductorById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `conductor_${id}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const conductor = await Conductor.findByPk(id);
    
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    
    cacheService.set(cacheKey, conductor, 600);
    res.json(conductor);
  } catch (error) {
    console.error("Error al obtener conductor:", error);
    res.status(500).json({ message: "Error al obtener conductor" });
  }
};

// Crear nuevo conductor
exports.createConductor = async (req, res) => {
  try {
    const { 
      clienteId, 
      nombre, 
      cedula, 
      telefono, 
      email, 
      password,
      tipoLicencia, 
      vencimientoLicencia 
    } = req.body;
    
    // Validar campos requeridos
    if (!clienteId || !nombre || !cedula || !telefono || !email || !password || !tipoLicencia || !vencimientoLicencia) {
      return res.status(400).json({ 
        message: "Faltan campos requeridos",
        required: ["clienteId", "nombre", "cedula", "telefono", "email", "password", "tipoLicencia", "vencimientoLicencia"]
      });
    }
    
    // Verificar que el cliente existe
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    
    // Verificar si ya existe un conductor con esa cédula
    const conductorExistente = await Conductor.findOne({ where: { cedula } });
    if (conductorExistente) {
      return res.status(400).json({ message: "Ya existe un conductor con esa cédula" });
    }

    // Crear usuario para el conductor
    const bcrypt = require("bcryptjs");
    const User = require("../models/User");

    // Verificar si ya existe un usuario con ese email
    const usuarioExistente = await User.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: "Ya existe un usuario con ese correo electrónico" });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = await User.create({
      nombres: nombre.split(' ')[0] || nombre,
      apellidos: nombre.split(' ').slice(1).join(' ') || '',
      cedula,
      email,
      celular: telefono,
      password: hashedPassword,
      rol: "conductor"
    });
    
    // Crear conductor vinculado al usuario
    const nuevoConductor = await Conductor.create({
      clienteId,
      nombre,
      cedula,
      telefono,
      email,
      usuarioId: nuevoUsuario.id,
      tipoLicencia,
      vencimientoLicencia
    });
    
    // Invalidar caché de conductores
    cacheService.delPattern('conductores_*');
    
    res.status(201).json({
      conductor: nuevoConductor,
      usuario: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    console.error("Error al crear conductor:", error);
    res.status(500).json({ 
      message: "Error al crear conductor",
      error: error.message 
    });
  }
};

// Actualizar conductor - invalida caché
exports.updateConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      telefono, 
      email, 
      tipoLicencia, 
      vencimientoLicencia, 
      estado 
    } = req.body;
    
    const conductor = await Conductor.findByPk(id);
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    
    await conductor.update({
      nombre,
      telefono,
      email,
      tipoLicencia,
      vencimientoLicencia,
      estado
    });
    
    // Invalidar caché
    cacheService.del(`conductor_${id}`);
    cacheService.del(`conductor_usuario_${conductor.usuarioId}`);
    cacheService.delPattern('conductores_*');
    
    res.json(conductor);
  } catch (error) {
    console.error("Error al actualizar conductor:", error);
    res.status(500).json({ message: "Error al actualizar conductor" });
  }
};

// Actualizar saldo del conductor (con registro de transacción)
exports.updateSaldoConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, tipo, metodoPago, descripcion } = req.body; 
    // tipo: 'recarga', 'cobro', 'ajuste'
    
    const conductor = await Conductor.findByPk(id);
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }

    // Obtener el cliente asociado
    const cliente = await Cliente.findByPk(conductor.clienteId);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    
    // Si es recarga, verificar que el cliente tenga saldo suficiente
    if (tipo === 'recarga') {
      const saldoCliente = parseFloat(cliente.saldo || 0);
      if (saldoCliente < parseFloat(monto)) {
        return res.status(400).json({ 
          message: `Saldo insuficiente. Saldo actual: $${saldoCliente.toFixed(2)}. Necesitas comprar saldo primero.` 
        });
      }
      
      // Descontar del saldo del cliente
      const nuevoSaldoCliente = saldoCliente - parseFloat(monto);
      await cliente.update({ saldo: nuevoSaldoCliente });
      
      // Invalidar caché del cliente
      cacheService.del(`cliente_${conductor.clienteId}`);
      cacheService.delPattern('clientes_*');
    }
    
    const saldoAnterior = parseFloat(conductor.saldo);
    let nuevoSaldo = saldoAnterior;
    
    if (tipo === 'recarga' || tipo === 'ajuste') {
      nuevoSaldo += parseFloat(monto);
    } else if (tipo === 'cobro') {
      nuevoSaldo -= parseFloat(monto);
    }
    
    // Actualizar saldo del conductor
    await conductor.update({ saldo: nuevoSaldo });
    
    // Registrar la transacción
    await Transaccion.create({
      conductorId: id,
      clienteId: conductor.clienteId,
      tipo,
      monto: parseFloat(monto),
      saldoAnterior,
      saldoNuevo: nuevoSaldo,
      descripcion,
      metodoPago
    });
    
    // Invalidar caché
    cacheService.del(`conductor_${id}`);
    cacheService.del(`conductor_usuario_${conductor.usuarioId}`);
    cacheService.delPattern('conductores_*');
    
    res.json(conductor);
  } catch (error) {
    console.error("Error al actualizar saldo del conductor:", error);
    res.status(500).json({ message: "Error al actualizar saldo del conductor" });
  }
};

// Obtener transacciones de un conductor - con caché
exports.getTransaccionesConductor = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `conductor_transacciones_${id}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const transacciones = await Transaccion.findAll({
      where: { conductorId: id },
      order: [["fecha", "DESC"]],
      limit: 50
    });
    
    cacheService.set(cacheKey, transacciones, 180);
    res.json(transacciones);
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    res.status(500).json({ message: "Error al obtener transacciones" });
  }
};

// Registrar frecuencia (incrementar contador y actualizar ingresos)
exports.registrarFrecuencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { costoFrecuencia } = req.body;
    
    const conductor = await Conductor.findByPk(id);
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    
    const nuevoTotalFrecuencias = conductor.totalFrecuencias + 1;
    const nuevosIngresos = parseFloat(conductor.ingresosTotales) + parseFloat(costoFrecuencia);
    
    await conductor.update({
      totalFrecuencias: nuevoTotalFrecuencias,
      ingresosTotales: nuevosIngresos
    });
    
    // Invalidar caché
    cacheService.del(`conductor_${id}`);
    cacheService.del(`conductor_usuario_${conductor.usuarioId}`);
    cacheService.delPattern('conductores_*');
    
    res.json(conductor);
  } catch (error) {
    console.error("Error al registrar frecuencia:", error);
    res.status(500).json({ message: "Error al registrar frecuencia" });
  }
};

// Eliminar conductor
exports.deleteConductor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const conductor = await Conductor.findByPk(id);
    if (!conductor) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    
    await conductor.destroy();
    
    // Invalidar caché
    cacheService.del(`conductor_${id}`);
    cacheService.del(`conductor_usuario_${conductor.usuarioId}`);
    cacheService.delPattern('conductores_*');
    
    res.json({ message: "Conductor eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar conductor:", error);
    
    // Detectar errores de restricción de clave foránea
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "No se puede eliminar este conductor porque tiene frecuencias/viajes o transacciones asociadas. Primero debes eliminar o reasignar esos registros." 
      });
    }
    
    res.status(500).json({ message: "Error al eliminar conductor", error: error.message });
  }
};
