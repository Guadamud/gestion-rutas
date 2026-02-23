require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, sequelize } = require("./config/database");
const models = require("./models/index");

const authRoutes = require("./routes/authRoutes");
const frecuenciaRoutes = require("./routes/frecuenciasRoutes");
const rutaRoutes = require("./routes/rutasRoutes");
const busRoutes = require("./routes/busesRoutes");
const clienteRoutes = require("./routes/clientesRoutes");
const conductorRoutes = require("./routes/conductoresRoutes");
const verificacionRoutes = require("./routes/verificacionRoutes");
const cooperativaRoutes = require("./routes/cooperativasRoutes");
const cierreCajaRoutes = require("./routes/cierreCajaRoutes");
const mantenimientoRoutes = require("./routes/mantenimientoRoutes");
const adminRoutes = require("./routes/adminRoutes");
const limitesRutaBusRoutes = require("./routes/limitesRutaBusRoutes");
const { iniciarServicioLimpieza } = require("./services/limpiezaAutomaticaService");
const { iniciarServicioLimpiezaClaves } = require("./services/limpiezaClavesTemporales");

// Importar middlewares de optimización
const { paginationMiddleware } = require("./middlewares/paginationMiddleware");
const { 
  cookieCleanupMiddleware, 
  secureCookieMiddleware, 
  cookieLoggingMiddleware 
} = require("./middlewares/cookieMiddleware");

const app = express();

// Configuración CORS para desarrollo y producción
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL // URL de Vercel se configurará en variables de entorno
    ].filter(Boolean); // Filtrar valores undefined/null
    
    // Permitir requests sin origin (como mobile apps o curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware de optimización
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middlewares de cookies (antes de las rutas)
app.use(secureCookieMiddleware);
app.use(cookieCleanupMiddleware);
app.use(cookieLoggingMiddleware);

// Middleware de paginación (global para todas las rutas)
app.use(paginationMiddleware);

// Rutas
app.use("/auth", authRoutes);
app.use("/api/frecuencias", frecuenciaRoutes);
app.use("/api/rutas", rutaRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/conductores", conductorRoutes);
app.use("/api/verificacion", verificacionRoutes);
app.use("/api/cooperativas", cooperativaRoutes);
app.use("/api/cierre-caja", cierreCajaRoutes);
app.use("/api/mantenimiento", mantenimientoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/limites-ruta-bus", limitesRutaBusRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("✅ API funcionando correctamente");
});

const PORT = process.env.PORT || 5000;

// Iniciar servidor
const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: false }); 
    console.log("✅ Base de datos sincronizada (datos preservados)");
    
    // Iniciar servicio de limpieza automática
    iniciarServicioLimpieza();
    
    // Iniciar servicio de limpieza de claves temporales expiradas
    iniciarServicioLimpiezaClaves();
    
    app.listen(PORT, () =>
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
};

startServer();
