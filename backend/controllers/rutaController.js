const Ruta = require("../models/Ruta");
const cacheService = require("../services/cacheService");
const { paginatedResponse, getSequelizePaginationOptions } = require("../middlewares/paginationMiddleware");

// Obtener todas las rutas (con caché y paginación)
const getRutas = async (req, res) => {
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
      
      const cacheKey = `rutas_page_${req.pagination?.page || 1}_limit_${limit}_sort_${sort}_${order}`;
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const { count, rows } = await Ruta.findAndCountAll({
        ...getSequelizePaginationOptions(req),
        order: [[sort, order]]
      });
      
      const response = paginatedResponse(rows, count, req.pagination?.page || 1, limit);
      cacheService.set(cacheKey, response, 300);
      
      res.json(response);
    } else {
      // SIN PAGINACIÓN
      const cacheKey = 'rutas_all';
      
      const cachedData = cacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      const rutas = await Ruta.findAll();
      cacheService.set(cacheKey, rutas, 300);
      
      res.json(rutas);
    }
  } catch (error) {
    console.error('Error al obtener rutas:', error);
    res.status(500).json({ message: "Error al obtener rutas", error: error.message });
  }
};

const createRuta = async (req, res) => {
  try {
    const { origen, destino, duracionAproximada, precio, distancia } = req.body;
    const nuevaRuta = await Ruta.create({ 
      origen, 
      destino, 
      duracionAproximada,
      precio: precio || 0,
      distancia: distancia || 0
    });
    
    // Invalidar caché de rutas
    cacheService.delPattern('rutas_*');
    
    res.status(201).json(nuevaRuta);
  } catch (error) {
    console.error('Error al crear ruta:', error);
    res.status(400).json({ message: "Error al crear ruta", error: error.message });
  }
};

const updateRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { origen, destino, duracionAproximada, precio, distancia } = req.body;

    const ruta = await Ruta.findByPk(id);
    if (!ruta) return res.status(404).json({ message: "Ruta no encontrada" });

    ruta.origen = origen;
    ruta.destino = destino;
    ruta.duracionAproximada = duracionAproximada;
    if (precio !== undefined) ruta.precio = precio;
    if (distancia !== undefined) ruta.distancia = distancia;
    await ruta.save();

    // Invalidar caché
    cacheService.del(`ruta_${id}`);
    cacheService.delPattern('rutas_*');

    res.json(ruta);
  } catch (error) {
    console.error('Error al actualizar ruta:', error);
    res.status(400).json({ message: "Error al actualizar ruta", error: error.message });
  }
};

const deleteRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const ruta = await Ruta.findByPk(id);
    if (!ruta) return res.status(404).json({ message: "Ruta no encontrada" });

    await ruta.destroy();
    
    // Invalidar caché
    cacheService.del(`ruta_${id}`);
    cacheService.delPattern('rutas_*');

    res.json({ message: "Ruta eliminada correctamente" });
  } catch (error) {
    console.error('Error al eliminar ruta:', error);
    res.status(500).json({ message: "Error al eliminar ruta", error: error.message });
  }
};

module.exports = {
  getRutas,
  createRuta,
  updateRuta,
  deleteRuta,
};
