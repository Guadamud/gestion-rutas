const { sequelize } = require("./config/database");

async function agregarClaveAutorizacion() {
  try {
    console.log("🔄 Agregando columna clave_autorizacion a tabla Users...");

    // Primero verificar el nombre de la tabla
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE 'users'
    `);
    
    const tableName = tables[0]?.table_name || 'Users';
    console.log(`📋 Nombre de tabla detectado: ${tableName}`);

    // Agregar columna clave_autorizacion
    await sequelize.query(`
      ALTER TABLE "${tableName}" 
      ADD COLUMN clave_autorizacion VARCHAR(255)
    `);

    console.log("✅ Columna clave_autorizacion agregada exitosamente");

    // Establecer una clave por defecto "1234" para todos los administradores
    const bcrypt = require("bcryptjs");
    const claveHasheada = await bcrypt.hash("1234", 10);
    
    const [result] = await sequelize.query(`
      UPDATE "${tableName}" 
      SET clave_autorizacion = :clave
      WHERE rol = 'admin'
    `, {
      replacements: { clave: claveHasheada }
    });

    console.log("✅ Clave por defecto '1234' asignada a administradores");
    console.log("⚠️  IMPORTANTE: Cambia esta clave desde el panel de administración");

  } catch (error) {
    if (error.message.includes("Duplicate column name")) {
      console.log("ℹ️  La columna clave_autorizacion ya existe");
    } else {
      console.error("❌ Error:", error.message);
    }
  } finally {
    await sequelize.close();
  }
}

agregarClaveAutorizacion();
