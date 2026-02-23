const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación y rol de administrador
router.use(verifyToken);
router.use(authorizeRoles("admin"));

// Establecer/actualizar clave de autorización
router.post("/clave-autorizacion", adminController.establecerClaveAutorizacion);

// Verificar si tiene clave configurada
router.get("/clave-autorizacion/estado", adminController.verificarClaveConfigurada);

// Obtener clave actual (requiere verificación)
router.post("/clave-autorizacion/ver", adminController.obtenerClaveActual);

// Actualizar usuario (correo, contraseña, datos)
router.put("/usuarios/:id", adminController.updateUser);

module.exports = router;
