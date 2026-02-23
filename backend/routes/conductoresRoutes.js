const express = require("express");
const router = express.Router();
const conductorController = require("../controllers/conductorController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener TODOS los conductores (para admin)
router.get("/", conductorController.getAllConductores);

// Obtener todos los conductores de un cliente
router.get("/cliente/:clienteId", conductorController.getConductoresByCliente);

// Obtener conductor por usuarioId (para conductores logueados)
router.get("/usuario/:usuarioId", conductorController.getConductorByUsuarioId);

// Obtener un conductor por ID
router.get("/:id", conductorController.getConductorById);

// Crear nuevo conductor
router.post("/", conductorController.createConductor);

// Actualizar conductor
router.put("/:id", conductorController.updateConductor);

// Actualizar saldo del conductor (con registro de transacción)
router.patch("/:id/saldo", conductorController.updateSaldoConductor);

// Obtener transacciones de un conductor
router.get("/:id/transacciones", conductorController.getTransaccionesConductor);

// Registrar frecuencia
router.post("/:id/frecuencia", conductorController.registrarFrecuencia);

// Eliminar conductor
router.delete("/:id", conductorController.deleteConductor);

module.exports = router;
