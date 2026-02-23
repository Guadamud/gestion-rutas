/**
 * Middleware de Paginación
 * 
 * Este middleware procesa parámetros de paginación de las peticiones
 * y los añade al objeto request para uso en los controladores
 */

/**
 * Middleware para procesar parámetros de paginación
 * 
 * Lee los query parameters:
 * - page: Número de página (defecto: 1)
 * - limit: Elementos por página (defecto: 10, máximo: 100)
 * - sort: Campo para ordenar (opcional)
 * - order: Dirección de orden 'ASC' o 'DESC' (defecto: 'ASC')
 * 
 * Añade a req.pagination:
 * - page: Número de página actual
 * - limit: Límite de elementos
 * - offset: Offset para la consulta SQL
 * - sort: Campo de ordenamiento
 * - order: Dirección de orden
 */
const paginationMiddleware = (req, res, next) => {
  try {
    // Obtener parámetros de paginación
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'id';
    const order = (req.query.order || 'ASC').toUpperCase();

    // Validar valores
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Máximo 100 elementos por página

    // Validar orden
    const validOrder = ['ASC', 'DESC'].includes(order) ? order : 'ASC';

    // Calcular offset
    const offset = (page - 1) * limit;

    // Añadir configuración al request
    req.pagination = {
      page,
      limit,
      offset,
      sort,
      order: validOrder
    };

    next();
  } catch (error) {
    console.error('❌ Error en middleware de paginación:', error);
    // Valores por defecto en caso de error
    req.pagination = {
      page: 1,
      limit: 10,
      offset: 0,
      sort: 'id',
      order: 'ASC'
    };
    next();
  }
};

/**
 * Función helper para generar respuesta paginada
 * 
 * @param {Array} data - Datos a paginar
 * @param {number} total - Total de registros
 * @param {number} page - Página actual
 * @param {number} limit - Límite por página
 * @returns {Object} Objeto con datos paginados y metadatos
 */
const paginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data: data,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * Función helper para construir opciones de Sequelize con paginación
 * 
 * @param {Object} req - Objeto request con req.pagination
 * @param {Object} additionalOptions - Opciones adicionales de Sequelize
 * @returns {Object} Opciones de Sequelize con paginación
 */
const getSequelizePaginationOptions = (req, additionalOptions = {}) => {
  const { limit, offset, sort, order } = req.pagination || {};
  
  return {
    ...additionalOptions,
    limit: limit || 10,
    offset: offset || 0,
    order: [[sort || 'id', order || 'ASC']]
  };
};

/**
 * Wrapper para controladores con paginación automática
 * 
 * @param {Function} controllerFn - Función del controlador
 * @returns {Function} Middleware envuelto
 */
const withPagination = (controllerFn) => {
  return async (req, res, next) => {
    try {
      // Asegurar que existe req.pagination
      if (!req.pagination) {
        paginationMiddleware(req, res, () => {});
      }
      
      // Ejecutar el controlador
      await controllerFn(req, res, next);
    } catch (error) {
      console.error('❌ Error en controlador paginado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud',
        error: error.message
      });
    }
  };
};

module.exports = {
  paginationMiddleware,
  paginatedResponse,
  getSequelizePaginationOptions,
  withPagination
};
