import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Alert, IconButton
} from '@mui/material';
import { Close, CameraAlt } from '@mui/icons-material';
import { professionalColors } from '../utils/professionalColors';

const QRScanner = ({ open, onClose, onScan }) => {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    try {
      setError('');
      
      // Primero solicitar permiso explícito de la cámara
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Detener el stream inmediatamente, solo queríamos el permiso
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('Error de permisos:', permError);
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          setError('Debes permitir el acceso a la cámara. Haz clic en "Permitir" cuando el navegador lo solicite.');
          return;
        }
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      // Obtener cámaras disponibles
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        setError('No se encontraron cámaras. Verifica que tu dispositivo tenga cámara.');
        return;
      }

      console.log('Cámaras encontradas:', devices);
      setCameras(devices);

      // Preferir cámara trasera
      const backCamera = devices.find(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || 
               label.includes('trasera') || 
               label.includes('rear') ||
               label.includes('environment');
      });
      
      const cameraId = backCamera ? backCamera.id : devices[0].id;
      setSelectedCamera(cameraId);

      console.log('Usando cámara:', cameraId);

      // Configuración optimizada del escáner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false
      };

      await html5QrCode.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          console.log('QR escaneado:', decodedText);
          // Cuando se escanea exitosamente
          try {
            const data = JSON.parse(decodedText);
            if (data.ticketId) {
              onScan(data.ticketId);
            } else {
              onScan(decodedText);
            }
          } catch (e) {
            // Si no es JSON, usar el texto directo
            onScan(decodedText);
          }
          stopScanner();
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo (no hay QR en vista)
        }
      );

      setScanning(true);
      console.log('Escáner iniciado exitosamente');
    } catch (err) {
      console.error('Error detallado al iniciar escáner:', err);
      let errorMsg = 'Error al acceder a la cámara. ';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador y recarga la página.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No se encontró ninguna cámara en tu dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que usen la cámara e intenta de nuevo.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'No se pudo acceder a la cámara con las restricciones solicitadas.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error al detener escáner:', err);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#000',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: professionalColors.primary, 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraAlt />
          Escanear Código QR
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
        {error && (
          <Box sx={{ m: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Alert severity="info">
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Para permitir el acceso a la cámara:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                1. Busca el icono de 🔒 o 🎥 en la barra de dirección<br/>
                2. Haz clic y selecciona "Permitir" para la cámara<br/>
                3. Recarga la página o cierra y abre el diálogo de nuevo
              </Typography>
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={startScanner}
              sx={{ mt: 2, bgcolor: professionalColors.primary }}
            >
              Reintentar
            </Button>
          </Box>
        )}

        {!error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                📱 <strong>Primer uso:</strong> El navegador pedirá permiso para usar la cámara. 
                Debes hacer clic en "Permitir" o "Allow".
              </Typography>
            </Alert>
            
            <Typography variant="body2" align="center" sx={{ mb: 2, color: 'white' }}>
              Coloca el código QR dentro del recuadro
            </Typography>
            
            {/* Contenedor del escáner */}
            <Box 
              id="qr-reader" 
              sx={{ 
                width: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                '& video': {
                  borderRadius: 2
                }
              }}
            />

            {scanning && (
              <Alert severity="info" sx={{ mt: 2 }}>
                🎥 Escaneando... Apunta la cámara al código QR
              </Alert>
            )}

            {cameras.length > 1 && (
              <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'white', textAlign: 'center' }}>
                {cameras.length} cámaras disponibles
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#1a1a1a', p: 2 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ color: 'white', borderColor: 'white' }}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRScanner;
