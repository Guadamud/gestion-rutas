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
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  TableContainer,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import {
  DirectionsBus,
  Business,
  People,
  Edit,
  PowerSettingsNew,
  Add,
  Search,
  Download,
  Upload,
  Refresh,
  Delete,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import axios from 'axios';
import CustomSnackbar from '../../components/CustomSnackbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { agregarLogosPDF } from '../../utils/pdfUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BusesAdmin = () => {
  const ITEMS_POR_PAGINA = 10;
  const [buses, setBuses] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cooperativas, setCooperativas] = useState([]);
  const [placa, setPlaca] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [modelo, setModelo] = useState('');
  const [numero, setNumero] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [cooperativaSeleccionada, setCooperativaSeleccionada] = useState(null);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(0);

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

  const cargarBuses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [busesResp, clientesResp, cooperativasResp] = await Promise.all([
        axios.get(`${API_URL}/api/buses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/clientes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/cooperativas`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setBuses(busesResp.data);
      setClientes(clientesResp.data);
      setCooperativas(cooperativasResp.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const guardarBus = async () => {
    if (!placa.trim() || placa.length < 5) {
      mostrarAlerta('La placa debe tener al menos 5 caracteres', 'warning');
      return;
    }

    if (!empresa.trim()) {
      mostrarAlerta('La empresa es obligatoria', 'warning');
      return;
    }

    if (!capacidad || isNaN(capacidad) || capacidad <= 0) {
      mostrarAlerta('Capacidad debe ser un némero mayor que 0', 'warning');
      return;
    }

    if (!clienteId) {
      mostrarAlerta('Debe seleccionar un cliente', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const busData = {
        placa: placa.toUpperCase(),
        modelo: modelo || 'N/A',
        empresa: empresa,
        capacidad: parseInt(capacidad),
        numero: numero ? parseInt(numero) : Math.floor(Math.random() * 10000),
        usuarioId: parseInt(clienteId)
      };

      if (editId) {
        await axios.put(`${API_URL}/api/buses/${editId}`, busData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mostrarAlerta('Bus actualizado correctamente');
      } else {
        await axios.post(`${API_URL}/api/buses`, busData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mostrarAlerta('Bus registrado correctamente');
      }

      cargarBuses();
      setPlaca('');
      setEmpresa('');
      setCapacidad('');
      setModelo('');
      setNumero('');
      setClienteId('');
      setClienteSeleccionado(null);
      setCooperativaSeleccionada(null);
      setEditId(null);
      setOpenDialog(false);
      console.error('Error al guardar bus:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al guardar bus', 'error');
    }
  };

  const editarBus = (bus) => {
    setPlaca(bus.placa);
    setEmpresa(bus.empresa || '');
    setCapacidad(bus.capacidad.toString());
    setModelo(bus.modelo || '');
    setNumero(bus.numero || '');
    setClienteId(bus.usuarioId || '');
    setClienteSeleccionado(clientes.find(c => c.id === bus.usuarioId) || null);
    setCooperativaSeleccionada(cooperativas.find(c => c.nombre === (bus.empresa || '')) || null);
    setEditId(bus.id);
    setOpenDialog(true);
  };

  const limpiarFormulario = () => {
    setPlaca('');
    setEmpresa('');
    setCapacidad('');
    setModelo('');
    setNumero('');
    setClienteId('');
    setClienteSeleccionado(null);
    setCooperativaSeleccionada(null);
    setEditId(null);
  };

  const abrirDialog = () => {
    limpiarFormulario();
    setOpenDialog(true);
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
    limpiarFormulario();
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/buses/${id}/estado`, 
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarAlerta(`Estado actualizado a ${nuevoEstado}`);
      // Actualizar el estado localmente sin recargar
      setBuses(buses.map(bus => 
        bus.id === id ? { ...bus, estado: nuevoEstado, desactivadoPor: nuevoEstado === 'inactivo' ? 'admin' : null } : bus
      ));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      
      // Manejar error específico de bus desactivado por admin
      if (error.response?.data?.codigoError === 'BUS_DESACTIVADO_ADMIN') {
        mostrarAlerta(error.response.data.message, 'error');
      } else {
        mostrarAlerta(error.response?.data?.message || 'Error al cambiar estado', 'error');
      }
    }
  };

  const eliminarBus = async (id) => {
    if (!window.confirm('éEstés seguro de eliminar este bus? Esta accién no se puede deshacer.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/buses/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarAlerta('Bus eliminado correctamente', 'success');
      cargarBuses();
    } catch (error) {
      console.error('Error al eliminar bus:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al eliminar bus', 'error');
    }
  };

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Agregar logos
    await agregarLogosPDF(doc, pageWidth);
    
    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titulo = "LISTADO DE BUSES";
    const titleWidth = doc.getTextWidth(titulo);
    doc.text(titulo, (pageWidth - titleWidth) / 2, 30);
    
    autoTable(doc, {
      startY: 38,
      head: [["ID", "Placa", "Capacidad", "Empresa", "Estado"]],
      body: buses.map((bus) => [
        bus.id,
        bus.placa,
        bus.capacidad,
        bus.empresa,
        bus.estado
      ])
    });
    doc.save("buses.pdf");
  };

  const exportarExcel = () => {
    const data = buses.map((bus) => ({
      ID: bus.id,
      Placa: bus.placa,
      Capacidad: bus.capacidad,
      Empresa: bus.empresa,
      Estado: bus.estado
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Buses");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "buses.xlsx");
  };

  useEffect(() => {
    cargarBuses();
  }, []);

  const filteredBuses = buses.filter(bus =>
    bus.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.empresa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => { setPaginaActual(0); }, [searchTerm]);
  const totalPaginas = Math.ceil(filteredBuses.length / ITEMS_POR_PAGINA);
  const busesPagina = filteredBuses.slice(
    paginaActual * ITEMS_POR_PAGINA,
    (paginaActual + 1) * ITEMS_POR_PAGINA
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Gestión de Buses
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Administra la flota de buses del sistema
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={cargarBuses} 
                disabled={loading}
                sx={{ 
                  backgroundColor: 'grey.100',
                  '&:hover': { backgroundColor: 'grey.200' }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportarPDF}
              sx={{ mr: 1 }}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={exportarExcel}
              color="success"
            >
              Excel
            </Button>
          </Box>
        </Box>

        {/* Search and Add */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar por placa o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ backgroundColor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={abrirDialog}
              size="large"
              sx={{ height: '56px' }}
            >
              Nuevo Bus
            </Button>
          </Grid>
        </Grid>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 1,
                  display: 'inline-flex',
                  mb: 2,
                  alignSelf: 'center'
                }}
              >
                <DirectionsBus />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {buses.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Buses
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box
                sx={{
                  backgroundColor: 'success.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 1,
                  display: 'inline-flex',
                  mb: 2,
                  alignSelf: 'center'
                }}
              >
                <PowerSettingsNew />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {buses.filter(b => b.estado === 'activo').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Buses Activos
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box
                sx={{
                  backgroundColor: 'warning.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 1,
                  display: 'inline-flex',
                  mb: 2,
                  alignSelf: 'center'
                }}
              >
                <Business />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {new Set(buses.map(b => b.empresa)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empresas
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box
                sx={{
                  backgroundColor: 'info.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 1,
                  display: 'inline-flex',
                  mb: 2,
                  alignSelf: 'center'
                }}
              >
                <People />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {buses.reduce((sum, bus) => sum + bus.capacidad, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacidad Total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Table */}
        <Card elevation={1}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography variant="h6" fontWeight="600">
                Lista de Buses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredBuses.length} buses encontrados
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Placa</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell align="center">Capacidad</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {busesPagina.map((bus, index) => (
                    <TableRow key={bus.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          #{paginaActual * ITEMS_POR_PAGINA + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <DirectionsBus sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" fontWeight="500">
                            {bus.placa}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {bus.empresa}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${bus.capacidad} personas`}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={bus.estado}
                          size="small"
                          color={bus.estado === 'activo' ? 'success' : 'warning'}
                          variant={bus.estado === 'activo' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => editarBus(bus)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={bus.estado === 'activo' ? 'Desactivar' : 'Activar'}>
                            <IconButton
                              size="small"
                              onClick={() => cambiarEstado(bus.id, bus.estado === 'activo' ? 'inactivo' : 'activo')}
                              sx={{ 
                                color: bus.estado === 'activo' ? 'warning.main' : 'success.main'
                              }}
                            >
                              <PowerSettingsNew />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => eliminarBus(bus.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBuses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron buses
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
                  Página {paginaActual + 1} de {totalPaginas} &nbsp;·&nbsp; {filteredBuses.length} buses
                </Typography>
                <IconButton onClick={() => setPaginaActual(p => p + 1)} disabled={paginaActual >= totalPaginas - 1} size="small" sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}>
                  <NavigateNext />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog for Add/Edit */}
        <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editId ? 'Editar Bus' : 'Nuevo Bus'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Némero de Bus"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DirectionsBus />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DirectionsBus />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ej: Mercedes Benz OF-1721"
                InputLabelProps={{ shrink: true }}
              />
              <Autocomplete
                options={clientes}
                value={clienteSeleccionado}
                onChange={(_, value) => {
                  setClienteSeleccionado(value);
                  setClienteId(value ? value.id : '');
                }}
                getOptionLabel={(option) => `${option.nombres} ${option.apellidos}`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {option.nombres} {option.apellidos}
                      </Typography>
                      {option.email && (
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cliente *"
                    placeholder="Buscar cliente..."
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                noOptionsText="Sin resultados"
              />
              <Autocomplete
                options={cooperativas.filter(c => c.estado === 'activo')}
                value={cooperativaSeleccionada}
                onChange={(_, value) => {
                  setCooperativaSeleccionada(value);
                  setEmpresa(value ? value.nombre : '');
                }}
                getOptionLabel={(option) => option.nombre}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Typography variant="body2">{option.nombre}</Typography>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Cooperativa"
                    placeholder="Buscar cooperativa..."
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                noOptionsText="Sin resultados"
              />
              <TextField
                fullWidth
                label="Capacidad"
                type="number"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <People />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={cerrarDialog} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={guardarBus} variant="contained">
              {editId ? 'Actualizar' : 'Registrar'}
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

export default BusesAdmin;

