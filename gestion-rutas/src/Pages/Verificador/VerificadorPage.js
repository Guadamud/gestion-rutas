import React, { useState, useEffect } from 'react';
import RoleHeader from '../../components/RoleHeader';
import {
  Container, Typography, Card, CardContent, Box,
  TextField, Button, Alert, Table, TableHead,
  TableBody, TableRow, TableCell, Chip, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Avatar, Divider, Grid,
  TableContainer, IconButton, useTheme
} from '@mui/material';
import {
  QrCodeScanner, CheckCircle, Cancel, History,
  Info, Refresh, Search, CameraAlt, ChevronLeft, ChevronRight
} from '@mui/icons-material';
import CustomSnackbar from '../../components/CustomSnackbar';
import QRScanner from '../../components/QRScanner';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Función para convertir hora de 24h a 12h AM/PM
const convertirHoraAMPM = (hora24) => {
  if (!hora24) return '';
  const [horas, minutos] = hora24.split(':');
  const h = parseInt(horas);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutos} ${ampm}`;
};

const VerificadorPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openScanner, setOpenScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const mostrarAlerta = (mensaje, tipo = 'success') => {
    setSnackbar({ open: true, message: mensaje, severity: tipo });
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/verificacion/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorial(response.data);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  };

  const consultarTicket = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/verificacion/ticket/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketInfo(response.data);
      setOpenDialog(true);
    } catch (error) {
      mostrarAlerta(
        error.response?.data?.message || 'Error al consultar el ticket',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const verificarTicket = async (idDirecto) => {
    const idAVerificar = idDirecto || ticketId.trim();
    if (!idAVerificar) {
      mostrarAlerta('Por favor ingrese el ID del ticket', 'warning');
      return;
    }

    setScanning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/verificacion/verificar`,
        { ticketId: idAVerificar },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      mostrarAlerta('✓ Ticket verificado exitosamente', 'success');
      setTicketInfo(response.data.frecuencia);
      setOpenDialog(true);
      setTicketId('');
      cargarHistorial();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al verificar el ticket';
      const errorCode = error.response?.data?.error;
      
      if (errorCode === 'TICKET_ALREADY_USED') {
        mostrarAlerta('⚠️ Este ticket ya fue utilizado anteriormente', 'error');
      } else if (errorCode === 'TICKET_NOT_FOUND') {
        mostrarAlerta('❌ Ticket no encontrado', 'error');
      } else {
        mostrarAlerta(errorMsg, 'error');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verificarTicket();
    }
  };

  const handleScanSuccess = (scannedTicketId) => {
    setTicketId(scannedTicketId);
    setOpenScanner(false);
    // Verificar automáticamente usando el id directo (evita stale closure)
    verificarTicket(scannedTicketId);
  };

  const getEstadoChip = (estado) => {
    switch(estado) {
      case 'usado':
        return <Chip label="Verificado" color="success" size="small" icon={<CheckCircle />} />;
      case 'pendiente':
        return <Chip label="Pendiente" color="warning" size="small" />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  // Calcular items paginados
  const totalPages = Math.ceil(historial.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const historialPaginado = historial.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header con rol distintivo */}
      <RoleHeader 
        rol="verificador" 
        titulo="Verificación de Tickets"
        subtitulo="Escanea o ingresa el ID del ticket para verificar"
      />

      {/* Panel de Verificación */}
      <Card sx={{ mb: 4, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <QrCodeScanner sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6">
              Escanear Ticket
            </Typography>
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID del Ticket o Código QR"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ingrese o escanee el código del ticket"
                disabled={scanning}
                InputProps={{
                  startAdornment: <QrCodeScanner sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setOpenScanner(true)}
                startIcon={<CameraAlt />}
                sx={{
                  height: 56,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    bgcolor: theme.palette.primary.main,
                    color: 'white'
                  }
                }}
              >
                Abrir Cámara
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={verificarTicket}
                disabled={scanning || !ticketId.trim()}
                startIcon={scanning ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckCircle />}
                sx={{
                  background: theme.palette.success.main,
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': { 
                    background: theme.palette.success.dark,
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  },
                  '&:disabled': {
                    background: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled
                  },
                  height: 56,
                  transition: 'all 0.2s ease'
                }}
              >
                {scanning ? 'Verificando...' : 'Verificar Ticket'}
              </Button>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 <strong>Consejo:</strong> Puedes escanear el código QR usando un lector externo y el código se ingresará automáticamente.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Estadísticas Rápidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            boxShadow: 3
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {historial.length}
                  </Typography>
                  <Typography variant="body2">
                    Tickets Verificados
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Historial de Verificaciones */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6">
                Historial de Verificaciones
              </Typography>
            </Box>
            <Button
              startIcon={<Refresh />}
              onClick={cargarHistorial}
              variant="outlined"
              size="small"
            >
              Actualizar
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Fecha/Hora</strong></TableCell>
                  <TableCell><strong>Ruta</strong></TableCell>
                  <TableCell><strong>Bus</strong></TableCell>
                  <TableCell><strong>Conductor</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historial.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No hay verificaciones registradas aún
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  historialPaginado.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {item.fecha.split('-').reverse().join('/')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {convertirHoraAMPM(item.horaSalida)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.Ruta ? (
                          <>
                            <Typography variant="body2">
                              {item.Ruta.origen} → {item.Ruta.destino}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ${parseFloat(item.Ruta.precio || 0).toFixed(2)}
                            </Typography>
                          </>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {item.Bus?.placa || '-'}
                      </TableCell>
                      <TableCell>
                        {item.Conductor ? (
                          <Typography variant="body2">
                            {item.Conductor.nombre}
                          </Typography>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {getEstadoChip(item.estadoVerificacion)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Info />}
                          onClick={() => consultarTicket(item.ticketId)}
                          variant="outlined"
                        >
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Controles de paginación */}
          {historial.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {startIndex + 1}-{Math.min(endIndex, historial.length)} de {historial.length}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 0}
                  size="small"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:disabled': { opacity: 0.3 }
                  }}
                >
                  <ChevronLeft />
                </IconButton>
                <Box sx={{ 
                  px: 2, 
                  py: 0.5, 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: 80,
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" fontWeight="bold">
                    {currentPage + 1} / {totalPages}
                  </Typography>
                </Box>
                <IconButton 
                  onClick={handleNextPage} 
                  disabled={currentPage >= totalPages - 1}
                  size="small"
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:disabled': { opacity: 0.3 }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Información del Ticket */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: ticketInfo?.estadoVerificacion === 'usado' 
            ? theme.palette.success.main
            : theme.palette.primary.main,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {ticketInfo?.estadoVerificacion === 'usado' ? <CheckCircle /> : <Info />}
          Información del Ticket
        </DialogTitle>
        
        {ticketInfo && (
          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              {getEstadoChip(ticketInfo.estadoVerificacion)}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Información del Viaje
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>📅 Fecha:</strong> {ticketInfo.fecha.split('-').reverse().join('/')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>⏰ Hora:</strong> {convertirHoraAMPM(ticketInfo.horaSalida)}
                </Typography>
                {ticketInfo.Ruta && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>🛣️ Ruta:</strong> {ticketInfo.Ruta.origen} → {ticketInfo.Ruta.destino}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>💵 Precio:</strong> ${parseFloat(ticketInfo.Ruta.precio || 0).toFixed(2)}
                    </Typography>
                  </>
                )}
                {ticketInfo.Bus && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>🚌 Bus:</strong> {ticketInfo.Bus.placa}
                  </Typography>
                )}
                {ticketInfo.Conductor && (
                  <Typography variant="body2">
                    <strong>👤 Conductor:</strong> {ticketInfo.Conductor.nombre}
                  </Typography>
                )}
              </Box>
            </Box>

            {ticketInfo.estadoVerificacion === 'usado' && ticketInfo.fechaVerificacion && (
              <Alert severity="success">
                <Typography variant="body2">
                  ✓ Verificado el {new Date(ticketInfo.fechaVerificacion).toLocaleString('es-ES')}
                </Typography>
                {ticketInfo.Verificador && (
                  <Typography variant="caption">
                    Por: {ticketInfo.Verificador.nombres} {ticketInfo.Verificador.apellidos}
                  </Typography>
                )}
              </Alert>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, wordBreak: 'break-all' }}>
              <strong>ID:</strong> {ticketInfo.ticketId}
            </Typography>
          </DialogContent>
        )}

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scanner QR con Cámara */}
      <QRScanner
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        onScan={handleScanSuccess}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Container>
  );
};

export default VerificadorPage;
