const Bus = require("../models/Bus");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

const getBuses = async (req, res) => {
  try {
    const { clienteId } = req.query;
    const where = clienteId ? { usuarioId: clienteId } : {};
    const isPaginated = req.query.page || req.query.limit;
    
    if (isPaginated) {
      // CON PAGINACIÓN
      const { limit, offset, sort, order } = req.pagination || {
        limit: 10,
        offset: 0,
        sort: 'id',
        order: 'ASC'
      };
      
      const cacheKey = `buses_${clienteId || 'all'}_page_${req.pagination?.page || 1}_limit_${limit}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { count, rows } = await Bus.findAndCountAll({
        where,
        ...getSequelizePaginationOptions(req)
      });
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      cacheService.set(cacheKey, response, 300);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN
      const cacheKey = `buses_${clienteId || 'all'}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const buses = await Bus.findAll({ where });
      cacheService.set(cacheKey, buses, 300);
      
      res.json(buses);
    }
  } catch (error) {
    console.error('Error al obtener buses:', error);
    res.status(500).json({ message: "Error al obtener buses", error });
  }
};

const getBusesByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const cacheKey = `buses_cliente_${clienteId}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const buses = await Bus.findAll({ 
      where: { usuarioId: clienteId } 
    });
    
    cacheService.set(cacheKey, buses, 300);
    res.json(buses);
  } catch (error) {
    console.error('Error al obtener buses del cliente:', error);
    res.status(500).json({ message: "Error al obtener buses del cliente", error: error.message });
  }
};

const createBus = async (req, res) => {
  const { numero, placa, modelo, empresa, capacidad, usuarioId, clienteId } = req.body;

  try {
    // Validar formato de placa
    if (!placa || placa.trim().length === 0) {
      return res.status(400).json({ message: "La placa es obligatoria" });
    }
    
    if (placa.length > 8) {
      return res.status(400).json({ message: "La placa no puede tener más de 8 caracteres" });
    }

    // Verificar si la placa ya existe
    const placaUpperCase = placa.toUpperCase();
    const busExistente = await Bus.findOne({ where: { placa: placaUpperCase } });
    if (busExistente) {
      return res.status(400).json({ message: "Ya existe un bus con esta placa" });
    }

    // Validar número de bus
    if (numero && (numero < 1 || numero > 9999)) {
      return res.status(400).json({ message: "El número de bus debe estar entre 1 y 9999" });
    }

    // Validar capacidad
    if (capacidad && (capacidad < 1 || capacidad > 100)) {
      return res.status(400).json({ message: "La capacidad debe estar entre 1 y 100 pasajeros" });
    }

    const nuevoBus = await Bus.create({ 
      numero,
      placa: placaUpperCase, 
      modelo,
      empresa,
      capacidad: capacidad || 45,
      usuarioId: usuarioId || clienteId
    });
    
    // Invalidar caché de buses
    cacheService.delPattern('buses_*');
    
    res.status(201).json(nuevoBus);
  } catch (error) {
    // Manejo de error de restricción única
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Ya existe un bus con esta placa" });
    }
    res.status(400).json({ message: "Error al registrar bus", error: error.message });
  }
};

const updateBus = async (req, res) => {
  const { id } = req.params;
  const { numero, placa, modelo, empresa, capacidad, estado } = req.body;

  try {
    const bus = await Bus.findByPk(id);
    if (!bus) return res.status(404).json({ message: "Bus no encontrado" });

    // Si se está actualizando la placa, verificar que no esté duplicada
    if (placa && placa.toUpperCase() !== bus.placa) {
      const placaUpperCase = placa.toUpperCase();
      
      // Validar longitud de placa
      if (placaUpperCase.length > 8) {
        return res.status(400).json({ message: "La placa no puede tener más de 8 caracteres" });
      }

      const busExistente = await Bus.findOne({ 
        where: { placa: placaUpperCase } 
      });
      if (busExistente) {
        return res.status(400).json({ message: "Ya existe un bus con esta placa" });
      }
    }

    // Validar número de bus
    if (numero && (numero < 1 || numero > 9999)) {
      return res.status(400).json({ message: "El número de bus debe estar entre 1 y 9999" });
    }

    // Validar capacidad
    if (capacidad && (capacidad < 1 || capacidad > 100)) {
      return res.status(400).json({ message: "La capacidad debe estar entre 1 y 100 pasajeros" });
    }

    await bus.update({
      numero,
      placa: placa ? placa.toUpperCase() : bus.placa,
      modelo,
      empresa,
      capacidad,
      estado
    });
    
    // Invalidar caché de buses
    cacheService.delPattern('buses_*');
    
    res.json(bus);
  } catch (error) {
    // Manejo de error de restricción única
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Ya existe un bus con esta placa" });
    }
    res.status(400).json({ message: "Error al actualizar bus", error: error.message });
  }
};

const deleteBus = async (req, res) => {
  const { id } = req.params;
  
  try {
    const bus = await Bus.findByPk(id);
    if (!bus) return res.status(404).json({ message: "Bus no encontrado" });

    await bus.destroy();
    
    // Invalidar caché de buses
    cacheService.delPattern('buses_*');
    
    res.json({ message: "Bus eliminado correctamente" });
  } catch (error) {
    console.error('Error al eliminar bus:', error);
    
    // Detectar errores de restricción de clave foránea
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "No se puede eliminar este bus porque tiene frecuencias/viajes asociados. Primero debes eliminar o reasignar esas frecuencias." 
      });
    }
    
    res.status(500).json({ message: "Error al eliminar bus", error: error.message });
  }
};

const cambiarEstadoBus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const bus = await Bus.findByPk(id);
    if (!bus) return res.status(404).json({ message: "Bus no encontrado" });

    // Validar que el estado sea válido
    if (!["activo", "inactivo"].includes(estado)) {
      return res.status(400).json({ message: "El estado debe ser 'activo' o 'inactivo'" });
    }

    // Determinar quién está haciendo el cambio (admin o cliente)
    const esAdmin = req.user.rol === "admin";
    const esCliente = req.user.rol === "cliente";

    if (estado === "inactivo") {
      // Al desactivar, registrar quién lo desactivó
      await bus.update({
        estado: "inactivo",
        desactivadoPor: esAdmin ? "admin" : "cliente"
      });
      
      // Invalidar caché de buses
      cacheService.delPattern('buses_*');
      
      res.json({ 
        message: "Bus desactivado correctamente",
        bus 
      });

    } else if (estado === "activo") {
      // Al activar, verificar permisos
      if (bus.desactivadoPor === "admin" && esCliente) {
        return res.status(403).json({ 
          message: "No puedes activar este bus. Fue desactivado por el administrador debido a incumplimientos. Contacta al administrador para más información.",
          codigoError: "BUS_DESACTIVADO_ADMIN"
        });
      }

      // Si se permite la activación, limpiar el campo desactivadoPor
      await bus.update({
        estado: "activo",
        desactivadoPor: null
      });

      // Invalidar caché de buses
      cacheService.delPattern('buses_*');

      res.json({ 
        message: "Bus activado correctamente",
        bus 
      });
    }

  } catch (error) {
    console.error('Error al cambiar estado del bus:', error);
    res.status(500).json({ message: "Error al cambiar estado del bus", error: error.message });
  }
};

module.exports = {
  getBuses,
  getBusesByCliente,
  createBus,
  updateBus,
  deleteBus,
  cambiarEstadoBus,
};
