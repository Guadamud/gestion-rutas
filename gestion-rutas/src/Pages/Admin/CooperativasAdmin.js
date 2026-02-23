import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Card, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip, Chip, Alert, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Business, Refresh, ToggleOn, ToggleOff
} from '@mui/icons-material';
import axios from 'axios';
import CustomSnackbar from '../../components/CustomSnackbar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CooperativasAdmin = () => {
  const [cooperativas, setCooperativas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCooperativa, setEditingCooperativa] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    descripcion: ''
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

  const cargarCooperativas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cooperativas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCooperativas(response.data);
    } catch (error) {
      console.error('Error al cargar cooperativas:', error);
      mostrarAlerta('Error al cargar cooperativas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCooperativas();
  }, []);

  const abrirDialog = () => {
    setFormData({ nombre: '', ruc: '', descripcion: '' });
    setEditingCooperativa(null);
    setOpenDialog(true);
  };

  const editarCooperativa = (cooperativa) => {
    setFormData({
      nombre: cooperativa.nombre,
      ruc: cooperativa.ruc || '',
      descripcion: cooperativa.descripcion || ''
    });
    setEditingCooperativa(cooperativa);
    setOpenDialog(true);
  };

  const guardarCooperativa = async () => {
    if (!formData.nombre.trim()) {
      mostrarAlerta('El nombre es obligatorio', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingCooperativa) {
        await axios.put(
          `${API_URL}/api/cooperativas/${editingCooperativa.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        mostrarAlerta('Cooperativa actualizada correctamente');
      } else {
        await axios.post(
          `${API_URL}/api/cooperativas`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        mostrarAlerta('Cooperativa creada correctamente');
      }
      
      setOpenDialog(false);
      cargarCooperativas();
    } catch (error) {
      console.error('Error al guardar cooperativa:', error);
      mostrarAlerta('Error al guardar cooperativa', 'error');
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/cooperativas/${id}`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarAlerta(`Cooperativa ${nuevoEstado === 'activo' ? 'activada' : 'desactivada'} correctamente`);
      // Actualizar localmente sin recargar
      setCooperativas(cooperativas.map(coop => 
        coop.id === id ? { ...coop, estado: nuevoEstado } : coop
      ));
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      mostrarAlerta('Error al cambiar estado', 'error');
    }
  };

  const eliminarCooperativa = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cooperativa?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/cooperativas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarAlerta('Cooperativa eliminada correctamente');
      cargarCooperativas();
    } catch (error) {
      console.error('Error al eliminar cooperativa:', error);
      mostrarAlerta('Error al eliminar cooperativa. Puede tener buses asociados.', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Gestión de Cooperativas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Administra las cooperativas del sistema
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Actualizar">
            <IconButton 
              onClick={cargarCooperativas}
              sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={abrirDialog}
          >
            Nueva Cooperativa
          </Button>
        </Box>
      </Box>

      {/* Stats Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Business sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {cooperativas.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cooperativas Registradas
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de Cooperativas */}
      <Card>
        <CardContent>
          {cooperativas.length === 0 ? (
            <Alert severity="info">No hay cooperativas registradas</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>RUC</strong></TableCell>
                    <TableCell><strong>Descripción</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cooperativas.map((cooperativa, index) => (
                    <TableRow key={cooperativa.id} hover>
                      <TableCell>#{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Business fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight="600">
                            {cooperativa.nombre}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {cooperativa.ruc || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{cooperativa.descripcion || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={cooperativa.estado}
                          size="small"
                          color={cooperativa.estado === 'activo' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center" gap={1}>
                          <Tooltip title={cooperativa.estado === 'activo' ? 'Desactivar' : 'Activar'}>
                            <IconButton
                              size="small"
                              onClick={() => cambiarEstado(cooperativa.id, cooperativa.estado === 'activo' ? 'inactivo' : 'activo')}
                              color={cooperativa.estado === 'activo' ? 'success' : 'default'}
                            >
                              {cooperativa.estado === 'activo' ? <ToggleOn /> : <ToggleOff />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => editarCooperativa(cooperativa)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => eliminarCooperativa(cooperativa.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Agregar/Editar Cooperativa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCooperativa ? 'Editar Cooperativa' : 'Nueva Cooperativa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre de la Cooperativa"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="RUC"
              value={formData.ruc}
              onChange={(e) => setFormData(prev => ({ ...prev, ruc: e.target.value }))}
              fullWidth
              helperText="Número de RUC de la cooperativa (opcional)"
            />
            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarCooperativa}>
            {editingCooperativa ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={cerrarAlerta}
      />
    </Container>
  );
};

export default CooperativasAdmin;
