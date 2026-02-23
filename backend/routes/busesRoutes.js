const express = require("express");
const router = express.Router();
const {
  getBuses,
  getBusesByCliente,
  createBus,
  updateBus,
  deleteBus,
  cambiarEstadoBus,
} = require("../controllers/busController");

const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getBuses);
router.get("/cliente/:clienteId", verifyToken, getBusesByCliente);
router.post("/", verifyToken, authorizeRoles("admin", "cliente"), createBus);
router.put("/:id", verifyToken, authorizeRoles("admin", "cliente"), updateBus);
router.put("/:id/estado", verifyToken, authorizeRoles("admin", "cliente"), cambiarEstadoBus);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteBus);

module.exports = router;
