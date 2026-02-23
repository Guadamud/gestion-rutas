const express = require("express");
const router = express.Router();
const { 
  getLimites, 
  getLimitesByBus, 
  setLimite, 
  deleteLimite 
} = require("../controllers/limiteRutaBusController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación como admin
router.use(verifyToken);
router.use(authorizeRoles('admin'));

// GET /api/limites-ruta-bus - Obtener todos los límites
router.get("/", getLimites);

// GET /api/limites-ruta-bus/bus/:busId - Obtener límites de un bus específico
router.get("/bus/:busId", getLimitesByBus);

// POST /api/limites-ruta-bus - Crear o actualizar límite
router.post("/", setLimite);

// DELETE /api/limites-ruta-bus/:id - Eliminar límite
router.delete("/:id", deleteLimite);

module.exports = router;
