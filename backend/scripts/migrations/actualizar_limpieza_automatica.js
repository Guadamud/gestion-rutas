const { sequelize } = require("./config/database");
const ConfiguracionMantenimiento = require("./models/ConfiguracionMantenimiento");

async function actualizarModeloMantenimiento() {
  try {
    console.log("🔧 Actualizando modelo ConfiguracionMantenimiento...");
    
    // Conectar a la base de datos primero
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");
    
    // Sincronizar modelo con alter para agregar nuevas columnas
    await ConfiguracionMantenimiento.sync({ alter: true });
    
    console.log("✅ Modelo actualizado correctamente");
    console.log("✅ Nuevos campos agregados:");
    console.log("   - limpieza_automatica_activa");
    console.log("   - limpieza_automatica_horario");
    console.log("   - limpieza_automatica_lote");
    console.log("   - limpieza_automatica_intervalo");
    console.log("   - limpieza_automatica_en_progreso");
    console.log("   - limpieza_automatica_progreso");
    console.log("   - limpieza_automatica_fecha_inicio");
    console.log("   - limpieza_automatica_fecha_fin");
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al actualizar modelo:", error.message);
    process.exit(1);
  }
}

actualizarModeloMantenimiento();
