const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Cliente = require("../models/Cliente");
const Conductor = require("../models/Conductor");
const Bus = require("../models/Bus");

// Ruta TEMPORAL para listar todos los usuarios (DEBUGGING)
// ⚠️ ELIMINAR EN PRODUCCIÓN
router.get("/listar-usuarios", async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'nombres', 'apellidos', 'email', 'rol', 'cedula', 'celular', 'createdAt']
    });

    res.json({
      total: usuarios.length,
      usuarios: usuarios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta TEMPORAL para crear el primer admin
// ⚠️ ELIMINAR DESPUÉS DE CREAR EL ADMIN
router.post("/crear-primer-admin", async (req, res) => {
  try {
    // Verificar si ya existe un admin
    const adminExiste = await User.findOne({ where: { rol: "admin" } });
    
    if (adminExiste) {
      return res.status(400).json({ 
        message: "Ya existe un usuario administrador. Esta ruta está deshabilitada por seguridad." 
      });
    }

    // Datos del admin por defecto
    const username = "admin";
    const password = "admin123"; // ¡Cambiar después!
    const email = "admin@gestionrutas.com";

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el admin
    const admin = await User.create({
      username,
      password: hashedPassword,
      email,
      rol: "admin",
      nombre: "Administrador",
      apellido: "Sistema"
    });

    res.status(201).json({
      message: "✅ Usuario administrador creado exitosamente",
      datos: {
        username: admin.username,
        email: admin.email,
        rol: admin.rol
      },
      advertencia: "⚠️ POR FAVOR CAMBIA LA CONTRASEÑA INMEDIATAMENTE después de iniciar sesión"
    });

  } catch (error) {
    console.error("Error al crear admin:", error);
    res.status(500).json({ 
      message: "Error al crear administrador", 
      error: error.message 
    });
  }
});

// Ruta TEMPORAL para agregar campo cooperativaId a clientes y buses
// ⚠️ ELIMINAR DESPUÉS DE USAR
router.post("/agregar-cooperativa-id", async (req, res) => {
  try {
    const { sequelize } = require("../config/database");
    
    console.log("🚀 Iniciando migración: Agregar cooperativaId a clientes y buses...");

    // 1. Agregar columna cooperativaId a tabla clientes
    console.log("📝 Agregando cooperativaId a tabla clientes...");
    await sequelize.query(`
      ALTER TABLE clientes 
      ADD COLUMN IF NOT EXISTS "cooperativaId" INTEGER
      REFERENCES cooperativas(id) ON DELETE SET NULL;
    `);
    
    // 2. Agregar columna cooperativaId a tabla buses  
    console.log("📝 Agregando cooperativaId a tabla buses...");
    await sequelize.query(`
      ALTER TABLE buses 
      ADD COLUMN IF NOT EXISTS "cooperativaId" INTEGER
      REFERENCES cooperativas(id) ON DELETE SET NULL;
    `);
    
    // 3. Crear índices para mejorar búsquedas
    console.log("📝 Creando índices...");
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_cooperativa 
      ON clientes("cooperativaId");
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_buses_cooperativa 
      ON buses("cooperativaId");
    `);
    
    console.log("✅ Migración completada exitosamente!");

    res.status(200).json({
      message: "✅ Campo cooperativaId agregado exitosamente a clientes y buses",
      detalles: {
        tablas: ["clientes", "buses"],
        indices: ["idx_clientes_cooperativa", "idx_buses_cooperativa"]
      }
    });

  } catch (error) {
    console.error("❌ Error en la migración:", error);
    res.status(500).json({ 
      message: "Error al agregar cooperativaId", 
      error: error.message 
    });
  }
});

// Ruta TEMPORAL para cargar datos de ejemplo
// ⚠️ ELIMINAR DESPUÉS DE USAR
router.post("/cargar-datos-ejemplo", async (req, res) => {
  try {
    const datosEjemplo = require("../scripts/datosEjemplo");
    const resultados = {
      clientes: { creados: 0, errores: 0 },
      conductores: { creados: 0, errores: 0 },
      buses: { creados: 0, errores: 0 }
    };

    console.log("🚀 Iniciando carga de datos de ejemplo...");

    // 1. Crear Users y Clientes
    for (let i = 0; i < datosEjemplo.clientes.length; i++) {
      const clienteData = datosEjemplo.clientes[i];
      
      try {
        // Verificar si ya existe
        const existeUser = await User.findOne({ where: { email: clienteData.email } });
        if (existeUser) {
          console.log(`⚠️ Cliente ya existe: ${clienteData.email}`);
          continue;
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(clienteData.password, 10);

        // Crear User con rol cliente
        const nuevoUser = await User.create({
          nombres: clienteData.nombres,
          apellidos: clienteData.apellidos,
          cedula: clienteData.cedula,
          celular: clienteData.celular,
          email: clienteData.email,
          password: hashedPassword,
          rol: "cliente",
          tema_preferido: "grisProfesional"
        });

        // Crear registro en tabla Cliente
        await Cliente.create({
          userId: nuevoUser.id,
          nombres: clienteData.nombres,
          apellidos: clienteData.apellidos,
          cedula: clienteData.cedula,
          telefono: clienteData.celular,
          email: clienteData.email
        });

        resultados.clientes.creados++;
        console.log(`✅ Cliente creado: ${clienteData.email}`);

      } catch (error) {
        resultados.clientes.errores++;
        console.error(`❌ Error al crear cliente ${clienteData.email}:`, error.message);
      }
    }

    // 2. Crear Users Conductores y Buses
    const clientesCreados = await Cliente.findAll({ order: [['id', 'ASC']] });

    for (let i = 0; i < datosEjemplo.conductores.length && i < clientesCreados.length; i++) {
      const conductorData = datosEjemplo.conductores[i];
      const busData = datosEjemplo.buses[i];
      const clienteAsociado = clientesCreados[i];

      // Crear User conductor
      try {
        const existeConductor = await User.findOne({ where: { email: conductorData.email } });
        if (!existeConductor) {
          const hashedPassword = await bcrypt.hash(conductorData.password, 10);

          const nuevoConductorUser = await User.create({
            nombres: conductorData.nombres,
            apellidos: conductorData.apellidos,
            cedula: conductorData.cedula,
            celular: conductorData.telefono,
            email: conductorData.email,
            password: hashedPassword,
            rol: "conductor",
            tema_preferido: "marronTierra"
          });

          // Crear registro en tabla Conductor
          await Conductor.create({
            clienteId: clienteAsociado.id,
            usuarioId: nuevoConductorUser.id,
            nombre: `${conductorData.nombres} ${conductorData.apellidos}`,
            cedula: conductorData.cedula,
            telefono: conductorData.telefono,
            email: conductorData.email,
            tipoLicencia: conductorData.tipoLicencia,
            vencimientoLicencia: conductorData.vencimientoLicencia
          });

          resultados.conductores.creados++;
          console.log(`✅ Conductor creado: ${conductorData.email}`);
        }
      } catch (error) {
        resultados.conductores.errores++;
        console.error(`❌ Error al crear conductor ${conductorData.email}:`, error.message);
      }

      // Crear Bus
      try {
        const existeBus = await Bus.findOne({ where: { placa: busData.placa } });
        if (!existeBus) {
          await Bus.create({
            numero: busData.numero,
            placa: busData.placa,
            modelo: busData.modelo,
            capacidad: busData.capacidad,
            usuarioId: clienteAsociado.id,
            estado: "activo"
          });

          resultados.buses.creados++;
          console.log(`✅ Bus creado: ${busData.placa}`);
        }
      } catch (error) {
        resultados.buses.errores++;
        console.error(`❌ Error al crear bus ${busData.placa}:`, error.message);
      }
    }

    console.log("✅ Carga de datos completada");
    
    res.status(201).json({
      message: "Datos de ejemplo cargados exitosamente",
      resultados: resultados
    });

  } catch (error) {
    console.error("❌ ERROR GENERAL:", error);
    res.status(500).json({ 
      message: "Error al cargar datos de ejemplo", 
      error: error.message 
    });
  }
});

module.exports = router;
