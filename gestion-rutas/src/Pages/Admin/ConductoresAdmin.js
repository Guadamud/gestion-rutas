import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  Button,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  TableContainer,
  Divider,
  InputAdornment,
  TextField,
  Grid,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import {
  Person,
  DirectionsBus,
  Add,
  Edit,
  Delete,
  Search,
  Download,
  Upload,
  Refresh,
  Email,
  Phone,
  Badge as BadgeIcon,
  DriveEta,
  CheckCircle,
  Cancel,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import CustomSnackbar from '../../components/CustomSnackbar';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { agregarLogosPDF } from '../../utils/pdfUtils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { professionalColors } from '../../utils/professionalColors';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ConductoresAdmin = () => {
  const ITEMS_POR_PAGINA = 10;
  const [conductores, setConductores] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    password: '',
    tipoLicencia: '',
    vencimientoLicencia: '',
    clienteId: '',
    saldo: 0
  });

  const [errors, setErrors] = useState({});

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
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [conductoresResp, clientesResp] = await Promise.all([
        axios.get(`${API_URL}/api/conductores`, { headers }),
        axios.get(`${API_URL}/api/clientes`, { headers })
      ]);

      // Aplanar conductores de todos los clientes
      const todosConductores = conductoresResp.data.flatMap(cliente => 
        (cliente.Conductors || []).map(c => ({
          ...c,
          clienteNombre: `${cliente.nombres} ${cliente.apellidos}`
        }))
      );

      setConductores(todosConductores);
      setClientes(clientesResp.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar nombre
    if (!formData.nombre || !formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Zéééééééééééé\s]+$/.test(formData.nombre)) {
      nuevosErrores.nombre = 'El nombre solo debe contener letras';
    }

    // Validar cédula
    if (!formData.cedula || !formData.cedula.trim()) {
      nuevosErrores.cedula = 'La cédula es obligatoria';
    } else if (!/^\d{10}$/.test(formData.cedula)) {
      nuevosErrores.cedula = 'La cédula debe tener 10 dégitos';
    } else {
      // Verificar duplicados (excepto si estamos editando el mismo)
      const cedulaDuplicada = conductores.find(c => 
        c.cedula === formData.cedula && c.id !== editingConductor?.id
      );
      if (cedulaDuplicada) {
        nuevosErrores.cedula = 'Ya existe un conductor con esta cédula';
      }
    }

    // Validar teléfono
    if (!formData.telefono || !formData.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio';
    } else if (!/^\d{10}$/.test(formData.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener 10 dégitos';
    }

    // Validar email
    if (!formData.email || !formData.email.trim()) {
      nuevosErrores.email = 'El correo electrénico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = 'El correo electrénico no es vélido';
    }

    // Validar password (solo al crear)
    if (!editingConductor) {
      if (!formData.password || !formData.password.trim()) {
        nuevosErrores.password = 'La contraseéa es obligatoria';
      } else if (formData.password.length < 6) {
        nuevosErrores.password = 'La contraseéa debe tener al menos 6 caracteres';
      }
    }

    // Validar cliente
    if (!formData.clienteId) {
      nuevosErrores.clienteId = 'Debe seleccionar un cliente';
    }

    // Validar tipo de licencia
    if (!formData.tipoLicencia || !formData.tipoLicencia.trim()) {
      nuevosErrores.tipoLicencia = 'El tipo de licencia es obligatorio';
    }

    // Validar vencimiento de licencia
    if (!formData.vencimientoLicencia) {
      nuevosErrores.vencimientoLicencia = 'La fecha de vencimiento es obligatoria';
    } else {
      const fechaVencimiento = new Date(formData.vencimientoLicencia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaVencimiento < hoy) {
        nuevosErrores.vencimientoLicencia = 'La licencia no puede estar vencida';
      }
    }

    // Validar saldo
    if (formData.saldo < 0) {
      nuevosErrores.saldo = 'El saldo no puede ser negativo';
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarConductor = async () => {
    if (!validarFormulario()) {
      mostrarAlerta('Por favor corrige los errores en el formulario', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingConductor) {
        await axios.put(`${API_URL}/api/conductores/${editingConductor.id}`, formData, { headers });
        mostrarAlerta('Conductor actualizado correctamente');
      } else {
        await axios.post(`${API_URL}/api/conductores`, formData, { headers });
        mostrarAlerta('Conductor registrado correctamente');
      }

      cargarDatos();
      cerrarDialog();
    } catch (error) {
      console.error('Error al guardar conductor:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al guardar conductor', 'error');
    }
  };

  const editarConductor = (conductor) => {
    setFormData({
      nombre: conductor.nombre,
      cedula: conductor.cedula,
      telefono: conductor.telefono || '',
      email: conductor.email || '',
      password: '',
      tipoLicencia: conductor.tipoLicencia || '',
      vencimientoLicencia: conductor.vencimientoLicencia || '',
      clienteId: conductor.clienteId,
      saldo: conductor.saldo || 0
    });
    setClienteSeleccionado(clientes.find(c => c.id === conductor.clienteId) || null);
    setEditingConductor(conductor);
    setOpenDialog(true);
  };

  const eliminarConductor = async (id) => {
    if (!window.confirm('éEstés seguro de eliminar este conductor?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/conductores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarAlerta('Conductor eliminado correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar conductor:', error);
      mostrarAlerta('Error al eliminar conductor', 'error');
    }
  };

  const abrirDialog = () => {
    setFormData({
      nombre: '',
      cedula: '',
      telefono: '',
      email: '',
      password: '',
      tipoLicencia: '',
      vencimientoLicencia: '',
      clienteId: '',
      saldo: 0
    });
    setErrors({});
    setClienteSeleccionado(null);
    setEditingConductor(null);
    setOpenDialog(true);
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
    setEditingConductor(null);
    setClienteSeleccionado(null);
    setErrors({});
  };

  const exportarPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Agregar logos
    await agregarLogosPDF(doc, pageWidth);
    
    // Título centrado
    const titulo = "Listado de Conductores";
    const tituloWidth = doc.getTextWidth(titulo);
    const tituloX = (pageWidth - tituloWidth) / 2;
    doc.text(titulo, tituloX, 30);
    
    autoTable(doc, {
      startY: 38,
      head: [["#", "Nombre", "Cédula", "Teléfono", "Cliente", "Saldo"]],
      body: conductores.map((c, index) => [
        index + 1,
        c.nombre,
        c.cedula,
        c.telefono || 'N/A',
        c.clienteNombre || 'N/A',
        `$${Number(c.saldo || 0).toFixed(2)}`
      ])
    });
    doc.save("conductores.pdf");
  };

  const exportarExcel = () => {
    const data = conductores.map(c => ({
      ID: c.id,
      Nombre: c.nombre,
      Cédula: c.cedula,
      Teléfono: c.telefono || 'N/A',
      Cliente: c.clienteNombre || 'N/A',
      'Tipo Licencia': c.tipoLicencia || 'N/A',
      'Vencimiento Licencia': c.vencimientoLicencia || 'N/A',
      Saldo: c.saldo || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Conductores");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "conductores.xlsx");
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filteredConductores = conductores.filter(c =>
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cedula?.includes(searchTerm) ||
    c.telefono?.includes(searchTerm) ||
    c.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => { setPaginaActual(0); }, [searchTerm]);
  const totalPaginas = Math.ceil(filteredConductores.length / ITEMS_POR_PAGINA);
  const conductoresPagina = filteredConductores.slice(
    paginaActual * ITEMS_POR_PAGINA,
    (paginaActual + 1) * ITEMS_POR_PAGINA
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Gestión de Conductores
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Administra los conductores del sistema
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
            <Button variant="outlined" startIcon={<Download />} onClick={exportarPDF}>
              PDF
            </Button>
            <Button variant="outlined" startIcon={<Upload />} onClick={exportarExcel} color="success">
              Excel
            </Button>
          </Box>
        </Box>

        {/* Search and Add */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, cédula o cliente..."
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
              Nuevo Conductor
            </Button>
          </Grid>
        </Grid>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'primary.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <Person />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {conductores.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Conductores
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'success.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <CheckCircle />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {conductores.filter(c => (c.saldo || 0) > 0).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Con Saldo
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(22% - 16px)', minWidth: 200, maxWidth: 'calc(22% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'info.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <DriveEta />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {clientes.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clientes
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
                Lista de Conductores
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredConductores.length} conductores encontrados
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Licencia</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conductoresPagina.map((conductor, index) => (
                    <TableRow key={conductor.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          #{paginaActual * ITEMS_POR_PAGINA + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Person sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" fontWeight="500">
                            {conductor.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <BadgeIcon sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />
                          <Typography variant="body2">
                            {conductor.cedula}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Phone sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />
                          <Typography variant="body2">
                            {conductor.telefono || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conductor.clienteNombre || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={conductor.tipoLicencia || 'N/A'}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight="600"
                          color={Number(conductor.saldo || 0) > 0 ? 'success.main' : 'text.secondary'}
                        >
                          ${Number(conductor.saldo || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => editarConductor(conductor)}
                              sx={{ color: 'primary.main' }}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => eliminarConductor(conductor.id)}
                              sx={{ color: 'error.main' }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredConductores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron conductores
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
                  Página {paginaActual + 1} de {totalPaginas} &nbsp;·&nbsp; {filteredConductores.length} conductores
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
              {editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value });
                      if (errors.nombre) setErrors({ ...errors, nombre: null });
                    }}
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                    required
                    placeholder="Ej: Juan Perez Garcia"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cedula"
                    value={formData.cedula}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, cedula: valor });
                      if (errors.cedula) setErrors({ ...errors, cedula: null });
                    }}
                    error={!!errors.cedula}
                    helperText={errors.cedula}
                    required
                    placeholder="1234567890"
                    inputProps={{ maxLength: 10 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefono"
                    value={formData.telefono}
                    onChange={(e) => {
                      const valor = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, telefono: valor });
                      if (errors.telefono) setErrors({ ...errors, telefono: null });
                    }}
                    error={!!errors.telefono}
                    helperText={errors.telefono}
                    required
                    placeholder="0987654321"
                    inputProps={{ maxLength: 10 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correo Electrénico"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: null });
                    }}
                    error={!!errors.email}
                    helperText={errors.email}
                    required
                    placeholder="conductor@ejemplo.com"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contraseéa"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    error={!!errors.password}
                    helperText={errors.password || "La contraseéa permitiré al conductor iniciar sesién"}
                    required={!editingConductor}
                    placeholder="Ménimo 6 caracteres"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    options={clientes}
                    value={clienteSeleccionado}
                    onChange={(_, value) => {
                      setClienteSeleccionado(value);
                      setFormData({ ...formData, clienteId: value ? value.id : '' });
                      if (errors.clienteId) setErrors({ ...errors, clienteId: null });
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
                        error={!!errors.clienteId}
                        helperText={errors.clienteId}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                    noOptionsText="Sin resultados"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!errors.tipoLicencia}>
                    <InputLabel shrink>Tipo de Licencia</InputLabel>
                    <Select
                      value={formData.tipoLicencia}
                      onChange={(e) => {
                        setFormData({ ...formData, tipoLicencia: e.target.value });
                        if (errors.tipoLicencia) setErrors({ ...errors, tipoLicencia: null });
                      }}
                      label="Tipo de Licencia"
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        <em>Seleccione tipo de licencia</em>
                      </MenuItem>
                      <MenuItem value="Tipo A">Tipo A</MenuItem>
                      <MenuItem value="Tipo B">Tipo B</MenuItem>
                      <MenuItem value="Tipo C">Tipo C</MenuItem>
                      <MenuItem value="Tipo D">Tipo D</MenuItem>
                      <MenuItem value="Tipo E">Tipo E</MenuItem>
                      <MenuItem value="Tipo F">Tipo F</MenuItem>
                      <MenuItem value="Tipo G">Tipo G</MenuItem>
                    </Select>
                    {errors.tipoLicencia && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                        {errors.tipoLicencia}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vencimiento Licencia"
                    type="date"
                    value={formData.vencimientoLicencia}
                    onChange={(e) => {
                      setFormData({ ...formData, vencimientoLicencia: e.target.value });
                      if (errors.vencimientoLicencia) setErrors({ ...errors, vencimientoLicencia: null });
                    }}
                    error={!!errors.vencimientoLicencia}
                    helperText={errors.vencimientoLicencia}
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      min: new Date().toISOString().split('T')[0]
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Saldo Inicial"
                    type="number"
                    value={formData.saldo}
                    onChange={(e) => {
                      setFormData({ ...formData, saldo: parseFloat(e.target.value) || 0 });
                      if (errors.saldo) setErrors({ ...errors, saldo: null });
                    }}
                    error={!!errors.saldo}
                    helperText={errors.saldo || 'Opcional: Saldo inicial del conductor'}
                    inputProps={{ step: 0.01, min: 0 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={cerrarDialog} variant="outlined">
              Cancelar
            </Button>
            <Button onClick={guardarConductor} variant="contained">
              {editingConductor ? 'Actualizar' : 'Registrar'}
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

export default ConductoresAdmin;
