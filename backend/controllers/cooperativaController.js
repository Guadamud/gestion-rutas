const Cooperativa = require("../models/Cooperativa");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

// Obtener todas las cooperativas (con caché y paginación)
exports.getCooperativas = async (req, res) => {
  try {
    // Determinar si se solicita paginación
    const isPaginated = req.query.page || req.query.limit;
    
    if (isPaginated) {
      // CON PAGINACIÓN
      const { limit, offset, sort, order } = req.pagination || {
        limit: 10,
        offset: 0,
        sort: 'id',
        order: 'ASC'
      };
      
      // Generar clave de caché única
      const cacheKey = `cooperativas_page_${req.pagination?.page || 1}_limit_${limit}_sort_${sort}_${order}`;
      
      // Intentar obtener del caché
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // Consultar base de datos
      const { count, rows } = await Cooperativa.findAndCountAll({
        ...getSequelizePaginationOptions(req),
        order: [[sort, order]]
      });
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      
      // Guardar en caché por 5 minutos
      cacheService.set(cacheKey, response, 300);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN (lista completa)
      const cacheKey = 'cooperativas_all';
      
      // Intentar obtener del caché
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const cooperativas = await Cooperativa.findAll({
        order: [['id', 'ASC']]
      });
      
      // Guardar en caché por 5 minutos
      cacheService.set(cacheKey, cooperativas, 300);
      
      res.json(cooperativas);
    }
  } catch (error) {
    console.error('Error al obtener cooperativas:', error);
    res.status(500).json({ message: "Error al obtener cooperativas", error: error.message });
  }
};

// Obtener cooperativa por ID (con caché)
exports.getCooperativaById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `cooperativa_${id}`;
    
    // Intentar obtener del caché
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const cooperativa = await Cooperativa.findByPk(id);
    
    if (!cooperativa) {
      return res.status(404).json({ message: "Cooperativa no encontrada" });
    }
    
    // Guardar en caché por 10 minutos
    cacheService.set(cacheKey, cooperativa, 600);
    
    res.json(cooperativa);
  } catch (error) {
    console.error('Error al obtener cooperativa:', error);
    res.status(500).json({ message: "Error al obtener cooperativa", error: error.message });
  }
};

// Crear cooperativa (invalida caché)
exports.createCooperativa = async (req, res) => {
  try {
    const { nombre, ruc, descripcion } = req.body;
    
    const nuevaCooperativa = await Cooperativa.create({
      nombre,
      ruc,
      descripcion
    });
    
    // Invalidar caché de cooperativas
    cacheService.delPattern('cooperativas_*');
    
    res.status(201).json(nuevaCooperativa);
  } catch (error) {
    console.error('Error al crear cooperativa:', error);
    res.status(400).json({ message: "Error al crear cooperativa", error: error.message });
  }
};

// Actualizar cooperativa (invalida caché)
exports.updateCooperativa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ruc, descripcion, estado } = req.body;
    
    const cooperativa = await Cooperativa.findByPk(id);
    
    if (!cooperativa) {
      return res.status(404).json({ message: "Cooperativa no encontrada" });
    }
    
    await cooperativa.update({
      nombre,
      ruc,
      descripcion,
      estado
    });
    
    // Invalidar caché de esta cooperativa y listas
    cacheService.del(`cooperativa_${id}`);
    cacheService.delPattern('cooperativas_*');
    
    res.json(cooperativa);
  } catch (error) {
    console.error('Error al actualizar cooperativa:', error);
    res.status(400).json({ message: "Error al actualizar cooperativa", error: error.message });
  }
};

// Eliminar cooperativa (invalida caché)
exports.deleteCooperativa = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cooperativa = await Cooperativa.findByPk(id);
    
    if (!cooperativa) {
      return res.status(404).json({ message: "Cooperativa no encontrada" });
    }
    
    await cooperativa.destroy();
    
    // Invalidar caché de esta cooperativa y listas
    cacheService.del(`cooperativa_${id}`);
    cacheService.delPattern('cooperativas_*');
    
    res.json({ message: "Cooperativa eliminada correctamente" });
  } catch (error) {
    console.error('Error al eliminar cooperativa:', error);
    res.status(500).json({ message: "Error al eliminar cooperativa", error: error.message });
  }
};

// Obtener cooperativas públicas (sin autenticación) para página de inicio
exports.getCooperativasPublicas = async (req, res) => {
  try {
    const cacheKey = 'cooperativas_publicas';
    
    // Intentar obtener del caché
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const cooperativas = await Cooperativa.findAll({
      attributes: ['id', 'nombre', 'descripcion', 'estado'],
      order: [['id', 'ASC']]
    });
    
    // Guardar en caché por 5 minutos
    cacheService.set(cacheKey, cooperativas, 300);
    
    res.json(cooperativas);
  } catch (error) {
    console.error('Error al obtener cooperativas públicas:', error);
    res.status(500).json({ message: "Error al obtener cooperativas", error: error.message });
  }
};
