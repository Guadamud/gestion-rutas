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
} from '@mui/material';
import {
  Route,
  MyLocation,
  LocationOn,
  Edit,
  Delete,
  Add,
  Search,
  Download,
  Upload,
  Refresh,
  AccessTime,
  AttachMoney,
  Straighten,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import axios from 'axios';
import CustomSnackbar from '../../components/CustomSnackbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { agregarLogosPDF } from '../../utils/pdfUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RutasAdmin = () => {
  const ITEMS_POR_PAGINA = 10;
  const [rutas, setRutas] = useState([]);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [duracionAproximada, setDuracionAproximada] = useState('');
  const [precio, setPrecio] = useState('');
  const [distancia, setDistancia] = useState('');
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

  const cargarRutas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rutas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRutas(response.data);
    } catch (error) {
      console.error('Error al cargar rutas:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al cargar rutas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const guardarRuta = async () => {
    if (!origen.trim() || !destino.trim()) {
      mostrarAlerta('Completa todos los campos', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const rutaData = {
        origen,
        destino,
        duracionAproximada: duracionAproximada || 60,
        precio: parseFloat(precio) || 0,
        distancia: parseInt(distancia) || 0
      };

      if (editId) {
        await axios.put(`${API_URL}/api/rutas/${editId}`, rutaData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mostrarAlerta('Ruta actualizada correctamente');
      } else {
        await axios.post(`${API_URL}/api/rutas`, rutaData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        mostrarAlerta('Ruta registrada correctamente');
      }

      cargarRutas();
      limpiarFormulario();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error al guardar ruta:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al guardar ruta', 'error');
    }
  };

  const editarRuta = (ruta) => {
    setOrigen(ruta.origen);
    setDestino(ruta.destino);
    setDuracionAproximada(ruta.duracionAproximada || '');
    setPrecio(ruta.precio || '');
    setDistancia(ruta.distancia || '');
    setEditId(ruta.id);
    setOpenDialog(true);
  };

  const eliminarRuta = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta ruta?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/rutas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarAlerta('Ruta eliminada correctamente');
      cargarRutas();
    } catch (error) {
      console.error('Error al eliminar ruta:', error);
      mostrarAlerta('Error al eliminar ruta', 'error');
    }
  };

  const limpiarFormulario = () => {
    setOrigen('');
    setDestino('');
    setDuracionAproximada('');
    setPrecio('');
    setDistancia('');
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

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Agregar logos
    await agregarLogosPDF(doc, pageWidth);
    
    // Título centrado
    const titulo = "Listado de Rutas";
    const tituloWidth = doc.getTextWidth(titulo);
    const tituloX = (pageWidth - tituloWidth) / 2;
    doc.text(titulo, tituloX, 30);
    
    autoTable(doc, {
      startY: 38,
      head: [["#", "Origen", "Destino", "Duración (min)", "Precio ($)", "Distancia (km)"]],
      body: rutas.map((ruta, index) => [
        index + 1,
        ruta.origen,
        ruta.destino,
        ruta.duracionAproximada || 'N/A',
        ruta.precio ? `$${parseFloat(ruta.precio).toFixed(2)}` : '$0.00',
        ruta.distancia || '0'
      ])
    });
    doc.save("rutas.pdf");
  };

  const exportarExcel = () => {
    const data = rutas.map((ruta) => ({
      ID: ruta.id,
      Origen: ruta.origen,
      Destino: ruta.destino,
      'Duración (min)': ruta.duracionAproximada || 'N/A',
      'Precio ($)': ruta.precio ? parseFloat(ruta.precio).toFixed(2) : '0.00',
      'Distancia (km)': ruta.distancia || '0'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rutas");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "rutas.xlsx");
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  const filteredRutas = rutas.filter(ruta =>
    ruta.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ruta.destino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => { setPaginaActual(0); }, [searchTerm]);
  const totalPaginas = Math.ceil(filteredRutas.length / ITEMS_POR_PAGINA);
  const rutasPagina = filteredRutas.slice(
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
              Gestión de Rutas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Administra las rutas del sistema de transporte
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={cargarRutas} 
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
              placeholder="Buscar por origen o destino..."
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
              Nueva Ruta
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
                <Route />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {rutas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Rutas
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
                <MyLocation />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {new Set(rutas.map(r => r.origen)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Orígenes
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
                <LocationOn />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {new Set(rutas.map(r => r.destino)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Destinos
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
                Lista de Rutas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredRutas.length} rutas encontradas
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Destino</TableCell>
                    <TableCell align="center">Duración (min)</TableCell>
                    <TableCell align="center">Precio</TableCell>
                    <TableCell align="center">Distancia (km)</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rutasPagina.map((ruta, index) => (
                    <TableRow key={ruta.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          #{paginaActual * ITEMS_POR_PAGINA + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <MyLocation sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2" fontWeight="500">
                            {ruta.origen}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LocationOn sx={{ mr: 1, color: 'error.main' }} />
                          <Typography variant="body2" fontWeight="500">
                            {ruta.destino}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<AccessTime />}
                          label={`${ruta.duracionAproximada || 'N/A'} min`}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<AttachMoney />}
                          label={`$${ruta.precio ? parseFloat(ruta.precio).toFixed(2) : '0.00'}`}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<Straighten />}
                          label={`${ruta.distancia || '0'} km`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => editarRuta(ruta)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => eliminarRuta(ruta.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRutas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron rutas
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
                  Página {paginaActual + 1} de {totalPaginas} &nbsp;·&nbsp; {filteredRutas.length} rutas
                </Typography>
                <IconButton onClick={() => setPaginaActual(p => p + 1)} disabled={paginaActual >= totalPaginas - 1} size="small" sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}>
                  <NavigateNext />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Dialog for Add/Edit */}
        <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editId ? 'Editar Ruta' : 'Nueva Ruta'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Origen"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                    placeholder="Terminal de Paján"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MyLocation />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Terminal de Guayaquil"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Duración Aproximada (minutos)"
                    type="number"
                    value={duracionAproximada}
                    onChange={(e) => setDuracionAproximada(e.target.value)}
                    placeholder="60"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTime />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Precio ($)"
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="2.50"
                    inputProps={{ step: "0.01", min: "0" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Distancia (km)"
                    type="number"
                    value={distancia}
                    onChange={(e) => setDistancia(e.target.value)}
                    placeholder="80"
                    inputProps={{ min: "0" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Straighten />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={cerrarDialog} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={guardarRuta} variant="contained">
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

export default RutasAdmin;
