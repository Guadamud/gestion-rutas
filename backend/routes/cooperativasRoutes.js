const express = require("express");
const router = express.Router();
const {
  getCooperativas,
  getCooperativaById,
  createCooperativa,
  updateCooperativa,
  deleteCooperativa,
  getCooperativasPublicas
} = require("../controllers/cooperativaController");

const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

// IMPORTANTE: Ruta pública DEBE estar ANTES de cualquier middleware de autenticación
router.get("/publicas", getCooperativasPublicas);

// Rutas protegidas - Estas requieren autenticación
router.get("/", verifyToken, getCooperativas);
router.post("/", verifyToken, authorizeRoles("admin"), createCooperativa);
router.put("/:id", verifyToken, authorizeRoles("admin"), updateCooperativa);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteCooperativa);

// IMPORTANTE: Esta ruta debe estar AL FINAL para no interferir con /publicas
router.get("/:id", verifyToken, getCooperativaById);

module.exports = router;
