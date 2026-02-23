require("dotenv").config();
const { sequelize } = require("../config/database");

async function describeTable() {
  try {
    const tableName = process.argv[2] || 'Frecuencia';
    
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `);
    
    console.log(`\n📋 Columnas de la tabla ${tableName}:\n`);
    columns.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
    console.log(`\n✅ Total: ${columns.length} columnas\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

describeTable();
