import React, { useEffect, useState } from 'react';
import {
  Container, Typography, TextField, Box, Table, TableHead,
  TableBody, TableRow, TableCell, Grid, Card, CardContent,
  IconButton, Chip, TableContainer, Divider, InputAdornment,
  Tooltip, MenuItem, Select, FormControl, Paper, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  AccountBalance,
  Groups,
  Search,
  Refresh,
  DirectionsBus,
  VerifiedUser,
  Delete,
  Add,
  Edit,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import axios from 'axios';
import CustomSnackbar from '../../components/CustomSnackbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const UsuariosAdmin = () => {
  const ITEMS_POR_PAGINA = 10;
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    cedula: '',
    celular: '',
    rol: 'tesoreria'
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

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(response.data);
      mostrarAlerta("Usuarios cargados exitosamente", "success");
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      mostrarAlerta(error.response?.data?.message || "Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const actualizarRol = async (id, nuevoRol) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/auth/users/${id}/rol`, 
        { rol: nuevoRol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsuarios(prev => 
        prev.map(usuario => 
          usuario.id === id 
            ? { ...usuario, rol: nuevoRol }
            : usuario
        )
      );
      mostrarAlerta(`Rol actualizado a ${nuevoRol}`, "success");
    } catch (error) {
      console.error("Error al actualizar rol:", error);
      mostrarAlerta("Error al actualizar rol", 'error');
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/users/${id}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
      mostrarAlerta('Usuario eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al eliminar usuario', 'error');
    }
  };

  const handleOpenDialog = () => {
    setEditingUser(null);
    setOpenDialog(true);
    setNuevoUsuario({
      nombres: '',
      apellidos: '',
      email: '',
      password: '',
      cedula: '',
      celular: '',
      rol: 'tesoreria'
    });
  };

  const handleEditUser = (usuario) => {
    setEditingUser(usuario);
    setNuevoUsuario({
      nombres: usuario.nombres || '',
      apellidos: usuario.apellidos || '',
      email: usuario.email || '',
      password: '',
      cedula: usuario.cedula || '',
      celular: usuario.celular || '',
      rol: usuario.rol
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleChangeNuevoUsuario = (e) => {
    const { name, value } = e.target;
    setNuevoUsuario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!nuevoUsuario.nombres.trim()) {
      mostrarAlerta('El nombre es requerido', 'error');
      return false;
    }
    if (!nuevoUsuario.apellidos.trim()) {
      mostrarAlerta('Los apellidos son requeridos', 'error');
      return false;
    }
    if (!nuevoUsuario.email.trim()) {
      mostrarAlerta('El email es requerido', 'error');
      return false;
    }
    // Solo validar contraseña si estamos creando o si se ingresó una nueva
    if (!editingUser && (!nuevoUsuario.password || nuevoUsuario.password.length < 6)) {
      mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'error');
      return false;
    }
    if (editingUser && nuevoUsuario.password && nuevoUsuario.password.length < 6) {
      mostrarAlerta('La contraseña debe tener al menos 6 caracteres', 'error');
      return false;
    }
    if (!nuevoUsuario.cedula.trim() || nuevoUsuario.cedula.length !== 10) {
      mostrarAlerta('La cédula debe tener 10 dígitos', 'error');
      return false;
    }
    if (!nuevoUsuario.celular.trim() || nuevoUsuario.celular.length !== 10) {
      mostrarAlerta('El celular debe tener 10 dígitos', 'error');
      return false;
    }
    return true;
  };

  const guardarUsuario = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingUser) {
        // Actualizar usuario existente
        const dataToUpdate = { ...nuevoUsuario };
        // Si no se ingresó contraseña, no enviarla
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        
        await axios.put(
          `${API_URL}/api/admin/usuarios/${editingUser.id}`,
          dataToUpdate,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        mostrarAlerta('Usuario actualizado exitosamente', 'success');
      } else {
        // Crear nuevo usuario
        await axios.post(
          `${API_URL}/auth/register`,
          nuevoUsuario,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        mostrarAlerta('Usuario creado exitosamente', 'success');
      }

      handleCloseDialog();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al guardar usuario', 'error');
    }
  };

  const getRolIcon = (rol) => {
    switch (rol) {
      case 'admin':
        return <AdminPanelSettings sx={{ color: '#ef4444' }} />;
      case 'tesoreria':
        return <AccountBalance sx={{ color: '#f59e0b' }} />;
      case 'cliente':
        return <Person sx={{ color: '#10b981' }} />;
      case 'conductor':
        return <DirectionsBus sx={{ color: '#3b82f6' }} />;
      case 'verificador':
        return <VerifiedUser sx={{ color: '#8b5cf6' }} />;
      default:
        return <Groups sx={{ color: '#6b7280' }} />;
    }
  };

  const getRolColor = (rol) => {
    switch (rol) {
      case 'admin':
        return 'error';
      case 'tesoreria':
        return 'warning';
      case 'cliente':
        return 'success';
      case 'conductor':
        return 'info';
      case 'verificador':
        return 'secondary';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(0);
  }, [searchTerm]);

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.cedula?.includes(searchTerm)
  );

  const totalPaginas = Math.ceil(filteredUsuarios.length / ITEMS_POR_PAGINA);
  const usuariosPagina = filteredUsuarios.slice(
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
              Gestión de Usuarios
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Administra los usuarios y sus roles
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
                textTransform: 'none',
                fontWeight: 600,
                px: 3
              }}
            >
              Agregar Usuario
            </Button>
            <Tooltip title="Actualizar datos">
              <IconButton 
                onClick={cargarUsuarios} 
                disabled={loading}
                sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, email o cédula..."
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
        </Grid>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(15% - 16px)', minWidth: 160, maxWidth: 'calc(15% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'primary.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <Groups />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {usuarios.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Usuarios
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(15% - 16px)', minWidth: 160, maxWidth: 'calc(15% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'error.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <AdminPanelSettings />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {usuarios.filter(u => u.rol === 'admin').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administradores
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(15% - 16px)', minWidth: 160, maxWidth: 'calc(15% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'warning.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <AccountBalance />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {usuarios.filter(u => u.rol === 'tesoreria').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tesorería
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(15% - 16px)', minWidth: 160, maxWidth: 'calc(15% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'success.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <Person />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {usuarios.filter(u => u.rol === 'cliente').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clientes
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(15% - 16px)', minWidth: 160, maxWidth: 'calc(15% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'info.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <DirectionsBus />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {usuarios.filter(u => u.rol === 'conductor').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conductores
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ minHeight: 140, flex: '0 0 calc(15% - 16px)', minWidth: 160, maxWidth: 'calc(15% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'secondary.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <VerifiedUser />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {usuarios.filter(u => u.rol === 'verificador').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verificadores
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
                Lista de Usuarios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredUsuarios.length} usuarios encontrados
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Cédula</TableCell>
                    <TableCell>Celular</TableCell>
                    <TableCell align="center">Rol</TableCell>
                    <TableCell align="center">Cambiar Rol</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuariosPagina.map((usuario, index) => (
                    <TableRow key={usuario.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          #{paginaActual * ITEMS_POR_PAGINA + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getRolIcon(usuario.rol)}
                          <Box ml={1}>
                            <Typography variant="body2" fontWeight="500">
                              {usuario.nombres} {usuario.apellidos}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {usuario.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {usuario.cedula}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {usuario.celular}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={usuario.rol}
                          size="small"
                          color={getRolColor(usuario.rol)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={usuario.rol}
                            onChange={(e) => actualizarRol(usuario.id, e.target.value)}
                            sx={{ fontSize: '0.875rem' }}
                          >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="tesoreria">Tesorería</MenuItem>
                            <MenuItem value="cliente">Cliente</MenuItem>
                            <MenuItem value="conductor">Conductor</MenuItem>
                            <MenuItem value="verificador">Verificador</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar usuario">
                          <IconButton 
                            onClick={() => handleEditUser(usuario)}
                            color="primary"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar usuario">
                          <IconButton 
                            onClick={() => eliminarUsuario(usuario.id)}
                            color="error"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsuarios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron usuarios
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
                <IconButton
                  onClick={() => setPaginaActual(p => p - 1)}
                  disabled={paginaActual === 0}
                  size="small"
                  sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
                >
                  <NavigateBefore />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Página {paginaActual + 1} de {totalPaginas} &nbsp;·&nbsp; {filteredUsuarios.length} usuarios
                </Typography>
                <IconButton
                  onClick={() => setPaginaActual(p => p + 1)}
                  disabled={paginaActual >= totalPaginas - 1}
                  size="small"
                  sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
                >
                  <NavigateNext />
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        <CustomSnackbar
          open={snackbar.open}
          handleClose={cerrarAlerta}
          message={snackbar.message}
          severity={snackbar.severity}
        />

        {/* Dialog para agregar usuario */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="bold">
              {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {editingUser ? 'Actualice los datos del usuario' : 'Complete los datos del nuevo usuario'}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombres"
                  name="nombres"
                  value={nuevoUsuario.nombres}
                  onChange={handleChangeNuevoUsuario}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  name="apellidos"
                  value={nuevoUsuario.apellidos}
                  onChange={handleChangeNuevoUsuario}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={handleChangeNuevoUsuario}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={editingUser ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                  name="password"
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={handleChangeNuevoUsuario}
                  helperText={editingUser ? "Mínimo 6 caracteres si desea cambiarla" : "Mínimo 6 caracteres"}
                  required={!editingUser}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cédula"
                  name="cedula"
                  value={nuevoUsuario.cedula}
                  onChange={handleChangeNuevoUsuario}
                  inputProps={{ maxLength: 10 }}
                  helperText="10 dígitos"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Celular"
                  name="celular"
                  value={nuevoUsuario.celular}
                  onChange={handleChangeNuevoUsuario}
                  inputProps={{ maxLength: 10 }}
                  helperText="10 dígitos"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    select
                    label="Rol"
                    name="rol"
                    value={nuevoUsuario.rol}
                    onChange={handleChangeNuevoUsuario}
                  >
                    <MenuItem value="tesoreria">Tesorería</MenuItem>
                    <MenuItem value="verificador">Verificador</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                    <MenuItem value="cliente">Cliente</MenuItem>
                  </TextField>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Nota: Los conductores son agregados por los clientes
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={guardarUsuario}
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {editingUser ? 'Actualizar' : 'Crear Usuario'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UsuariosAdmin;
