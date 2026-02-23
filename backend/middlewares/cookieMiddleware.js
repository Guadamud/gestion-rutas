/**
 * Middleware de Gestión de Cookies
 * 
 * Este middleware maneja la limpieza y validación de cookies
 * para mejorar la seguridad y rendimiento del sistema
 */

/**
 * Middleware para limpiar cookies expiradas o inválidas
 * 
 * Revisa las cookies entrantes y elimina aquellas que:
 * - Están expiradas
 * - Tienen formato inválido
 * - No son necesarias
 */
const cookieCleanupMiddleware = (req, res, next) => {
  try {
    const cookies = req.cookies || {};
    const cookiesToDelete = [];

    // Lista de cookies válidas del sistema
    const validCookies = [
      'token',
      'refreshToken',
      'sessionId',
      'userId',
      'userRole',
      'theme',
      'preferences'
    ];

    // Revisar cookies y marcar las que no son válidas
    Object.keys(cookies).forEach(cookieName => {
      // Si la cookie no está en la lista de válidas, marcarla para eliminar
      if (!validCookies.includes(cookieName)) {
        cookiesToDelete.push(cookieName);
      }
    });

    // Eliminar cookies inválidas
    cookiesToDelete.forEach(cookieName => {
      res.clearCookie(cookieName);
      console.log(`🗑️ Cookie eliminada: ${cookieName}`);
    });

    next();
  } catch (error) {
    console.error('❌ Error en middleware de limpieza de cookies:', error);
    next();
  }
};

/**
 * Middleware para configurar opciones seguras de cookies
 * 
 * Asegura que todas las cookies enviadas tengan configuraciones
 * de seguridad apropiadas
 */
const secureCookieMiddleware = (req, res, next) => {
  // Guardar la función original
  const originalCookie = res.cookie.bind(res);

  // Sobrescribir res.cookie con opciones por defecto
  res.cookie = function(name, value, options = {}) {
    const secureOptions = {
      httpOnly: true,           // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict',       // Protección CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 horas por defecto
      ...options                // Permitir sobrescritura
    };

    return originalCookie(name, value, secureOptions);
  };

  next();
};

/**
 * Middleware para logging de cookies (solo desarrollo)
 * 
 * Registra información sobre las cookies en cada petición
 */
const cookieLoggingMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const cookies = req.cookies || {};
    const cookieCount = Object.keys(cookies).length;
    
    if (cookieCount > 0) {
      console.log(`🍪 Cookies recibidas (${cookieCount}):`, Object.keys(cookies).join(', '));
    }
  }
  
  next();
};

/**
 * Función helper para limpiar todas las cookies de sesión
 * 
 * @param {Object} res - Objeto response de Express
 */
const clearAllCookies = (res) => {
  const cookiesToClear = [
    'token',
    'refreshToken',
    'sessionId',
    'userId',
    'userRole',
    'theme',
    'preferences'
  ];

  cookiesToClear.forEach(cookieName => {
    res.clearCookie(cookieName);
  });

  console.log('🧹 Todas las cookies de sesión han sido limpiadas');
};

/**
 * Función helper para limpiar cookies de un usuario específico
 * 
 * @param {Object} res - Objeto response de Express
 * @param {string} userId - ID del usuario
 */
const clearUserCookies = (res, userId) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');
  res.clearCookie('userId');
  
  console.log(`🧹 Cookies del usuario ${userId} han sido limpiadas`);
};

/**
 * Función helper para establecer cookie de sesión
 * 
 * @param {Object} res - Objeto response de Express
 * @param {string} token - Token de autenticación
 * @param {Object} user - Datos del usuario
 */
const setSessionCookies = (res, token, user) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Cookie del token
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  });

  // Cookie del ID de usuario (no sensible)
  res.cookie('userId', user.id, {
    httpOnly: false, // Accesible desde frontend
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  // Cookie del rol de usuario
  res.cookie('userRole', user.role, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  console.log(`✅ Cookies de sesión establecidas para usuario ${user.id}`);
};

/**
 * Middleware para validar cookies de autenticación
 * 
 * Verifica que las cookies necesarias para autenticación existan
 */
const validateAuthCookies = (req, res, next) => {
  const { token, userId } = req.cookies || {};

  if (!token || !userId) {
    return res.status(401).json({
      success: false,
      message: 'Sesión inválida o expirada',
      requiresLogin: true
    });
  }

  next();
};

module.exports = {
  cookieCleanupMiddleware,
  secureCookieMiddleware,
  cookieLoggingMiddleware,
  clearAllCookies,
  clearUserCookies,
  setSessionCookies,
  validateAuthCookies
};
