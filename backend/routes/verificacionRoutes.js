const express = require('express');
const router = express.Router();
const verificacionController = require('../controllers/verificacionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Health check endpoint (sin autenticación para servicios de monitoreo)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Verificar un ticket (marcar como usado)
router.post('/verificar', verifyToken, verificacionController.verificarTicket);

// Consultar información de un ticket sin marcarlo como usado
router.get('/ticket/:ticketId', verifyToken, verificacionController.consultarTicket);

// Obtener historial de verificaciones
router.get('/historial', verifyToken, verificacionController.getHistorialVerificaciones);

// Regenerar código QR para una frecuencia
router.post('/regenerar/:id', verifyToken, verificacionController.regenerarQR);

module.exports = router;
