const { sequelize } = require("./config/database");

async function corregirDuplicados() {
  try {
    console.log("🔍 Buscando celulares duplicados...");
    
    // Encontrar duplicados
    const [duplicados] = await sequelize.query(`
      SELECT celular, array_agg(id ORDER BY id) as ids
      FROM "Users" 
      GROUP BY celular 
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicados.length === 0) {
      console.log("✅ No se encontraron duplicados");
      return;
    }
    
    console.log(`⚠️ Se encontraron ${duplicados.length} celulares duplicados`);
    
    for (const dup of duplicados) {
      const ids = dup.ids;
      const celularOriginal = dup.celular;
      
      // Mantener el primer ID, modificar los demás
      console.log(`\n📱 Celular duplicado: ${celularOriginal}`);
      console.log(`   IDs afectados: ${ids.join(', ')}`);
      console.log(`   Manteniendo ID ${ids[0]}, actualizando los demás...`);
      
      for (let i = 1; i < ids.length; i++) {
        const nuevocelular = `${celularOriginal}_dup${i}`;
        await sequelize.query(`
          UPDATE "Users" 
          SET celular = :nuevo 
          WHERE id = :id;
        `, {
          replacements: { nuevo: nuevocelular, id: ids[i] }
        });
        console.log(`   ✓ ID ${ids[i]}: ${celularOriginal} → ${nuevocelular}`);
      }
    }
    
    console.log("\n✅ Duplicados corregidos exitosamente");
    console.log("ℹ️ Los usuarios afectados deberán actualizar su celular desde su perfil");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

corregirDuplicados();
