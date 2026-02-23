const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:5000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

async function cambiarClaveAdmin() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   🔐 CAMBIAR CLAVE DE AUTORIZACIÓN DE ADMINISTRADOR   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Paso 1: Solicitar credenciales de login
    console.log('📋 Paso 1: Autenticación de Administrador\n');
    const email = await pregunta('Email del administrador: ');
    const password = await pregunta('Contraseña actual de login: ');

    // Hacer login
    console.log('\n🔄 Iniciando sesión...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });

    const token = loginResponse.data.token;
    const userData = loginResponse.data.user;

    if (userData.rol !== 'admin') {
      console.log('\n❌ Error: Este usuario no es administrador');
      rl.close();
      return;
    }

    console.log(`✅ Login exitoso como ${userData.nombres} ${userData.apellidos}\n`);

    // Paso 2: Solicitar nueva clave
    console.log('🔑 Paso 2: Nueva Clave de Autorización\n');
    const claveNueva = await pregunta('Ingrese nueva clave (4-6 dígitos): ');

    // Validar formato
    if (!/^\d{4,6}$/.test(claveNueva)) {
      console.log('\n❌ Error: La clave debe ser de 4 a 6 dígitos numéricos');
      rl.close();
      return;
    }

    const confirmacion = await pregunta(`Confirme la nueva clave (${claveNueva}): `);

    if (claveNueva !== confirmacion) {
      console.log('\n❌ Error: Las claves no coinciden');
      rl.close();
      return;
    }

    // Cambiar la clave
    console.log('\n🔄 Estableciendo nueva clave...');
    const response = await axios.post(
      `${API_URL}/api/admin/clave-autorizacion`,
      {
        password_admin: password,
        clave_nueva: claveNueva
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('\n✅ ¡Clave actualizada exitosamente!');
    console.log('🔐 Nueva clave de autorización: ' + claveNueva);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   • Guarde esta clave en un lugar seguro');
    console.log('   • No la comparta por medios no seguros');
    console.log('   • Proporciónela solo al momento de autorizar cierres de caja');
    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.log('\n❌ Error:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Sugerencia: Verifique que la contraseña sea correcta');
    }
  } finally {
    rl.close();
  }
}

// Ejecutar
cambiarClaveAdmin();
