require("dotenv").config();
const { sequelize } = require("../config/database");

async function listTables() {
  try {
    const tables = await sequelize.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\n📋 Tablas en la base de datos:\n');
    tables.forEach(t => console.log(`  - ${t.tablename}`));
    console.log(`\n✅ Total: ${tables.length} tablas\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

listTables();
