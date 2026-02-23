const { User } = require("../models");
const bcrypt = require("bcryptjs");
const cacheService = require("../services/cacheService");

// Establecer/actualizar clave de autorización del administrador - invalida caché
exports.establecerClaveAutorizacion = async (req, res) => {
  try {
    const { clave_nueva, password_admin, es_temporal, fecha_expiracion } = req.body;
    const userId = req.user.id;

    // Validar que el usuario sea administrador
    if (req.user.rol !== "admin") {
      return res.status(403).json({ 
        error: "Solo los administradores pueden establecer clave de autorización" 
      });
    }

    // Validaciones
    if (!clave_nueva || !password_admin) {
      return res.status(400).json({ 
        error: "Se requiere la nueva clave y la contraseña del administrador" 
      });
    }

    // Validar formato de la clave (4-6 dígitos)
    if (!/^\d{4,6}$/.test(clave_nueva)) {
      return res.status(400).json({ 
        error: "La clave debe ser de 4 a 6 dígitos numéricos" 
      });
    }

    // Si es temporal, DEBE tener fecha de expiración
    if (es_temporal === true && !fecha_expiracion) {
      return res.status(400).json({ 
        error: "Las claves temporales requieren una fecha de expiración" 
      });
    }

    // Si NO es temporal, ignorar fecha_expiracion aunque venga
    const fechaExpFinal = (es_temporal === true && fecha_expiracion) ? fecha_expiracion : null;

    // Verificar la contraseña del administrador
    const admin = await User.findByPk(userId);
    const passwordValido = await bcrypt.compare(password_admin, admin.password);

    if (!passwordValido) {
      return res.status(401).json({ 
        error: "Contraseña de administrador incorrecta" 
      });
    }

    // Hashear la nueva clave
    const claveHasheada = await bcrypt.hash(clave_nueva, 10);

    // Preparar datos de actualización
    const updateData = { 
      clave_autorizacion: claveHasheada,
      clave_autorizacion_texto: clave_nueva, // Guardar también en texto plano
      es_clave_temporal: es_temporal === true,
      clave_expiracion: fechaExpFinal ? new Date(fechaExpFinal) : null,
      clave_temporal_usada_por: [] // Limpiar la lista al establecer nueva clave
    };

    // Actualizar la clave
    await User.update(updateData, { where: { id: userId } });

    // Invalidar caché de usuarios y admin
    cacheService.delPattern('admin_*');
    cacheService.delPattern('users_*');

    let mensaje = "Clave de autorización establecida correctamente";
    if (es_temporal === true && fechaExpFinal) {
      const fechaExp = new Date(fechaExpFinal);
      mensaje += ` (expira: ${fechaExp.toLocaleString('es-ES')})`;
    }

    res.json({ 
      mensaje: mensaje,
      exito: true,
      es_temporal: es_temporal === true,
      expira: fechaExpFinal
    });
  } catch (error) {
    console.error("Error al establecer clave de autorización:", error);
    res.status(500).json({ error: "Error al establecer clave de autorización" });
  }
};

// Verificar si el administrador tiene clave configurada - con caché
exports.verificarClaveConfigurada = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.rol !== "admin") {
      return res.status(403).json({ 
        error: "Solo los administradores pueden consultar esta información" 
      });
    }

    const cacheKey = `admin_clave_${userId}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const admin = await User.findByPk(userId);
    const tieneClaveConfigurada = admin.clave_autorizacion !== null && admin.clave_autorizacion !== "";

    const response = { 
      configurada: tieneClaveConfigurada,
      mensaje: tieneClaveConfigurada 
        ? "Clave de autorización configurada" 
        : "No hay clave de autorización configurada"
    };
    
    cacheService.set(cacheKey, response, 600);
    res.json(response);
  } catch (error) {
    console.error("Error al verificar clave configurada:", error);
    res.status(500).json({ error: "Error al verificar clave configurada" });
  }
};

// Obtener la clave actual (solo para ver, requiere contraseña)
exports.obtenerClaveActual = async (req, res) => {
  try {
    const { password_admin } = req.body;
    const userId = req.user.id;

    if (req.user.rol !== "admin") {
      return res.status(403).json({ 
        error: "Solo los administradores pueden consultar esta información" 
      });
    }

    if (!password_admin) {
      return res.status(400).json({ 
        error: "Se requiere tu contraseña para ver la clave" 
      });
    }

    // Verificar la contraseña del administrador
    const admin = await User.findByPk(userId);
    const passwordValido = await bcrypt.compare(password_admin, admin.password);

    if (!passwordValido) {
      return res.status(401).json({ 
        error: "Contraseña de administrador incorrecta" 
      });
    }

    // Verificar que tenga clave configurada
    if (!admin.clave_autorizacion_texto) {
      return res.status(404).json({ 
        error: "No hay clave de autorización configurada" 
      });
    }

    // Retornar la clave en texto plano
    res.json({ 
      clave: admin.clave_autorizacion_texto,
      mensaje: "Clave recuperada exitosamente"
    });

  } catch (error) {
    console.error("Error al obtener clave actual:", error);
    res.status(500).json({ error: "Error al obtener clave actual" });
  }
};

// Actualizar usuario (correo, contraseña, datos personales)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombres, 
      apellidos, 
      email, 
      password, 
      cedula, 
      celular, 
      rol 
    } = req.body;

    // Verificar que el usuario existe
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Preparar datos de actualización
    const updateData = {};
    
    if (nombres) updateData.nombres = nombres;
    if (apellidos) updateData.apellidos = apellidos;
    if (email) updateData.email = email;
    if (cedula) updateData.cedula = cedula;
    if (celular) updateData.celular = celular;
    if (rol) updateData.rol = rol;

    // Si se proporciona una nueva contraseña, hashearla
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Actualizar el usuario
    await User.update(updateData, { where: { id } });

    // Invalidar caché
    cacheService.delPattern('users_*');
    cacheService.delPattern('admin_*');

    // Obtener el usuario actualizado
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ 
      message: "Usuario actualizado correctamente",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "El email o cédula ya existe" });
    }
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

module.exports = exports;
