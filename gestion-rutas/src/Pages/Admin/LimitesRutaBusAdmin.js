import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  TextField,
  Box,
  Card,
  CardContent,
  IconButton,
  TableContainer,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  DirectionsBus,
  Route as RouteIcon,
  Settings,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import axios from 'axios';
import CustomSnackbar from '../../components/CustomSnackbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LimitesRutaBusAdmin = () => {
  const ITEMS_POR_PAGINA = 10;
  const [limites, setLimites] = useState([]);
  const [buses, setBuses] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [formData, setFormData] = useState({
    busId: '',
    rutaId: '',
    limiteDiario: 2
  });

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

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [limitesResp, busesResp, rutasResp] = await Promise.all([
        axios.get(`${API_URL}/api/limites-ruta-bus`, { headers }),
        axios.get(`${API_URL}/api/buses`, { headers }),
        axios.get(`${API_URL}/api/rutas`, { headers })
      ]);

      setLimites(limitesResp.data);
      setBuses(busesResp.data);
      setRutas(rutasResp.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar datos', 'error');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalPaginas = Math.ceil(limites.length / ITEMS_POR_PAGINA);
  const limitesPagina = limites.slice(
    paginaActual * ITEMS_POR_PAGINA,
    (paginaActual + 1) * ITEMS_POR_PAGINA
  );

  const guardarLimite = async () => {
    if (!formData.busId || !formData.rutaId || !formData.limiteDiario) {
      mostrarAlerta('Todos los campos son obligatorios', 'warning');
      return;
    }

    if (formData.limiteDiario < 1 || formData.limiteDiario > 50) {
      mostrarAlerta('El límite debe estar entre 1 y 50', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API_URL}/api/limites-ruta-bus`, formData, { headers });
      
      mostrarAlerta(editId ? 'Límite actualizado correctamente' : 'Límite creado correctamente');
      cargarDatos();
      cerrarDialog();
    } catch (error) {
      console.error('Error al guardar límite:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al guardar límite', 'error');
    }
  };

  const eliminarLimite = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este límite?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/limites-ruta-bus/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarAlerta('Límite eliminado correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      mostrarAlerta('Error al eliminar límite', 'error');
    }
  };

  const abrirDialog = () => {
    setFormData({ busId: '', rutaId: '', limiteDiario: 2 });
    setEditId(null);
    setOpenDialog(true);
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
    setFormData({ busId: '', rutaId: '', limiteDiario: 2 });
    setEditId(null);
  };

  const getBusInfo = (busId) => {
    const bus = buses.find(b => b.id === parseInt(busId));
    return bus ? `${bus.placa} - ${bus.modelo}` : 'N/A';
  };

  const getRutaInfo = (rutaId) => {
    const ruta = rutas.find(r => r.id === parseInt(rutaId));
    return ruta ? `${ruta.origen} → ${ruta.destino}` : 'N/A';
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Límites de Rutas por Bus
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configura cuántas veces cada bus puede hacer una ruta específica por día
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={abrirDialog}
            size="large"
          >
            Nuevo Límite
          </Button>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>¿Cómo funciona?</strong> Define límites específicos por bus y ruta. 
          Ejemplo: Bus ABC-1234 puede hacer "Paján → Guayaquil" máximo 2 veces al día.
        </Alert>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Card elevation={1} sx={{ flex: '1 1 200px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Settings sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {limites.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Límites Configurados
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ flex: '1 1 200px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <DirectionsBus sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {new Set(limites.map(l => l.busId)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Buses con Límites
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ flex: '1 1 200px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <RouteIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {new Set(limites.map(l => l.rutaId)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rutas Restringidas
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Table */}
        <Card elevation={1}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography variant="h6" fontWeight="600">
                Límites Configurados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {limites.length} límite(s) activo(s)
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Bus</TableCell>
                    <TableCell>Ruta</TableCell>
                    <TableCell align="center">Límite Diario</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {limitesPagina.map((limite, index) => (
                    <TableRow key={limite.id} hover>
                      <TableCell>#{paginaActual * ITEMS_POR_PAGINA + index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <DirectionsBus sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" fontWeight="500">
                            {limite.Bus ? limite.Bus.placa : getBusInfo(limite.busId)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <RouteIcon sx={{ mr: 1, color: 'warning.main' }} />
                          <Typography variant="body2">
                            {limite.Ruta ? `${limite.Ruta.origen} → ${limite.Ruta.destino}` : getRutaInfo(limite.rutaId)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${limite.limiteDiario} viaje(s)/día`}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Eliminar">
                          <IconButton 
                            size="small" 
                            onClick={() => eliminarLimite(limite.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {limites.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay límites configurados. Haz clic en "Nuevo Límite" para empezar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <Box display="flex" alignItems="center" justifyContent="center" gap={2} py={2}>
                <IconButton onClick={() => setPaginaActual(p => p - 1)} disabled={paginaActual === 0} size="small" sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}>
                  <NavigateBefore />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Página {paginaActual + 1} de {totalPaginas} &nbsp;·&nbsp; {limites.length} límites
                </Typography>
                <IconButton onClick={() => setPaginaActual(p => p + 1)} disabled={paginaActual >= totalPaginas - 1} size="small" sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}>
                  <NavigateNext />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              Configurar Límite de Ruta
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Bus</InputLabel>
                <Select
                  value={formData.busId}
                  onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                  label="Bus"
                >
                  <MenuItem value="">Seleccione un bus</MenuItem>
                  {buses.filter(b => b.estado === 'activo').map((bus) => (
                    <MenuItem key={bus.id} value={bus.id}>
                      {bus.placa} - {bus.modelo} ({bus.empresa})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Ruta</InputLabel>
                <Select
                  value={formData.rutaId}
                  onChange={(e) => setFormData({ ...formData, rutaId: e.target.value })}
                  label="Ruta"
                >
                  <MenuItem value="">Seleccione una ruta</MenuItem>
                  {rutas.map((ruta) => (
                    <MenuItem key={ruta.id} value={ruta.id}>
                      {ruta.origen} → {ruta.destino} (${ruta.precio})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                required
                type="number"
                label="Límite Diario"
                value={formData.limiteDiario}
                onChange={(e) => setFormData({ ...formData, limiteDiario: parseInt(e.target.value) || '' })}
                inputProps={{ min: 1, max: 50 }}
                helperText="Número máximo de veces que este bus puede hacer esta ruta por día"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={cerrarDialog} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={guardarLimite} variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        <CustomSnackbar
          open={snackbar.open}
          handleClose={cerrarAlerta}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      </Container>
    </Box>
  );
};

export default LimitesRutaBusAdmin;
