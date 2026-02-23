import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Avatar,
  Grid,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Badge,
  Edit,
  Save,
  Cancel,
  Lock,
  Visibility,
  VisibilityOff,
  AccountCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { professionalColors } from '../../utils/professionalColors';
import CustomSnackbar from '../../components/CustomSnackbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PerfilUsuario = () => {
  const { user, login } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);

  const [formData, setFormData] = useState({
    nombres: user?.nombres || '',
    apellidos: user?.apellidos || '',
    celular: user?.celular || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
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

  const getInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  const getRolLabel = (rol) => {
    const roles = {
      admin: 'Administrador',
      tesoreria: 'Tesorería',
      cliente: 'Dueño de Bus',
      conductor: 'Conductor',
      verificador: 'Verificador'
    };
    return roles[rol] || rol;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleCancelEdit = () => {
    setFormData({
      nombres: user?.nombres || '',
      apellidos: user?.apellidos || '',
      celular: user?.celular || '',
      email: user?.email || ''
    });
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    if (!formData.nombres || !formData.apellidos || !formData.celular || !formData.email) {
      mostrarAlerta('Por favor completa todos los campos', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      mostrarAlerta('Por favor ingresa un correo electrónico válido', 'warning');
      return;
    }

    const celularRegex = /^0\d{9}$/;
    if (!celularRegex.test(formData.celular)) {
      mostrarAlerta('El celular debe tener 10 dígitos y empezar con 0', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar el contexto de autenticación con los nuevos datos
      login(response.data.user);
      
      mostrarAlerta('Perfil actualizado correctamente', 'success');
      setEditMode(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      mostrarAlerta(error.response?.data?.message || 'Error al actualizar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      mostrarAlerta('Por favor completa todos los campos de contraseña', 'warning');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      mostrarAlerta('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      mostrarAlerta('Las contraseñas nuevas no coinciden', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔐 Enviando solicitud de cambio de contraseña...');
      
      const response = await axios.put(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Respuesta del servidor:', response.data);
      mostrarAlerta('Contraseña actualizada correctamente', 'success');
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      console.error('📄 Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña. Por favor verifica tu conexión e intenta nuevamente.';
      mostrarAlerta(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  return (
    <>
      <Box sx={{ 
        bgcolor: professionalColors.background.primary, 
        minHeight: '100vh',
        pt: 4,
        pb: 6
      }}>
        <Container maxWidth="md">
          {/* Header con Avatar */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 4, 
              mb: 3,
              background: `linear-gradient(135deg, ${professionalColors.primary[500]} 0%, ${professionalColors.primary[700]} 100%)`,
              color: 'white',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: professionalColors.neutral[100],
                  color: professionalColors.primary[700],
                  fontSize: '2rem',
                  fontWeight: 600
                }}
              >
                {getInitials(user?.nombres, user?.apellidos)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" fontWeight="600" gutterBottom>
                  {user?.nombres} {user?.apellidos}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {getRolLabel(user?.rol)}
                </Typography>
              </Box>
              {!editMode && (
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => setEditMode(true)}
                  sx={{
                    bgcolor: 'white',
                    color: professionalColors.primary[700],
                    '&:hover': {
                      bgcolor: professionalColors.neutral[100]
                    }
                  }}
                >
                  Editar Perfil
                </Button>
              )}
            </Box>
          </Paper>

          {/* Información del Perfil */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
                Información Personal
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    name="nombres"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color={editMode ? "primary" : "disabled"} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellidos"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color={editMode ? "primary" : "disabled"} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color={editMode ? "primary" : "disabled"} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Celular"
                    name="celular"
                    value={formData.celular}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color={editMode ? "primary" : "disabled"} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cédula"
                    value={user?.cedula || ''}
                    disabled
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge color="disabled" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="La cédula no se puede modificar"
                  />
                </Grid>
              </Grid>

              {editMode && (
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    disabled={loading}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card elevation={2}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2 }}>
                Seguridad
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                Cambia tu contraseña regularmente para mantener tu cuenta segura.
              </Alert>

              <Button
                variant="contained"
                startIcon={<Lock />}
                onClick={() => setOpenPasswordDialog(true)}
                fullWidth
                sx={{ py: 1.5 }}
              >
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Dialog para cambiar contraseña */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock color="primary" />
            <Typography variant="h6" fontWeight="600">
              Cambiar Contraseña
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type={showPasswords.current ? 'text' : 'password'}
              label="Contraseña Actual"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showPasswords.new ? 'text' : 'password'}
              label="Nueva Contraseña"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              sx={{ mb: 2 }}
              helperText="Mínimo 6 caracteres"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showPasswords.confirm ? 'text' : 'password'}
              label="Confirmar Nueva Contraseña"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => {
              setOpenPasswordDialog(false);
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained"
            onClick={handleChangePassword}
            disabled={loading}
          >
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={cerrarAlerta}
      />
    </>
  );
};

export default PerfilUsuario;
