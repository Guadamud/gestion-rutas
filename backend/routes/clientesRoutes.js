const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener todos los clientes
router.get("/", clienteController.getAllClientes);

// Obtener un cliente por ID
router.get("/:id", clienteController.getClienteById);

// Obtener cliente por userId
router.get("/user/:userId", clienteController.getClienteByUserId);

// Crear nuevo cliente
router.post("/", clienteController.createCliente);

// Actualizar cliente
router.put("/:id", clienteController.updateCliente);

// Actualizar saldo del cliente
router.patch("/:id/saldo", clienteController.updateSaldo);

// Solicitar compra de saldo
router.post("/:id/comprar-saldo", clienteController.solicitarCompraSaldo);

// Obtener transacciones de compra de saldo del cliente
router.get("/:id/transacciones-compra", clienteController.getTransaccionesCompra);

// Obtener recargas de conductores del cliente
router.get("/:id/recargas-conductores", clienteController.getRecargasConductores);

// Obtener solicitudes pendientes (Admin)
router.get("/solicitudes/pendientes", clienteController.getSolicitudesPendientes);

// Obtener historial completo de solicitudes (Admin)
router.get("/solicitudes/historial", clienteController.getHistorialSolicitudes);

// Procesar solicitud (Admin)
router.patch("/solicitudes/:id/procesar", clienteController.procesarSolicitud);

// Eliminar cliente
router.delete("/:id", clienteController.deleteCliente);

module.exports = router;

