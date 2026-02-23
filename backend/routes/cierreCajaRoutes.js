const express = require("express");
const router = express.Router();
const cierreCajaController = require("../controllers/cierreCajaController");
const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación y rol de tesorería
router.use(verifyToken);
router.use(authorizeRoles("admin", "tesoreria"));

// Obtener datos del día para preparar cierre
router.get("/datos-dia", cierreCajaController.obtenerDatosDia);

// Verificar clave de autorización del administrador
router.post("/verificar-clave", cierreCajaController.verificarClaveAdmin);

// Registrar cierre de caja
router.post("/registrar", cierreCajaController.registrarCierre);

// Obtener historial de cierres
router.get("/historial", cierreCajaController.obtenerHistorialCierres);

// Obtener resumen mensual
router.get("/resumen-mensual", cierreCajaController.obtenerResumenMensual);

// Obtener solicitudes aprobadas por el usuario (para exportar)
router.get("/solicitudes-aprobadas", cierreCajaController.obtenerSolicitudesAprobadas);

// Obtener cierre individual por ID (antes del :fecha para evitar conflictos)
router.get("/detalle/:id", cierreCajaController.obtenerCierrePorId);

// Obtener cierre específico por fecha
router.get("/:fecha", cierreCajaController.obtenerCierrePorFecha);

module.exports = router;
