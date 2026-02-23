import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Usuarios de prueba predefinidos
export const usuariosPrueba = [
  {
    nombres: "Administrator",
    apellidos: "Sistema",
    cedula: "1234567890",
    celular: "0999999999",
    email: "admin@test.com",
    password: "admin123",
    rol: "admin"
  },
  {
    nombres: "Tesorero",
    apellidos: "Principal",
    cedula: "1234567891",
    celular: "0999999998",
    email: "tesoreria@test.com",
    password: "tesoreria123",
    rol: "tesoreria"
  },
  {
    nombres: "Cliente",
    apellidos: "Demo",
    cedula: "1234567892",
    celular: "0999999997",
    email: "cliente@test.com",
    password: "cliente123",
    rol: "cliente"
  },
  {
    nombres: "Carlos",
    apellidos: "Conductor",
    cedula: "1234567893",
    celular: "0999999996",
    email: "carlos@test.com",
    password: "carlos123",
    rol: "cliente"
  },
  {
    nombres: "María",
    apellidos: "Operadora",
    cedula: "1234567894",
    celular: "0999999995",
    email: "maria@test.com",
    password: "maria123",
    rol: "cliente"
  }
];

// Rutas de prueba
export const rutasPrueba = [
  {
    origen: "Terminal Centro",
    destino: "Terminal Norte",
    distancia: 15.5,
    tiempoViaje: 45,
    descripcion: "Ruta principal que conecta el centro de la ciudad con la zona norte"
  },
  {
    origen: "Terminal Sur",
    destino: "Terminal Este",
    distancia: 12.3,
    tiempoViaje: 35,
    descripcion: "Ruta comercial que une el sector sur con la zona industrial del este"
  },
  {
    origen: "Centro",
    destino: "Aeropuerto",
    distancia: 8.7,
    tiempoViaje: 25,
    descripcion: "Ruta express al aeropuerto internacional"
  },
  {
    origen: "Universidad",
    destino: "Centro Comercial",
    distancia: 6.2,
    tiempoViaje: 20,
    descripcion: "Ruta estudiantil que conecta la universidad con el centro comercial"
  },
  {
    origen: "Hospital",
    destino: "Mercado Central",
    distancia: 4.8,
    tiempoViaje: 15,
    descripcion: "Ruta de servicios públicos"
  }
];

// Buses de prueba
export const busesPrueba = [
  {
    placa: "ABC-1234",
    capacidad: 45,
    estado: "activo",
    marca: "Mercedes Benz",
    modelo: "OF-1721",
    año: 2020,
    usuarioId: null
  },
  {
    placa: "DEF-5678",
    capacidad: 50,
    estado: "activo",
    marca: "Volvo",
    modelo: "B290R",
    año: 2019,
    usuarioId: null
  },
  {
    placa: "GHI-9012",
    capacidad: 40,
    estado: "mantenimiento",
    marca: "Scania",
    modelo: "K280",
    año: 2021,
    usuarioId: null
  },
  {
    placa: "JKL-3456",
    capacidad: 42,
    estado: "activo",
    marca: "Mercedes Benz",
    modelo: "OF-1721",
    año: 2018,
    usuarioId: null
  },
  {
    placa: "MNO-7890",
    capacidad: 48,
    estado: "activo",
    marca: "Iveco",
    modelo: "Urbanway",
    año: 2022,
    usuarioId: null
  }
];

// Función principal para crear todos los datos de prueba
export const crearTodosLosDatosPrueba = async () => {
  const resultados = {
    usuarios: { creados: 0, existentes: 0, errores: [] },
    rutas: { creados: 0, existentes: 0, errores: [] },
    buses: { creados: 0, existentes: 0, errores: [] },
    frecuencias: { creados: 0, existentes: 0, errores: [] }
  };

  try {
    // Crear usuarios
    console.log('Creando usuarios de prueba...');
    for (const usuario of usuariosPrueba) {
      try {
        await axios.post(`${API_URL}/auth/register`, usuario);
        resultados.usuarios.creados++;
        console.log(`✓ Usuario creado: ${usuario.email}`);
      } catch (err) {
        if (err.response?.status === 400 && err.response?.data?.message?.includes("ya existe")) {
          resultados.usuarios.existentes++;
          console.log(`- Usuario ya existe: ${usuario.email}`);
        } else {
          resultados.usuarios.errores.push(`Error creando ${usuario.email}: ${err.message}`);
          console.error(`✗ Error creando ${usuario.email}:`, err.message);
        }
      }
    }

    // Crear rutas
    console.log('Creando rutas de prueba...');
    for (const ruta of rutasPrueba) {
      try {
        await axios.post("http://localhost:5000/api/rutas", ruta);
        resultados.rutas.creados++;
        console.log(`✓ Ruta creada: ${ruta.origen} - ${ruta.destino}`);
      } catch (err) {
        if (err.response?.status === 400) {
          resultados.rutas.existentes++;
          console.log(`- Ruta ya existe: ${ruta.origen} - ${ruta.destino}`);
        } else {
          resultados.rutas.errores.push(`Error creando ruta ${ruta.origen} - ${ruta.destino}: ${err.message}`);
          console.error(`✗ Error creando ruta:`, err.message);
        }
      }
    }

    // Crear buses
    console.log('Creando buses de prueba...');
    for (const bus of busesPrueba) {
      try {
        await axios.post("http://localhost:5000/api/buses", bus);
        resultados.buses.creados++;
        console.log(`✓ Bus creado: ${bus.placa}`);
      } catch (err) {
        if (err.response?.status === 400) {
          resultados.buses.existentes++;
          console.log(`- Bus ya existe: ${bus.placa}`);
        } else {
          resultados.buses.errores.push(`Error creando bus ${bus.placa}: ${err.message}`);
          console.error(`✗ Error creando bus:`, err.message);
        }
      }
    }

    // Asignar algunos buses a usuarios (después de que se hayan creado)
    await asignarBusesAUsuarios();

    // Crear algunas frecuencias de ejemplo
    await crearFrecuenciasPrueba();

    console.log('Datos de prueba creados exitosamente:', resultados);
    return resultados;

  } catch (error) {
    console.error('Error general creando datos de prueba:', error);
    throw error;
  }
};

// Función para asignar buses a usuarios
const asignarBusesAUsuarios = async () => {
  try {
    // Obtener usuarios
    const responseUsuarios = await axios.get("http://localhost:5000/api/usuarios");
    const usuarios = responseUsuarios.data;

    // Obtener buses
    const responseBuses = await axios.get("http://localhost:5000/api/buses");
    const buses = responseBuses.data;

    // Asignar el primer bus disponible al cliente Carlos
    const carlos = usuarios.find(u => u.email === "carlos@test.com");
    const maria = usuarios.find(u => u.email === "maria@test.com");
    
    if (carlos && buses[0]) {
      try {
        await axios.put(`http://localhost:5000/api/buses/${buses[0].id}`, {
          ...buses[0],
          usuarioId: carlos.id
        });
        console.log(`✓ Bus ${buses[0].placa} asignado a Carlos`);
      } catch (err) {
        console.log(`- Error asignando bus a Carlos: ${err.message}`);
      }
    }

    if (maria && buses[1]) {
      try {
        await axios.put(`http://localhost:5000/api/buses/${buses[1].id}`, {
          ...buses[1],
          usuarioId: maria.id
        });
        console.log(`✓ Bus ${buses[1].placa} asignado a María`);
      } catch (err) {
        console.log(`- Error asignando bus a María: ${err.message}`);
      }
    }

  } catch (error) {
    console.log('Error asignando buses a usuarios:', error.message);
  }
};

// Función para crear frecuencias de prueba
const crearFrecuenciasPrueba = async () => {
  try {
    // Obtener rutas y buses
    const [responseRutas, responseBuses] = await Promise.all([
      axios.get("http://localhost:5000/api/rutas"),
      axios.get("http://localhost:5000/api/buses")
    ]);

    const rutas = responseRutas.data;
    const buses = responseBuses.data.filter(b => b.usuarioId);

    if (rutas.length === 0 || buses.length === 0) {
      console.log('No hay rutas o buses disponibles para crear frecuencias');
      return;
    }

    // Crear frecuencias para hoy y los próximos días
    const hoy = new Date();
    const frecuenciasPrueba = [];

    for (let dia = 0; dia < 3; dia++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      // Crear varias frecuencias por día
      const horarios = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      
      for (let i = 0; i < Math.min(horarios.length, buses.length); i++) {
        const frecuencia = {
          fecha: fechaStr,
          horaSalida: horarios[i],
          rutaId: rutas[i % rutas.length].id,
          busId: buses[i % buses.length].id,
          estado: Math.random() > 0.3 ? 'pagado' : 'pendiente'
        };

        frecuenciasPrueba.push(frecuencia);
      }
    }

    // Crear las frecuencias
    for (const frecuencia of frecuenciasPrueba) {
      try {
        await axios.post("http://localhost:5000/api/frecuencias", frecuencia);
        console.log(`✓ Frecuencia creada: ${frecuencia.fecha} ${frecuencia.horaSalida}`);
      } catch (err) {
        console.log(`- Error creando frecuencia: ${err.message}`);
      }
    }

  } catch (error) {
    console.log('Error creando frecuencias de prueba:', error.message);
  }
};

// Función simplificada para crear solo usuarios
export const crearSoloUsuarios = async () => {
  const resultados = { creados: 0, existentes: 0, errores: [] };

  for (const usuario of usuariosPrueba) {
    try {
      await axios.post(`${API_URL}/auth/register`, usuario);
      resultados.creados++;
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("ya existe")) {
        resultados.existentes++;
      } else {
        resultados.errores.push(`Error creando ${usuario.email}: ${err.message}`);
      }
    }
  }

  return resultados;
};
