const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");
const { sequelize } = require("../config/database");

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  const {
    nombres,
    apellidos,
    cedula,
    celular,
    email,
    password,
    rol
  } = req.body;

  console.log('📝 Intento de registro:', { email, nombres, apellidos });

  try {
    // Verificar si ya existe un administrador
    const adminExists = await User.findOne({ where: { rol: 'admin' } });
    
    // SEGURIDAD: El registro público SOLO puede crear clientes
    // Ya existe un admin, todos los nuevos usuarios serán clientes
    const rolFinal = 'cliente';
    
    if (adminExists) {
      console.log('👤 Ya existe admin - Nuevo usuario será cliente');
    } else {
      console.log('⚠️ ADVERTENCIA: No existe admin pero registros públicos solo crean clientes');
    }
    
    // Verificar si el email ya existe
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      console.log('❌ Email ya registrado:', email);
      return res.status(400).json({ message: "El correo electrónico ya está registrado" });
    }

    // Verificar si la cédula ya existe
    const existingUserByCedula = await User.findOne({ where: { cedula } });
    if (existingUserByCedula) {
      console.log('❌ Cédula ya registrada:', cedula);
      return res.status(400).json({ message: "La cédula ya está registrada" });
    }

    // Verificar si el celular ya existe
    const existingUserByCelular = await User.findOne({ where: { celular } });
    if (existingUserByCelular) {
      console.log('❌ Celular ya registrado:', celular);
      return res.status(400).json({ message: "El número de celular ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔒 Contraseña hasheada correctamente');

    // Asignar tema predeterminado según rol
    const temasPorRol = {
      admin: 'azulProfesional',
      tesoreria: 'verdeEsmeralda',
      verificador: 'indigoNocturno',
      cliente: 'grisProfesional',
      conductor: 'marronTierra',
    };
    
    const tema_preferido = temasPorRol[rolFinal] || 'azulProfesional';

    console.log('💾 Intentando crear usuario con datos:', { nombres, apellidos, cedula, celular, email, rol: rolFinal });

    const newUser = await User.create({
      nombres,
      apellidos,
      cedula,
      celular,
      email,
      password: hashedPassword,
      rol: rolFinal,
      tema_preferido,
    });

    console.log('✅ Usuario creado exitosamente ID:', newUser.id, 'Email:', newUser.email, 'Rol:', newUser.rol);

    // Devolver el usuario creado (sin la contraseña)
    const userResponse = {
      id: newUser.id,
      nombres: newUser.nombres,
      apellidos: newUser.apellidos,
      cedula: newUser.cedula,
      celular: newUser.celular,
      email: newUser.email,
      rol: newUser.rol,
    };

    res.status(201).json({ 
      message: "Usuario registrado correctamente",
      user: userResponse
    });
  } catch (error) {
    console.error('❌ ERROR EN REGISTRO:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(400).json({ 
      message: "Error al registrar usuario",
      error: error.message 
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Intento de login con email:', email);

  // Buscar el usuario por email (case insensitive)
  const user = await User.findOne({ 
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('email')),
      sequelize.fn('LOWER', email)
    )
  });
  
  if (!user) {
    console.log('❌ Usuario no encontrado con email:', email);
    return res.status(400).json({ error: "Usuario no encontrado" });
  }

  console.log('✅ Usuario encontrado:', user.email, '- Rol:', user.rol);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log('❌ Contraseña incorrecta para:', email);
    return res.status(400).json({ error: "Contraseña incorrecta" });
  }

  console.log('✅ Contraseña correcta para:', email);

  // Validaciones adicionales para conductores
  if (user.rol === 'conductor') {
    const Conductor = require("../models/Conductor");
    const conductor = await Conductor.findOne({ where: { usuarioId: user.id } });
    
    console.log('🔍 Verificando conductor - Usuario ID:', user.id);
    console.log('🔍 Conductor encontrado:', conductor ? `ID: ${conductor.id}, Estado: ${conductor.estado}` : 'NO ENCONTRADO');
    
    if (conductor) {
      const esInactivo = conductor.estado === 'inactivo';
      
      // Verificar si la licencia está caducada
      const fechaActual = new Date();
      const fechaVencimiento = new Date(conductor.vencimientoLicencia);
      const licenciaVencida = fechaVencimiento < fechaActual;
      
      console.log('🔍 Estado inactivo:', esInactivo);
      console.log('🔍 Licencia vencida:', licenciaVencida);
      
      // Si está inactivo Y tiene licencia vencida
      if (esInactivo && licenciaVencida) {
        console.log('❌ Login bloqueado: Inactivo Y licencia vencida');
        return res.status(403).json({ 
          error: "No puedes iniciar sesión",
          message: "Tu cuenta está inactiva y tu licencia de conducir está caducada. Por favor, contacta al dueño del bus y renueva tu licencia." 
        });
      }
      
      // Si solo está inactivo
      if (esInactivo) {
        console.log('❌ Login bloqueado: Conductor inactivo');
        return res.status(403).json({ 
          error: "No puedes iniciar sesión",
          message: "Tu cuenta está inactiva. Por favor, contacta al dueño del bus." 
        });
      }
      
      // Si solo tiene la licencia vencida
      if (licenciaVencida) {
        console.log('❌ Login bloqueado: Licencia vencida');
        return res.status(403).json({ 
          error: "No puedes iniciar sesión",
          message: "Tu licencia de conducir está caducada. Por favor, renueva tu licencia antes de continuar." 
        });
      }
      
      console.log('✅ Login permitido para conductor');
    } else {
      console.log('⚠️ No se encontró registro de conductor para este usuario');
    }
  }

  const token = jwt.sign(
    { id: user.id, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      rol: user.rol,
      email: user.email,
    },
  });
});

// Obtener todos los usuarios (solo admin)
router.get("/users", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
  }
});

// Actualizar rol de usuario (solo admin)
router.put("/users/:id/rol", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    user.rol = rol;
    await user.save();

    res.json({ message: "Rol actualizado correctamente", user: { id: user.id, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar rol", error: error.message });
  }
});

// Actualizar perfil del usuario autenticado
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { nombres, apellidos, celular, email } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si el email ya existe en otro usuario
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "El correo electrónico ya está registrado" });
      }
    }

    // Verificar si el celular ya existe en otro usuario
    if (celular && celular !== user.celular) {
      const existingUser = await User.findOne({ where: { celular } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "El número de celular ya está registrado" });
      }
    }

    // Actualizar campos
    if (nombres) user.nombres = nombres;
    if (apellidos) user.apellidos = apellidos;
    if (celular) user.celular = celular;
    if (email) user.email = email;

    await user.save();

    res.json({ 
      message: "Perfil actualizado correctamente",
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        celular: user.celular,
        cedula: user.cedula,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error al actualizar perfil", error: error.message });
  }
});

// Cambiar contraseña del usuario autenticado
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    console.log('📝 Solicitud de cambio de contraseña recibida');
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    console.log('👤 Usuario ID:', userId);
    console.log('🔒 Datos recibidos:', { 
      hasCurrentPassword: !!currentPassword, 
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword?.length 
    });

    if (!currentPassword || !newPassword) {
      console.log('❌ Campos faltantes');
      return res.status(400).json({ message: "Debes proporcionar la contraseña actual y la nueva contraseña" });
    }

    if (newPassword.length < 6) {
      console.log('❌ Contraseña demasiado corta');
      return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    console.log('✅ Usuario encontrado:', user.email);

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log('🔐 Verificación de contraseña actual:', isMatch ? '✅ Correcta' : '❌ Incorrecta');
    
    if (!isMatch) {
      return res.status(400).json({ message: "La contraseña actual es incorrecta" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Contraseña actualizada correctamente');
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("❌ Error al cambiar contraseña:", error);
    res.status(500).json({ message: "Error al cambiar contraseña", error: error.message });
  }
});

// Eliminar usuario (solo admin)
router.delete("/users/:id", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Evitar que el admin se elimine a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "No puedes eliminar tu propio usuario" });
    }

    // Verificar si el usuario es verificador y tiene verificaciones asociadas
    if (user.rol === 'verificador') {
      const { Frecuencia } = require('../models');
      const frecuenciasVerificadas = await Frecuencia.count({ 
        where: { verificadoPor: id } 
      });
      
      if (frecuenciasVerificadas > 0) {
        return res.status(400).json({ 
          message: `No se puede eliminar este verificador porque tiene ${frecuenciasVerificadas} verificaciones registradas. Primero debes reasignar o eliminar esas verificaciones.` 
        });
      }
    }

    await user.destroy();
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    // Detectar errores de restricción de clave foránea
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "No se puede eliminar este usuario porque tiene registros asociados en el sistema (buses, conductores, transacciones, etc.). Primero debes eliminar o reasignar esos registros." 
      });
    }
    
    res.status(500).json({ 
      message: "Error al eliminar usuario", 
      error: error.message 
    });
  }
});

// ===== RUTAS DE PREFERENCIAS DE TEMA =====

// Obtener preferencia de tema del usuario
router.get("/usuarios/:id_usuario/preferencias-tema", verifyToken, async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    // Verificar que el usuario solo pueda acceder a sus propias preferencias
    // (excepto el admin que puede ver de todos)
    if (req.user.id !== parseInt(id_usuario) && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: "No tienes permiso para acceder a las preferencias de otro usuario" 
      });
    }
    
    const user = await User.findByPk(id_usuario, {
      attributes: ['id', 'tema_preferido']
    });
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json({ 
      tema_preferido: user.tema_preferido || 'azulProfesional'
    });
  } catch (error) {
    console.error('Error al obtener preferencia de tema:', error);
    res.status(500).json({ 
      message: "Error al obtener preferencia de tema",
      error: error.message 
    });
  }
});

// Actualizar preferencia de tema del usuario
router.put("/usuarios/:id_usuario/preferencias-tema", verifyToken, async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { tema_preferido } = req.body;
    
    // Verificar que el usuario solo pueda actualizar sus propias preferencias
    // (excepto el admin que puede actualizar de todos)
    if (req.user.id !== parseInt(id_usuario) && req.user.rol !== 'admin') {
      return res.status(403).json({ 
        message: "No tienes permiso para modificar las preferencias de otro usuario" 
      });
    }
    
    // Validar que el tema proporcionado sea válido
    const temasValidos = [
      'azulProfesional',
      'verdeNaturaleza',
      'naranjaEnergia',
      'moradoCreativo',
      'rojoPasion',
      'marronTierra',
      'grisProfesional',
      'indigoNocturno'
    ];
    
    if (!tema_preferido || !temasValidos.includes(tema_preferido)) {
      return res.status(400).json({ 
        message: "Tema no válido",
        temasValidos
      });
    }
    
    const user = await User.findByPk(id_usuario);
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Actualizar la preferencia de tema
    user.tema_preferido = tema_preferido;
    await user.save();
    
    res.json({ 
      message: "Preferencia de tema actualizada correctamente",
      tema_preferido: user.tema_preferido
    });
  } catch (error) {
    console.error('Error al actualizar preferencia de tema:', error);
    res.status(500).json({ 
      message: "Error al actualizar preferencia de tema",
      error: error.message 
    });
  }
});

module.exports = router;
