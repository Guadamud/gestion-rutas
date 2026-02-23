const { Frecuencia } = require("./models");

async function actualizarEstadoFrecuencias() {
  try {
    console.log("Actualizando frecuencias registradas por conductores...");
    
    // Actualizar todas las frecuencias que:
    // 1. Fueron registradas por conductores
    // 2. Tienen estado "pendiente"
    const result = await Frecuencia.update(
      { estado: "pagado" },
      {
        where: {
          registradoPor: "conductor",
          estado: "pendiente"
        }
      }
    );

    console.log(`✅ ${result[0]} frecuencias actualizadas de "pendiente" a "pagado"`);
    
    // Mostrar las frecuencias actualizadas
    const frecuenciasActualizadas = await Frecuencia.findAll({
      where: { registradoPor: "conductor" }
    });
    
    console.log("\nFrecuencias registradas por conductores:");
    frecuenciasActualizadas.forEach(f => {
      console.log(`  ID: ${f.id}, Estado: ${f.estado}, Fecha: ${f.fecha}, Hora: ${f.horaSalida}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

actualizarEstadoFrecuencias();
