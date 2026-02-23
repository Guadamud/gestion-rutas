const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Ruta TEMPORAL para listar todos los usuarios (DEBUGGING)
// ⚠️ ELIMINAR EN PRODUCCIÓN
router.get("/listar-usuarios", async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'nombres', 'apellidos', 'email', 'rol', 'cedula', 'celular', 'createdAt']
    });

    res.json({
      total: usuarios.length,
      usuarios: usuarios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta TEMPORAL para crear el primer admin
// ⚠️ ELIMINAR DESPUÉS DE CREAR EL ADMIN
router.post("/crear-primer-admin", async (req, res) => {
  try {
    // Verificar si ya existe un admin
    const adminExiste = await User.findOne({ where: { rol: "admin" } });
    
    if (adminExiste) {
      return res.status(400).json({ 
        message: "Ya existe un usuario administrador. Esta ruta está deshabilitada por seguridad." 
      });
    }

    // Datos del admin por defecto
    const username = "admin";
    const password = "admin123"; // ¡Cambiar después!
    const email = "admin@gestionrutas.com";

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el admin
    const admin = await User.create({
      username,
      password: hashedPassword,
      email,
      rol: "admin",
      nombre: "Administrador",
      apellido: "Sistema"
    });

    res.status(201).json({
      message: "✅ Usuario administrador creado exitosamente",
      datos: {
        username: admin.username,
        email: admin.email,
        rol: admin.rol
      },
      advertencia: "⚠️ POR FAVOR CAMBIA LA CONTRASEÑA INMEDIATAMENTE después de iniciar sesión"
    });

  } catch (error) {
    console.error("Error al crear admin:", error);
    res.status(500).json({ 
      message: "Error al crear administrador", 
      error: error.message 
    });
  }
});

module.exports = router;
