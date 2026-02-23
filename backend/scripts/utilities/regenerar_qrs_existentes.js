const { Frecuencia, Ruta, Bus, Conductor } = require('./models');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

async function regenerarQRsExistentes() {
  try {
    console.log('🔄 Buscando frecuencias sin código QR...\n');

    const frecuenciasSinQR = await Frecuencia.findAll({
      where: {
        ticketId: null
      }
    });

    if (frecuenciasSinQR.length === 0) {
      console.log('✅ Todas las frecuencias ya tienen código QR generado.');
      process.exit(0);
    }

    console.log(`📋 Encontradas ${frecuenciasSinQR.length} frecuencias sin QR\n`);

    for (const frecuencia of frecuenciasSinQR) {
      const ticketId = uuidv4();
      const qrCodeData = JSON.stringify({
        ticketId,
        rutaId: frecuencia.rutaId,
        busId: frecuencia.busId,
        conductorId: frecuencia.conductorId,
        fecha: frecuencia.fecha,
        horaSalida: frecuencia.horaSalida
      });

      const qrCodeImage = await QRCode.toDataURL(qrCodeData);

      await frecuencia.update({
        ticketId,
        qrCode: qrCodeImage,
        estadoVerificacion: 'pendiente'
      });

      console.log(`✓ Frecuencia #${frecuencia.id} - QR generado`);
    }

    console.log(`\n✅ Se generaron ${frecuenciasSinQR.length} códigos QR exitosamente!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al regenerar QRs:', error);
    process.exit(1);
  }
}

regenerarQRsExistentes();
