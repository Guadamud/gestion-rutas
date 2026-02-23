const { sequelize } = require("./config/database");

async function agregarUniqueCelular() {
  try {
    console.log("� Verificando duplicados de celular...");
    
    // Verificar duplicados existentes
    const [duplicados] = await sequelize.query(`
      SELECT celular, COUNT(*) as cantidad 
      FROM "Users" 
      GROUP BY celular 
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicados.length > 0) {
      console.log("⚠️ Se encontraron celulares duplicados:");
      console.table(duplicados);
      console.log("\n🔧 Por favor, corrige estos duplicados antes de continuar");
      console.log("Puedes ejecutar: UPDATE \"Users\" SET celular = 'nuevo_valor' WHERE id = X;");
    } else {
      console.log("✅ No se encontraron celulares duplicados");
      
      console.log("🔄 Agregando restricción UNIQUE a la columna celular...");
      
      // Agregar restricción única a la columna celular (sintaxis PostgreSQL)
      await sequelize.query(`
        ALTER TABLE "Users" 
        ADD CONSTRAINT unique_celular UNIQUE (celular);
      `);
      
      console.log("✅ Restricción UNIQUE agregada exitosamente a celular");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Si el índice ya existe, no es un problema grave
    if (error.message.includes("ya existe") || error.message.includes("already exists") || error.message.includes("Duplicate")) {
      console.log("ℹ️ La restricción UNIQUE ya existe en celular");
    }
  } finally {
    await sequelize.close();
  }
}

agregarUniqueCelular();
