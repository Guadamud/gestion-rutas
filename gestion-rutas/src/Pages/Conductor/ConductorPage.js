import React, { useEffect, useState } from 'react';
import RoleHeader from '../../components/RoleHeader';
import {
  Container, Typography, Card, CardContent, Grid, Box, 
  Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, FormControl, InputLabel,
  Select, Divider, Avatar, Alert, TableContainer,
  CircularProgress, TextField, useTheme
} from '@mui/material';
import {
  DirectionsBus, Schedule, Route, Add, Refresh, 
  AccountBalanceWallet, TrendingDown, QrCode2, AttachMoney
} from '@mui/icons-material';
import CustomSnackbar from '../../components/CustomSnackbar';
import QRTicketDialog from '../../components/QRTicketDialog';
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

// Función para obtener fecha local en formato YYYY-MM-DD
const obtenerFechaLocal = () => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

const ConductorPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [conductor, setConductor] = useState(null);
  const [frecuencias, setFrecuencias] = useState([]);
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [busesDisponibles, setBusesDisponibles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCompraSaldoDialog, setOpenCompraSaldoDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState(null);
  const [formCompraSaldo, setFormCompraSaldo] = useState({
    monto: '',
    metodoPago: 'efectivo',
    descripcion: '',
    comprobante: null,
    comprobantePreview: null
  });
  
  const [formFrecuencia, setFormFrecuencia] = useState({
    rutaId: '',
    busId: '',
    horaSalida: ''
  });

  const [fechaFiltro, setFechaFiltro] = useState(obtenerFechaLocal());

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const mostrarAlerta = (mensaje, tipo = 'success') => {
    setSnackbar({ open: true, message: mensaje, severity: tipo });
  };

  const cerrarAlerta = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Buscar conductor por usuarioId
      const conductorResp = await axios.get(`${API_URL}/api/conductores/usuario/${user.id}`, { headers });
      const miConductor = conductorResp.data;
      
      if (!miConductor) {
        mostrarAlerta('No se encontró información del conductor', 'error');
        return;
      }

      setConductor(miConductor);

      // Cargar frecuencias del conductor
      const frecuenciasResp = await axios.get(`${API_URL}/api/frecuencias`, { headers });
      
      // Filtrar frecuencias del conductor por la fecha seleccionada
      const misFrecuencias = frecuenciasResp.data
        .filter(f => {
          const fechaFrecuencia = new Date(f.fecha).toISOString().split('T')[0];
          return f.conductorId === miConductor.id && fechaFrecuencia === fechaFiltro;
        })
        .sort((a, b) => {
          // Ordenar por hora de salida descendente (más reciente primero)
          return b.horaSalida.localeCompare(a.horaSalida);
        });
      
      setFrecuencias(misFrecuencias);

      // Cargar rutas disponibles
      const rutasResp = await axios.get(`${API_URL}/api/rutas`, { headers });
      setRutasDisponibles(rutasResp.data);

      // Cargar buses del cliente
      const busesResp = await axios.get(`${API_URL}/api/buses/cliente/${miConductor.clienteId}`, { headers });
      // Filtrar solo buses activos
      setBusesDisponibles(busesResp.data.filter(bus => bus.estado === 'activo'));

    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirDialog = () => {
    setFormFrecuencia({
      rutaId: '',
      busId: '',
      horaSalida: new Date().toTimeString().slice(0, 5)
    });
    setOpenDialog(true);
  };

  const abrirDialogCompraSaldo = () => {
    setFormCompraSaldo({
      monto: '',
      metodoPago: 'efectivo',
      descripcion: '',
      comprobante: null,
      comprobantePreview: null
    });
    setOpenCompraSaldoDialog(true);
  };

  const solicitarCompraSaldo = async () => {
    if (!formCompraSaldo.monto || parseFloat(formCompraSaldo.monto) <= 0) {
      mostrarAlerta('Ingrese un monto válido', 'error');
      return;
    }

    // Validar comprobante para depósito y transferencia
    if ((formCompraSaldo.metodoPago === 'deposito' || formCompraSaldo.metodoPago === 'transferencia') && !formCompraSaldo.comprobante) {
      mostrarAlerta('Debe subir el comprobante de pago para depósitos y transferencias', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/clientes/${conductor.clienteId}/comprar-saldo`,
        {
          monto: parseFloat(formCompraSaldo.monto),
          metodoPago: formCompraSaldo.metodoPago,
          descripcion: formCompraSaldo.descripcion || `Solicitud de compra de saldo por conductor: ${conductor.nombre}`,
          solicitadoPor: 'conductor',
          conductorId: conductor.id,
          comprobante: formCompraSaldo.comprobante
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      mostrarAlerta('Solicitud de compra enviada correctamente', 'success');
      setOpenCompraSaldoDialog(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al crear solicitud', 'error');
    }
  };

  const handleComprobanteChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarAlerta('El archivo no debe superar los 5MB', 'warning');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        mostrarAlerta('Solo se permiten imágenes', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormCompraSaldo(prev => ({
          ...prev,
          comprobante: reader.result,
          comprobantePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
  };

  const crearFrecuencia = async () => {
    if (!formFrecuencia.rutaId || !formFrecuencia.busId || !formFrecuencia.horaSalida) {
      mostrarAlerta('Por favor completa todos los campos', 'warning');
      return;
    }

    const rutaSeleccionada = rutasDisponibles.find(r => r.id === parseInt(formFrecuencia.rutaId));
    const precioRuta = parseFloat(rutaSeleccionada?.precio || 0);

    if (conductor.saldo < precioRuta) {
      mostrarAlerta(`Saldo insuficiente. Necesitas $${precioRuta.toFixed(2)} para esta ruta. Tu saldo: $${conductor.saldo}`, 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API_URL}/api/frecuencias`, {
        conductorId: conductor.id,
        rutaId: parseInt(formFrecuencia.rutaId),
        busId: parseInt(formFrecuencia.busId),
        fecha: obtenerFechaLocal(),
        horaSalida: formFrecuencia.horaSalida
      }, { headers });

      mostrarAlerta('Frecuencia registrada correctamente');
      cerrarDialog();
      cargarDatos();
    } catch (error) {
      console.error('Error al crear frecuencia:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al registrar frecuencia', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!conductor) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">No se encontró información del conductor</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header con rol distintivo */}
      <RoleHeader 
        rol="conductor" 
        titulo="Panel del Conductor"
        subtitulo={`Bienvenido, ${conductor.nombre}`}
      />
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={cargarDatos}
        >
          Actualizar
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Card sx={{ bgcolor: theme.palette.background.paper, boxShadow: 2, minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                <AccountBalanceWallet />
              </Avatar>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                Saldo Disponible
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
              ${parseFloat(conductor.saldo || 0).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: theme.palette.background.paper, boxShadow: 2, minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                Frecuencias Hoy
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {frecuencias.filter(f => f.fecha === obtenerFechaLocal()).length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: theme.palette.background.paper, boxShadow: 2, minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                Total Frecuencias
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {frecuencias.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: theme.palette.background.paper, boxShadow: 2, minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
                <TrendingDown />
              </Avatar>
              <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                Gastado
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              ${frecuencias.reduce((total, frec) => total + parseFloat(frec.Ruta?.precio || 0), 0).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Acciones */}
      <Box mb={3} display="flex" gap={2}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={abrirDialog}
          disabled={busesDisponibles.length === 0 || rutasDisponibles.length === 0}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
              transform: 'translateY(-2px)',
              boxShadow: 4
            },
            '&:disabled': {
              bgcolor: '#9e9e9e',
              color: '#ffffff',
              opacity: 0.8
            }
          }}
        >
          Registrar Nueva Frecuencia
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={<AccountBalanceWallet />}
          onClick={abrirDialogCompraSaldo}
          sx={{
            bgcolor: theme.palette.success.main,
            color: '#fff',
            fontWeight: 600,
            '&:hover': {
              bgcolor: theme.palette.success.dark,
              transform: 'translateY(-2px)',
              boxShadow: 4
            }
          }}
        >
          Solicitar Compra de Saldo
        </Button>
        {busesDisponibles.length === 0 && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#d32f2f', 
              fontWeight: 700,
              fontSize: '0.95rem'
            }} 
            display="block" 
            mt={1}
          >
            No hay buses disponibles
          </Typography>
        )}
        {rutasDisponibles.length === 0 && (
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#d32f2f', 
              fontWeight: 700,
              fontSize: '0.95rem'
            }} 
            display="block" 
            mt={1}
          >
            No hay rutas disponibles
          </Typography>
        )}
      </Box>

      {/* Tabla de Frecuencias */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Mis Frecuencias
              </Typography>
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                type="date"
                label="Filtrar por fecha"
                value={fechaFiltro}
                onChange={(e) => {
                  setFechaFiltro(e.target.value);
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                size="small"
                sx={{ minWidth: 200 }}
              />
              <Button
                variant="outlined"
                onClick={() => setFechaFiltro(obtenerFechaLocal())}
                size="small"
              >
                Hoy
              </Button>
              <Button
                startIcon={<Refresh />}
                onClick={cargarDatos}
                size="small"
                variant="contained"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                    transform: 'translateY(-1px)',
                    boxShadow: 3
                  }
                }}
              >
                Buscar
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {frecuencias.length === 0 ? (
            <Alert severity="info">No tienes frecuencias registradas</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora Salida</TableCell>
                    <TableCell>Ruta</TableCell>
                    <TableCell>Bus</TableCell>
                    <TableCell>Ticket</TableCell>
                    <TableCell>Costo</TableCell>
                    <TableCell>Registrado Por</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {frecuencias.map((frec, index) => {
                    const ruta = frec.Ruta || {};
                    const bus = frec.Bus || {};
                    return (
                      <TableRow key={frec.id} hover>
                        <TableCell>#{index + 1}</TableCell>
                        <TableCell>{frec.fecha.split('-').reverse().join('/')}</TableCell>
                        <TableCell>{convertirHoraAMPM(frec.horaSalida)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Route sx={{ mr: 1, fontSize: 18, color: 'action.active' }} />
                            {ruta.origen} - {ruta.destino}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <DirectionsBus sx={{ mr: 1, fontSize: 18, color: 'action.active' }} />
                            {bus.placa}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {frec.qrCode && (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<QrCode2 />}
                              onClick={() => {
                                setSelectedFrecuencia(frec);
                                setOpenQRDialog(true);
                              }}
                              sx={{
                                bgcolor: frec.estadoVerificacion === 'usado' 
                                  ? theme.palette.success.main
                                  : theme.palette.warning.main,
                                color: '#fff',
                                fontWeight: 600,
                                '&:hover': {
                                  bgcolor: frec.estadoVerificacion === 'usado'
                                    ? theme.palette.success.dark
                                    : theme.palette.warning.dark,
                                  transform: 'translateY(-1px)',
                                  boxShadow: 2
                                }
                              }}
                            >
                              {frec.estadoVerificacion === 'usado' ? 'Verificado' : 'Ver QR'}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600" color="error.main">
                            ${parseFloat(ruta.precio || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={frec.registradoPor === "conductor" ? "Conductor" : "Dueño"}
                            size="small"
                            color={frec.registradoPor === "conductor" ? "info" : "secondary"}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear frecuencia */}
      <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            Registrar Nueva Frecuencia
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Ruta</InputLabel>
                  <Select
                    value={formFrecuencia.rutaId}
                    onChange={(e) => setFormFrecuencia({ ...formFrecuencia, rutaId: e.target.value })}
                    label="Ruta"
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione una ruta</em>
                    </MenuItem>
                    {rutasDisponibles.map((ruta) => (
                      <MenuItem key={ruta.id} value={ruta.id}>
                        {ruta.origen} - {ruta.destino} (${parseFloat(ruta.precio || 0).toFixed(2)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Bus</InputLabel>
                  <Select
                    value={formFrecuencia.busId}
                    onChange={(e) => setFormFrecuencia({ ...formFrecuencia, busId: e.target.value })}
                    label="Bus"
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione un bus</em>
                    </MenuItem>
                    {busesDisponibles.map((bus) => (
                      <MenuItem key={bus.id} value={bus.id}>
                        {bus.placa} - {bus.marca} {bus.modelo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Hora de Salida</InputLabel>
                  <input
                    type="time"
                    value={formFrecuencia.horaSalida}
                    onChange={(e) => setFormFrecuencia({ ...formFrecuencia, horaSalida: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16.5px 14px',
                      fontSize: '1rem',
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      fontFamily: 'inherit'
                    }}
                  />
                </FormControl>
              </Grid>
              {formFrecuencia.rutaId && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Costo de esta frecuencia: ${parseFloat(rutasDisponibles.find(r => r.id === parseInt(formFrecuencia.rutaId))?.precio || 0).toFixed(2)}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={crearFrecuencia}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: theme.palette.primary.dark
              }
            }}
          >
            Registrar Frecuencia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Compra de Saldo */}
      <Dialog open={openCompraSaldoDialog} onClose={() => setOpenCompraSaldoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Solicitar Compra de Saldo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Esta solicitud será enviada a tesorería para su aprobación. El dueño del vehículo será notificado.
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Monto a Solicitar"
                  type="number"
                  value={formCompraSaldo.monto}
                  onChange={(e) => setFormCompraSaldo({ ...formCompraSaldo, monto: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel shrink>Método de Pago</InputLabel>
                  <Select
                    value={formCompraSaldo.metodoPago}
                    onChange={(e) => setFormCompraSaldo({ ...formCompraSaldo, metodoPago: e.target.value, comprobante: null, comprobantePreview: null })}
                    label="Método de Pago"
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione método de pago</em>
                    </MenuItem>
                    <MenuItem value="efectivo">Efectivo</MenuItem>
                    <MenuItem value="deposito">Depósito</MenuItem>
                    <MenuItem value="transferencia">Transferencia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Mostrar selector de comprobante solo para depósito y transferencia */}
              {(formCompraSaldo.metodoPago === 'deposito' || formCompraSaldo.metodoPago === 'transferencia') && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Debe subir una foto del comprobante de pago
                  </Alert>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<AttachMoney />}
                  >
                    {formCompraSaldo.comprobantePreview ? 'Cambiar Comprobante' : 'Subir Comprobante'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleComprobanteChange}
                    />
                  </Button>
                  {formCompraSaldo.comprobantePreview && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <img
                        src={formCompraSaldo.comprobantePreview}
                        alt="Comprobante"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                      />
                    </Box>
                  )}
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción (Opcional)"
                  multiline
                  rows={3}
                  value={formCompraSaldo.descripcion}
                  onChange={(e) => setFormCompraSaldo({ ...formCompraSaldo, descripcion: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompraSaldoDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={solicitarCompraSaldo}>
            Enviar Solicitud
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de QR Code */}
      <QRTicketDialog
        open={openQRDialog}
        onClose={() => setOpenQRDialog(false)}
        frecuencia={selectedFrecuencia}
        onVerificado={(actualizada) => {
          setSelectedFrecuencia(actualizada);
          setFrecuencias(prev => prev.map(f => f.id === actualizada.id ? actualizada : f));
        }}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={cerrarAlerta}
      />
    </Container>
  );
};

export default ConductorPage;

