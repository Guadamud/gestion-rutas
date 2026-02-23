const express = require("express");
const router = express.Router();
const {
  getRutas,
  createRuta,
  updateRuta,
  deleteRuta,
} = require("../controllers/rutaController");

const { verifyToken, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getRutas);
router.post("/", verifyToken, authorizeRoles("admin", "tesoreria"), createRuta);
router.put("/:id", verifyToken, authorizeRoles("admin", "tesoreria"), updateRuta);
router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteRuta);

module.exports = router;
