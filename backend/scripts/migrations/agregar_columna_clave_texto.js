const { sequelize } = require("./config/database");

async function agregarColumnaClave() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión establecida");

    // Agregar columna para guardar la clave en texto plano (solo visible para admin)
    await sequelize.query(`
      ALTER TABLE "Users" 
      ADD COLUMN IF NOT EXISTS clave_autorizacion_texto VARCHAR(10)
    `);

    console.log("✅ Columna clave_autorizacion_texto agregada");
    console.log("ℹ️  Esta columna guardará la clave en texto plano solo para que el admin pueda verla");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

agregarColumnaClave();
