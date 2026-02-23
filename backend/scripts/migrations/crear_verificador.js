const bcrypt = require('bcryptjs');
const { User } = require('./models');
const { sequelize } = require('./config/database');

async function crearUsuarioVerificador() {
  try {
    await sequelize.sync();

    console.log('\n=== CREAR USUARIO VERIFICADOR ===\n');

    // Datos del verificador
    const verificadorData = {
      nombres: 'María José',
      apellidos: 'Verificador Sistema',
      cedula: '1717171717',
      celular: '0987654321',
      email: 'verificador@sistema.com',
      password: await bcrypt.hash('verificador123', 10),
      rol: 'verificador'
    };

    // Verificar si ya existe
    const existente = await User.findOne({ where: { email: verificadorData.email } });
    if (existente) {
      console.log('⚠️  El usuario verificador ya existe!');
      console.log('Email:', verificadorData.email);
      console.log('\nPuedes iniciar sesión con:');
      console.log('Email: verificador@sistema.com');
      console.log('Contraseña: verificador123');
      process.exit(0);
    }

    // Crear el usuario
    const verificador = await User.create(verificadorData);

    console.log('✅ Usuario verificador creado exitosamente!\n');
    console.log('==========================================');
    console.log('DATOS DE ACCESO:');
    console.log('==========================================');
    console.log('Email:      verificador@sistema.com');
    console.log('Contraseña: verificador123');
    console.log('Rol:        verificador');
    console.log('==========================================\n');
    console.log('Puedes iniciar sesión con estas credenciales.');
    console.log('IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuario verificador:', error);
    process.exit(1);
  }
}

crearUsuarioVerificador();
