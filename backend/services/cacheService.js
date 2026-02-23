/**
 * Servicio de Caché Centralizado
 * 
 * Este servicio proporciona funcionalidades de caché en memoria
 * para mejorar el rendimiento del sistema reduciendo consultas a la BD
 */

const NodeCache = require("node-cache");

// Configuración del caché
// stdTTL: Tiempo de vida estándar en segundos (10 minutos)
// checkperiod: Período de verificación para eliminar claves expiradas (2 minutos)
const cache = new NodeCache({ 
  stdTTL: 600,      // 10 minutos
  checkperiod: 120  // 2 minutos
});

/**
 * Obtener valor del caché
 * @param {string} key - Clave del caché
 * @returns {*} Valor almacenado o undefined
 */
const get = (key) => {
  try {
    const value = cache.get(key);
    if (value) {
      console.log(`✅ Cache HIT: ${key}`);
      return value;
    }
    console.log(`⚠️ Cache MISS: ${key}`);
    return undefined;
  } catch (error) {
    console.error(`❌ Error al obtener del caché [${key}]:`, error);
    return undefined;
  }
};

/**
 * Guardar valor en el caché
 * @param {string} key - Clave del caché
 * @param {*} value - Valor a almacenar
 * @param {number} ttl - Tiempo de vida en segundos (opcional)
 * @returns {boolean} True si se guardó correctamente
 */
const set = (key, value, ttl = undefined) => {
  try {
    const success = cache.set(key, value, ttl);
    if (success) {
      console.log(`💾 Guardado en caché: ${key} (TTL: ${ttl || 'default'}s)`);
    }
    return success;
  } catch (error) {
    console.error(`❌ Error al guardar en caché [${key}]:`, error);
    return false;
  }
};

/**
 * Eliminar una clave del caché
 * @param {string} key - Clave a eliminar
 * @returns {number} Número de claves eliminadas
 */
const del = (key) => {
  try {
    const deleted = cache.del(key);
    if (deleted > 0) {
      console.log(`🗑️ Eliminado del caché: ${key}`);
    }
    return deleted;
  } catch (error) {
    console.error(`❌ Error al eliminar del caché [${key}]:`, error);
    return 0;
  }
};

/**
 * Eliminar múltiples claves del caché
 * @param {string[]} keys - Array de claves a eliminar
 * @returns {number} Número de claves eliminadas
 */
const delMultiple = (keys) => {
  try {
    const deleted = cache.del(keys);
    console.log(`🗑️ Eliminadas ${deleted} claves del caché`);
    return deleted;
  } catch (error) {
    console.error(`❌ Error al eliminar múltiples claves del caché:`, error);
    return 0;
  }
};

/**
 * Eliminar todas las claves que coincidan con un patrón
 * @param {string} pattern - Patrón de búsqueda (ej: 'cooperativas_*')
 * @returns {number} Número de claves eliminadas
 */
const delPattern = (pattern) => {
  try {
    const keys = cache.keys();
    const regex = new RegExp(pattern.replace('*', '.*'));
    const matchingKeys = keys.filter(key => regex.test(key));
    
    if (matchingKeys.length > 0) {
      const deleted = cache.del(matchingKeys);
      console.log(`🗑️ Eliminadas ${deleted} claves con patrón: ${pattern}`);
      return deleted;
    }
    return 0;
  } catch (error) {
    console.error(`❌ Error al eliminar por patrón [${pattern}]:`, error);
    return 0;
  }
};

/**
 * Limpiar todo el caché
 * @returns {void}
 */
const flush = () => {
  try {
    cache.flushAll();
    console.log('🧹 Caché completamente limpiado');
  } catch (error) {
    console.error('❌ Error al limpiar el caché:', error);
  }
};

/**
 * Obtener estadísticas del caché
 * @returns {object} Estadísticas
 */
const getStats = () => {
  try {
    return cache.getStats();
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del caché:', error);
    return {};
  }
};

/**
 * Obtener todas las claves del caché
 * @returns {string[]} Array de claves
 */
const keys = () => {
  try {
    return cache.keys();
  } catch (error) {
    console.error('❌ Error al obtener claves del caché:', error);
    return [];
  }
};

/**
 * Verificar si existe una clave en el caché
 * @param {string} key - Clave a verificar
 * @returns {boolean} True si existe
 */
const has = (key) => {
  try {
    return cache.has(key);
  } catch (error) {
    console.error(`❌ Error al verificar clave en caché [${key}]:`, error);
    return false;
  }
};

/**
 * Wrapper para funciones asíncronas con caché automático
 * @param {string} key - Clave del caché
 * @param {Function} fn - Función asíncrona a ejecutar si no hay caché
 * @param {number} ttl - Tiempo de vida en segundos (opcional)
 * @returns {Promise<*>} Valor del caché o resultado de fn
 */
const getOrSet = async (key, fn, ttl = undefined) => {
  try {
    // Intentar obtener del caché
    const cachedValue = get(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // Si no está en caché, ejecutar la función
    const value = await fn();
    
    // Guardar en caché solo si el valor no es null/undefined
    if (value !== null && value !== undefined) {
      set(key, value, ttl);
    }
    
    return value;
  } catch (error) {
    console.error(`❌ Error en getOrSet [${key}]:`, error);
    throw error;
  }
};

// Configurar limpieza automática de estadísticas cada hora
setInterval(() => {
  const stats = getStats();
  console.log('📊 Estadísticas de caché:', {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%' : '0%'
  });
}, 3600000); // Cada hora

module.exports = {
  get,
  set,
  del,
  delMultiple,
  delPattern,
  flush,
  getStats,
  keys,
  has,
  getOrSet,
  // Exportar también la instancia de cache por si se necesita acceso directo
  cache
};
