require("dotenv").config();
const { Sequelize } = require("sequelize");

// Configuración para soportar DATABASE_URL (Render, Heroku, etc.) o variables separadas
let sequelize;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL para servicios como Render
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Usar variables de entorno separadas para desarrollo local
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: "postgres",
      port: process.env.DB_PORT,
      logging: false,
    }
  );
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión a PostgreSQL exitosa");
  } catch (error) {
    console.error("❌ Error al conectar a PostgreSQL:", error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
