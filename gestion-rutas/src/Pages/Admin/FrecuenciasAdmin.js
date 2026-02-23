import React, { useEffect, useState } from 'react';
import {
  Container, Typography, TextField, Button, Box, Table, TableHead,
  TableBody, TableRow, TableCell, Grid, Card, CardContent,
  IconButton, Chip, TableContainer, Divider, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  MenuItem, Select, FormControl, InputLabel, Stack
} from '@mui/material';
import {
  Schedule,
  DirectionsBus,
  Route,
  Edit,
  Delete,
  Add,
  Search,
  Download,
  Upload,
  Refresh,
  AccessTime,
  Visibility
} from '@mui/icons-material';
import axios from 'axios';
import CustomSnackbar from '../../components/CustomSnackbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { agregarLogosPDF } from '../../utils/pdfUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

const FrecuenciasAdmin = () => {
  const [frecuencias, setFrecuencias] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [buses, setBuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(obtenerFechaLocal());
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [frecuenciaDetalle, setFrecuenciaDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    id: null,
    fecha: obtenerFechaLocal(),
    horaSalida: '',
    rutaId: '',
    busId: ''
  });
  const [editando, setEditando] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const mostrarAlerta = (mensaje, severidad = 'success') => {
    setSnackbar({ open: true, message: mensaje, severity: severidad });
  };

  const cerrarAlerta = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [frecResp, rutasResp, busesResp] = await Promise.all([
        axios.get(`${API_URL}/api/frecuencias`, { headers }),
        axios.get(`${API_URL}/api/rutas`, { headers }),
        axios.get(`${API_URL}/api/buses`, { headers })
      ]);

      setFrecuencias(frecResp.data);
      setRutas(rutasResp.data);
      setBuses(busesResp.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const guardarFrecuencia = async () => {
    if (!form.fecha || !form.horaSalida || !form.rutaId || !form.busId) {
      mostrarAlerta('Completa todos los campos', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editando) {
        await axios.put(`${API_URL}/api/frecuencias/${form.id}`, form, { headers });
        mostrarAlerta('Frecuencia actualizada correctamente');
      } else {
        await axios.post(`${API_URL}/api/frecuencias`, form, { headers });
        mostrarAlerta('Frecuencia registrada correctamente');
      }

      cargarDatos();
      cerrarDialog();
    } catch (error) {
      console.error('Error al guardar frecuencia:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al guardar frecuencia', 'error');
    }
  };

  const editarFrecuencia = (frecuencia) => {
    setForm({
      id: frecuencia.id,
      fecha: frecuencia.fecha,
      horaSalida: frecuencia.horaSalida,
      rutaId: frecuencia.rutaId,
      busId: frecuencia.busId
    });
    setEditando(true);
    setOpenDialog(true);
  };

  const verDetalleFrecuencia = (frecuencia) => {
    setFrecuenciaDetalle(frecuencia);
    setOpenDetalleDialog(true);
  };

  const eliminarFrecuencia = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta frecuencia?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/frecuencias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarAlerta('Frecuencia eliminada correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar frecuencia:', error);
      mostrarAlerta('Error al eliminar frecuencia', 'error');
    }
  };

  const abrirDialog = () => {
    setForm({
      id: null,
      fecha: obtenerFechaLocal(),
      horaSalida: '',
      rutaId: '',
      busId: ''
    });
    setEditando(false);
    setOpenDialog(true);
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
    setEditando(false);
  };

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Agregar logos
    await agregarLogosPDF(doc, pageWidth);
    
    // Título centrado
    const titulo = "Listado de Frecuencias";
    const tituloWidth = doc.getTextWidth(titulo);
    const tituloX = (pageWidth - tituloWidth) / 2;
    doc.text(titulo, tituloX, 30);
    
    autoTable(doc, {
      startY: 38,
      head: [["#", "Fecha", "Hora", "Ruta", "Bus", "Registrado Por"]],
      body: frecuencias.map((f, index) => [
        index + 1,
        f.fecha,
        convertirHoraAMPM(f.horaSalida),
        f.Ruta ? `${f.Ruta.origen} - ${f.Ruta.destino}` : 'N/A',
        f.Bus ? f.Bus.placa : 'N/A',
        f.registradoPor === 'conductor' ? 'Conductor' : 'Due\u00f1o'
      ])
    });
    doc.save("frecuencias.pdf");
  };

  const exportarExcel = () => {
    const data = frecuencias.map((f) => ({
      ID: f.id,
      Fecha: f.fecha,
      Hora: convertirHoraAMPM(f.horaSalida),
      Ruta: f.Ruta ? `${f.Ruta.origen} - ${f.Ruta.destino}` : 'N/A',
      Bus: f.Bus ? f.Bus.placa : 'N/A',
      'Registrado Por': f.registradoPor === 'conductor' ? 'Conductor' : 'Due\u00f1o'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Frecuencias");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "frecuencias.xlsx");
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filteredFrecuencias = frecuencias.filter(f => {
    const ruta = f.Ruta ? `${f.Ruta.origen} ${f.Ruta.destino}` : '';
    const bus = f.Bus ? f.Bus.placa : '';
    const matchSearch = ruta.toLowerCase().includes(searchTerm.toLowerCase()) ||
           bus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFecha = f.fecha === filtroFecha;
    return matchSearch && matchFecha;
  });

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Gestión de Frecuencias
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Administra las frecuencias de viaje
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={cargarDatos} 
                disabled={loading}
                sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Download />} onClick={exportarPDF} sx={{ mr: 1 }}>
              PDF
            </Button>
            <Button variant="outlined" startIcon={<Upload />} onClick={exportarExcel} color="success">
              Excel
            </Button>
          </Box>
        </Box>

        {/* Search and Add */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Buscar por ruta o bus..."
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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Filtrar por Fecha"
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ backgroundColor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={abrirDialog}
              size="large"
              sx={{ height: '56px' }}
            >
              Nueva Frecuencia
            </Button>
          </Grid>
        </Grid>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card elevation={1}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ backgroundColor: 'primary.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2 }}>
                  <Schedule />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {filteredFrecuencias.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Frecuencias del {filtroFecha.split('-').reverse().join('/')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <Card elevation={1}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography variant="h6" fontWeight="600">
                Lista de Frecuencias
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredFrecuencias.length} frecuencias encontradas
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Hora Salida</TableCell>
                    <TableCell>Ruta</TableCell>
                    <TableCell>Bus</TableCell>
                    <TableCell align="center">Registrado Por</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFrecuencias.map((frec, index) => (
                    <TableRow key={frec.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          #{index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {frec.fecha}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccessTime sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight="500">
                            {convertirHoraAMPM(frec.horaSalida)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Route sx={{ mr: 1, color: 'success.main' }} />
                          <Typography variant="body2">
                            {frec.Ruta ? `${frec.Ruta.origen} → ${frec.Ruta.destino}` : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <DirectionsBus sx={{ mr: 1, color: 'info.main' }} />
                          <Typography variant="body2">
                            {frec.Bus ? frec.Bus.placa : 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={frec.registradoPor === "conductor" ? "Conductor" : "Dueño"}
                          size="small"
                          color={frec.registradoPor === "conductor" ? "info" : "secondary"}
                        />
                      </TableCell>
                      <TableCell align="center">

                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Ver Detalles">
                            <IconButton 
                              size="small" 
                              onClick={() => verDetalleFrecuencia(frec)}
                              sx={{ color: 'info.main' }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => editarFrecuencia(frec)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => eliminarFrecuencia(frec.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFrecuencias.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron frecuencias
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Dialog for Add/Edit */}
        <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editando ? 'Editar Frecuencia' : 'Nueva Frecuencia'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Hora de Salida"
                type="time"
                value={form.horaSalida}
                onChange={(e) => setForm({ ...form, horaSalida: e.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  style: { fontSize: '1rem' }
                }}
              />
              <FormControl fullWidth>
                <InputLabel shrink>Ruta</InputLabel>
                <Select
                  value={form.rutaId}
                  onChange={(e) => setForm({ ...form, rutaId: e.target.value })}
                  label="Ruta"
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione una ruta</em>
                  </MenuItem>
                  {rutas.map((ruta) => (
                    <MenuItem key={ruta.id} value={ruta.id}>
                      {ruta.origen} → {ruta.destino}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel shrink>Bus</InputLabel>
                <Select
                  value={form.busId}
                  onChange={(e) => setForm({ ...form, busId: e.target.value })}
                  label="Bus"
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione un bus</em>
                  </MenuItem>
                  {buses.map((bus) => (
                    <MenuItem key={bus.id} value={bus.id}>
                      {bus.placa} - {bus.modelo || 'N/A'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={cerrarDialog} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={guardarFrecuencia} variant="contained">
              {editando ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Detalles */}
        <Dialog open={openDetalleDialog} onClose={() => setOpenDetalleDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              Detalles de Frecuencia #{frecuenciaDetalle?.id}
            </Typography>
          </DialogTitle>
          <DialogContent>
            {frecuenciaDetalle && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      📅 Fecha
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {frecuenciaDetalle.fecha.split('-').reverse().join('/')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      ⏰ Hora de Salida
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {convertirHoraAMPM(frecuenciaDetalle.horaSalida)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      🛣️ Ruta
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {frecuenciaDetalle.Ruta ? `${frecuenciaDetalle.Ruta.origen} → ${frecuenciaDetalle.Ruta.destino}` : 'N/A'}
                    </Typography>
                    {frecuenciaDetalle.Ruta && (
                      <Typography variant="caption" color="text.secondary">
                        Precio: ${parseFloat(frecuenciaDetalle.Ruta.precio || 0).toFixed(2)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      🚌 Bus
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {frecuenciaDetalle.Bus ? frecuenciaDetalle.Bus.placa : 'N/A'}
                    </Typography>
                    {frecuenciaDetalle.Bus && (
                      <Typography variant="caption" color="text.secondary">
                        Modelo: {frecuenciaDetalle.Bus.modelo || 'N/A'}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      📋 Registrado Por
                    </Typography>
                    <Chip
                      label={frecuenciaDetalle.registradoPor === "conductor" ? "Conductor" : "Dueño"}
                      size="small"
                      color={frecuenciaDetalle.registradoPor === "conductor" ? "info" : "secondary"}
                      sx={{ mb: 1 }}
                    />
                    {frecuenciaDetalle.Conductor && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                          Conductor:
                        </Typography>
                        <Typography variant="body2">
                          <strong>Nombre:</strong> {frecuenciaDetalle.Conductor.nombre}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cédula:</strong> {frecuenciaDetalle.Conductor.cedula}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Teléfono:</strong> {frecuenciaDetalle.Conductor.telefono || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {frecuenciaDetalle.Conductor.email || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                    {frecuenciaDetalle.Cliente && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                          Dueño:
                        </Typography>
                        <Typography variant="body2">
                          <strong>Nombre:</strong> {frecuenciaDetalle.Cliente.nombres} {frecuenciaDetalle.Cliente.apellidos}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cédula:</strong> {frecuenciaDetalle.Cliente.cedula}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Teléfono:</strong> {frecuenciaDetalle.Cliente.telefono || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Email:</strong> {frecuenciaDetalle.Cliente.email || 'N/A'}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  {frecuenciaDetalle.ticketId && (
                    <>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          🎫 Información del Ticket
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                          ID: {frecuenciaDetalle.ticketId}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={frecuenciaDetalle.estadoVerificacion?.toUpperCase() || 'PENDIENTE'}
                            size="small"
                            color={frecuenciaDetalle.estadoVerificacion === 'usado' ? 'success' : 'warning'}
                          />
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetalleDialog(false)} variant="contained">
              Cerrar
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

export default FrecuenciasAdmin;
