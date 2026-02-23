require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize } = require("./config/database");
const { User } = require("./models");

async function crearAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✅ Conexión exitosa");

    const passwordHash = await bcrypt.hash("123456", 10);

    const admin = await User.create({
      nombres: "Admin",
      apellidos: "Sistema",
      cedula: "9999999999",
      celular: "0999999999",
      email: "admin@sistema.com",
      password: passwordHash,
      rol: "admin"
    });

    console.log("\n✅ Usuario ADMIN creado exitosamente!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: admin@sistema.com");
    console.log("🔑 Password: 123456");
    console.log("👑 Rol: ADMIN");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    process.exit(0);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log("\n⚠️  El usuario admin ya existe. Usa estas credenciales:");
      console.log("📧 Email: admin@sistema.com");
      console.log("🔑 Password: 123456");
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

crearAdmin();
