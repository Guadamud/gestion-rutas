import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Divider, Chip, Alert
} from '@mui/material';
import {
  QrCode2, CheckCircle, Print, Download
} from '@mui/icons-material';
import { professionalColors } from '../utils/professionalColors';

// Función para convertir hora de 24h a 12h AM/PM
const convertirHoraAMPM = (hora24) => {
  if (!hora24) return '';
  const [horas, minutos] = hora24.split(':');
  const h = parseInt(horas);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutos} ${ampm}`;
};

const QRTicketDialog = ({ open, onClose, frecuencia }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const qrImage = frecuencia.qrCode;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - ${frecuencia.ticketId}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .ticket {
              border: 2px solid #333;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
            }
            .header {
              background: ${professionalColors.primary};
              color: white;
              padding: 15px;
              margin: -20px -20px 20px -20px;
              border-radius: 8px 8px 0 0;
            }
            .qr-container {
              margin: 20px 0;
              padding: 15px;
              background: white;
              border-radius: 8px;
            }
            .qr-image {
              width: 250px;
              height: 250px;
            }
            .info {
              text-align: left;
              margin: 15px 0;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              color: #000;
            }
            .ticket-id {
              font-size: 10px;
              color: #999;
              word-break: break-all;
              margin-top: 15px;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              border-top: 1px dashed #ccc;
              padding-top: 15px;
            }
            @media print {
              body { margin: 0; }
              .ticket { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🚌 TICKET DE VIAJE</h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Sistema de Gestión de Rutas</p>
            </div>
            
            <div class="qr-container">
              <img src="${qrImage}" alt="QR Code" class="qr-image" />
            </div>
            
            <div class="info">
              <div class="info-row">
                <span class="label">📅 Fecha:</span>
                <span class="value">${frecuencia.fecha.split('-').reverse().join('/')}</span>
              </div>
              <div class="info-row">
                <span class="label">⏰ Hora Salida:</span>
                <span class="value">${convertirHoraAMPM(frecuencia.horaSalida)}</span>
              </div>
              ${frecuencia.Ruta ? `
                <div class="info-row">
                  <span class="label">🛣️ Ruta:</span>
                  <span class="value">${frecuencia.Ruta.origen} → ${frecuencia.Ruta.destino}</span>
                </div>
                <div class="info-row">
                  <span class="label">💵 Precio:</span>
                  <span class="value">$${parseFloat(frecuencia.Ruta.precio || 0).toFixed(2)}</span>
                </div>
              ` : ''}
              ${frecuencia.Bus ? `
                <div class="info-row">
                  <span class="label">🚌 Bus:</span>
                  <span class="value">${frecuencia.Bus.placa}</span>
                </div>
              ` : ''}
              ${frecuencia.Conductor ? `
                <div class="info-row">
                  <span class="label">👤 Conductor:</span>
                  <span class="value">${frecuencia.Conductor.nombre}</span>
                </div>
              ` : ''}
            </div>
            
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0;">
              <strong style="color: #856404;">⚠️ IMPORTANTE:</strong>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #856404;">
                Este código QR es de un solo uso. Debe ser escaneado por el verificador antes del viaje.
              </p>
            </div>
            
            <div class="ticket-id">
              <strong>ID del Ticket:</strong><br/>
              ${frecuencia.ticketId}
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Generado el ${new Date().toLocaleString('es-ES')}</p>
              <p style="margin: 5px 0 0 0;">Este ticket es válido para un solo viaje</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = frecuencia.qrCode;
    link.download = `ticket-${frecuencia.ticketId}.png`;
    link.click();
  };

  if (!frecuencia) return null;

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'pendiente': return 'warning';
      case 'usado': return 'success';
      case 'verificado': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ 
        background: professionalColors.primary, 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <QrCode2 />
        Ticket de Viaje
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Chip 
            label={frecuencia.estadoVerificacion?.toUpperCase() || 'PENDIENTE'}
            color={getEstadoColor(frecuencia.estadoVerificacion)}
            icon={frecuencia.estadoVerificacion === 'usado' ? <CheckCircle /> : <QrCode2 />}
            sx={{ mb: 2, fontWeight: 'bold' }}
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 3,
          p: 2,
          bgcolor: '#f5f5f5',
          borderRadius: 2
        }}>
          <img 
            src={frecuencia.qrCode} 
            alt="Código QR" 
            style={{ 
              width: 250, 
              height: 250,
              border: '2px solid #ddd',
              borderRadius: 8,
              background: 'white',
              padding: 10
            }} 
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Información del Viaje
          </Typography>
          <Box sx={{ mt: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>📅 Fecha:</strong> {frecuencia.fecha.split('-').reverse().join('/')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>⏰ Hora de Salida:</strong> {convertirHoraAMPM(frecuencia.horaSalida)}
            </Typography>
            {frecuencia.Ruta && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>🛣️ Ruta:</strong> {frecuencia.Ruta.origen} → {frecuencia.Ruta.destino}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>💵 Precio:</strong> ${parseFloat(frecuencia.Ruta.precio || 0).toFixed(2)}
                </Typography>
              </>
            )}
            {frecuencia.Bus && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>🚌 Bus:</strong> {frecuencia.Bus.placa}
              </Typography>
            )}
            {frecuencia.Conductor && (
              <Typography variant="body2">
                <strong>👤 Conductor:</strong> {frecuencia.Conductor.nombre}
              </Typography>
            )}
          </Box>
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>⚠️ Importante:</strong> Este código QR es de un solo uso y debe ser escaneado por el verificador antes del viaje.
          </Typography>
        </Alert>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, wordBreak: 'break-all' }}>
          <strong>ID del Ticket:</strong> {frecuencia.ticketId}
        </Typography>

        {frecuencia.estadoVerificacion === 'usado' && frecuencia.fechaVerificacion && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✓ Verificado el {(() => {
                const fecha = new Date(frecuencia.fechaVerificacion);
                if (isNaN(fecha.getTime())) return 'fecha no disponible';
                return fecha.toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
              })()}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleDownload} 
          startIcon={<Download />}
          variant="outlined"
          disabled={frecuencia.estadoVerificacion === 'usado'}
        >
          Descargar QR
        </Button>
        <Button 
          onClick={handlePrint} 
          startIcon={<Print />}
          variant="contained"
          sx={{ 
            background: professionalColors.primary,
            '&:hover': { background: professionalColors.primaryDark }
          }}
        >
          Imprimir Ticket
        </Button>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRTicketDialog;
