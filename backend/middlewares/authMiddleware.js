const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded; // { id, rol }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const { rol } = req.user;
    if (!allowedRoles.includes(rol)) {
      return res.status(403).json({ message: "Acceso denegado por rol" });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
