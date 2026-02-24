const express = require("express");
const router = express.Router();
const {
  getFrecuencias,
  getFrecuenciaById,
  createFrecuencia,
  updateFrecuencia,
  deleteFrecuencia,
} = require("../controllers/frecuenciaController");

const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getFrecuencias);
router.get("/:id", verifyToken, getFrecuenciaById);
router.post("/", verifyToken, authorizeRoles("cliente", "conductor", "admin"), createFrecuencia);
router.put("/:id", verifyToken, authorizeRoles("cliente", "conductor", "admin"), updateFrecuencia);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteFrecuencia);

module.exports = router;
