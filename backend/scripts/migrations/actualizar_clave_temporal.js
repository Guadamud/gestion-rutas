const { sequelize } = require("./config/database");
const User = require("./models/User");

async function actualizarCamposClaveTemporal() {
  try {
    console.log("🔧 Actualizando tabla Users con campos de clave temporal...");
    
    // Conectar a la base de datos primero
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");
    
    // Sincronizar modelo con alter para agregar nuevas columnas
    await User.sync({ alter: true });
    
    console.log("✅ Tabla Users actualizada correctamente");
    console.log("✅ Nuevos campos agregados:");
    console.log("   - es_clave_temporal (BOOLEAN)");
    console.log("   - clave_expiracion (DATE)");
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al actualizar tabla:", error.message);
    process.exit(1);
  }
}

actualizarCamposClaveTemporal();
