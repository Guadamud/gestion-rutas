const { sequelize } = require("./config/database");

async function eliminarColumnaEstado() {
  try {
    console.log("Eliminando columna 'estado' de la tabla Frecuencia...");
    
    // Eliminar la columna estado
    await sequelize.query('ALTER TABLE "Frecuencia" DROP COLUMN IF EXISTS "estado";');
    
    console.log("✅ Columna 'estado' eliminada correctamente");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

eliminarColumnaEstado();
