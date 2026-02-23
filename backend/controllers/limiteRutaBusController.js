const { LimiteRutaBus, Bus, Ruta } = require("../models");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

// Obtener todos los límites configurados - con caché y paginación
const getLimites = async (req, res) => {
  try {
    const isPaginated = req.query.page || req.query.limit;
    
    if (isPaginated) {
      // CON PAGINACIÓN
      const { limit, offset, sort, order } = req.pagination || {
        limit: 10,
        offset: 0,
        sort: 'createdAt',
        order: 'DESC'
      };
      
      const cacheKey = `limites_page_${req.pagination?.page || 1}_limit_${limit}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { count, rows } = await LimiteRutaBus.findAndCountAll({
        include: [
          { 
            model: Bus,
            attributes: ['id', 'placa', 'modelo', 'empresa']
          },
          { 
            model: Ruta,
            attributes: ['id', 'origen', 'destino', 'precio']
          }
        ],
        ...getSequelizePaginationOptions(req),
        order: [[sort, order]]
      });
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      cacheService.set(cacheKey, response, 300);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN
      const cacheKey = 'limites_all';
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const limites = await LimiteRutaBus.findAll({
        include: [
          { 
            model: Bus,
            attributes: ['id', 'placa', 'modelo', 'empresa']
          },
          { 
            model: Ruta,
            attributes: ['id', 'origen', 'destino', 'precio']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      cacheService.set(cacheKey, limites, 300);
      res.json(limites);
    }
  } catch (error) {
    console.error('Error al obtener límites:', error);
    res.status(500).json({ message: "Error al obtener límites", error: error.message });
  }
};

// Obtener límites de un bus específico - con caché
const getLimitesByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    const cacheKey = `limites_bus_${busId}`;
    
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const limites = await LimiteRutaBus.findAll({
      where: { busId },
      include: [
        { 
          model: Ruta,
          attributes: ['id', 'origen', 'destino', 'precio']
        }
      ]
    });
    
    cacheService.set(cacheKey, limites, 300);
    res.json(limites);
  } catch (error) {
    console.error('Error al obtener límites del bus:', error);
    res.status(500).json({ message: "Error al obtener límites", error: error.message });
  }
};

// Crear o actualizar un límite
const setLimite = async (req, res) => {
  const { busId, rutaId, limiteDiario } = req.body;

  try {
    // Validaciones
    if (!busId || !rutaId || !limiteDiario) {
      return res.status(400).json({ 
        message: "Todos los campos son obligatorios: busId, rutaId, limiteDiario" 
      });
    }

    if (limiteDiario < 1 || limiteDiario > 50) {
      return res.status(400).json({ 
        message: "El límite diario debe estar entre 1 y 50" 
      });
    }

    // Verificar que el bus existe
    const bus = await Bus.findByPk(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus no encontrado" });
    }

    // Verificar que la ruta existe
    const ruta = await Ruta.findByPk(rutaId);
    if (!ruta) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    // Buscar si ya existe un límite para este bus+ruta
    const limiteExistente = await LimiteRutaBus.findOne({
      where: { busId, rutaId }
    });

    if (limiteExistente) {
      // Actualizar
      await limiteExistente.update({ limiteDiario });
      const limiteActualizado = await LimiteRutaBus.findByPk(limiteExistente.id, {
        include: [
          { model: Bus, attributes: ['id', 'placa', 'modelo'] },
          { model: Ruta, attributes: ['id', 'origen', 'destino'] }
        ]
      });
      
      // Invalidar caché
      cacheService.delPattern('limites_*');
      
      res.json({ 
        message: "Límite actualizado correctamente",
        limite: limiteActualizado
      });
    } else {
      // Crear nuevo
      const nuevoLimite = await LimiteRutaBus.create({
        busId,
        rutaId,
        limiteDiario
      });
      const limiteCreado = await LimiteRutaBus.findByPk(nuevoLimite.id, {
        include: [
          { model: Bus, attributes: ['id', 'placa', 'modelo'] },
          { model: Ruta, attributes: ['id', 'origen', 'destino'] }
        ]
      });
      
      // Invalidar caché
      cacheService.delPattern('limites_*');
      
      res.status(201).json({
        message: "Límite creado correctamente",
        limite: limiteCreado
      });
    }
  } catch (error) {
    console.error('Error al configurar límite:', error);
    res.status(400).json({ message: "Error al configurar límite", error: error.message });
  }
};

// Eliminar un límite
const deleteLimite = async (req, res) => {
  const { id } = req.params;
  
  try {
    const limite = await LimiteRutaBus.findByPk(id);
    if (!limite) {
      return res.status(404).json({ message: "Límite no encontrado" });
    }

    await limite.destroy();
    
    // Invalidar caché
    cacheService.delPattern('limites_*');
    
    res.json({ message: "Límite eliminado correctamente" });
  } catch (error) {
    console.error('Error al eliminar límite:', error);
    res.status(500).json({ message: "Error al eliminar límite", error: error.message });
  }
};

module.exports = {
  getLimites,
  getLimitesByBus,
  setLimite,
  deleteLimite
};
