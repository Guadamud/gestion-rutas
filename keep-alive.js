# Script para mantener el backend activo (opcional - alternativa a cron-job.org)
# Este script hace ping al backend cada 10 minutos

import https from 'https';

const BACKEND_URL = process.env.BACKEND_URL || 'https://TU-BACKEND.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutos

function ping() {
  const url = `${BACKEND_URL}/api/verificacion/health`;
  
  https.get(url, (res) => {
    console.log(`✅ Ping exitoso - Status: ${res.statusCode} - ${new Date().toISOString()}`);
  }).on('error', (err) => {
    console.error(`❌ Error en ping: ${err.message} - ${new Date().toISOString()}`);
  });
}

// Ping inicial
ping();

// Ping cada 10 minutos
setInterval(ping, PING_INTERVAL);

console.log(`🔄 Keep-alive iniciado para ${BACKEND_URL}`);
console.log(`⏰ Ping cada ${PING_INTERVAL / 60000} minutos`);
