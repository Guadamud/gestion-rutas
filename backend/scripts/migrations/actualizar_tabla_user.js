const { sequelize } = require("./config/database");
const User = require("./models/User");

async function actualizarTablaUser() {
  try {
    console.log("🔧 Actualizando tabla Users con campos de clave temporal...");
    
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");
    
    // Sincronizar con alter para agregar nuevas columnas
    await User.sync({ alter: true });
    
    console.log("✅ Tabla Users actualizada correctamente");
    console.log("✅ Nuevos campos agregados:");
    console.log("   - es_clave_temporal (BOOLEAN)");
    console.log("   - clave_expiracion (TIMESTAMP)");
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

actualizarTablaUser();
