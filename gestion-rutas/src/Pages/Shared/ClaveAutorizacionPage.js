import React, { useState, useEffect } from 'react';
import useAutoAlert from '../../hooks/useAutoAlert';
import {
  Container, Typography, Card, CardContent, Box,
  Button, Grid, TextField, Alert, CircularProgress,
  Radio, RadioGroup, FormControlLabel, FormControl,
  FormLabel, Divider, InputAdornment, IconButton
} from '@mui/material';
import {
  VpnKey, AccessTime, Lock, CheckCircle, Warning, 
  Info, Visibility, VisibilityOff, Casino, ContentCopy
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ClaveAutorizacionPage = () => {
  // Estados
  const [tipoClave, setTipoClave] = useState('definitiva');
  const [claveNueva, setClaveNueva] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [claveConfigurada, setClaveConfigurada] = useState(false);
  const [showClave, setShowClave] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useAutoAlert(10000);
  const [error, setError] = useAutoAlert(10000);
  const [claveGenerada, setClaveGenerada] = useState('');
  const [claveActual, setClaveActual] = useState('');
  const [mostrarClaveActual, setMostrarClaveActual] = useState(false);
  const [loadingVerClave, setLoadingVerClave] = useState(false);

  useEffect(() => {
    verificarEstadoClave();
  }, []);

  const verificarEstadoClave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/clave-autorizacion/estado`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaveConfigurada(response.data.configurada);
    } catch (error) {
      console.error('Error al verificar estado de clave:', error);
    }
  };

  const generarClaveAleatoria = () => {
    const clave = Math.floor(1000 + Math.random() * 9000).toString();
    setClaveNueva(clave);
    setConfirmarClave(clave);
    setClaveGenerada(clave);
    setSuccess(`🎲 Clave generada: ${clave}`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const copiarClave = () => {
    if (claveGenerada) {
      navigator.clipboard.writeText(claveGenerada);
      setSuccess('📋 Clave copiada al portapapeles');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const verClaveActual = async () => {
    setError('');
    setSuccess('');
    
    const passwordAdmin = prompt('Ingresa tu contraseña de administrador para ver la clave actual:');
    
    if (!passwordAdmin) {
      return;
    }

    setLoadingVerClave(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/admin/clave-autorizacion/ver`,
        { password_admin: passwordAdmin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClaveActual(response.data.clave);
      setMostrarClaveActual(true);
      setSuccess('✅ Clave recuperada exitosamente');
      
      setTimeout(() => {
        setMostrarClaveActual(false);
        setClaveActual('');
      }, 10000);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al obtener la clave';
      setError(errorMsg);
    } finally {
      setLoadingVerClave(false);
    }
  };

  const establecerClave = async () => {
    setError('');
    setSuccess('');

    if (!claveNueva || claveNueva.length < 4 || claveNueva.length > 6) {
      setError('La clave debe tener entre 4 y 6 dígitos');
      return;
    }

    if (!/^\d+$/.test(claveNueva)) {
      setError('La clave solo puede contener números');
      return;
    }

    if (claveNueva !== confirmarClave) {
      setError('Las claves no coinciden');
      return;
    }

    if (tipoClave === 'temporal' && !fechaExpiracion) {
      setError('Las claves temporales requieren una fecha de expiración');
      return;
    }

    const passwordAdmin = prompt('Ingresa tu contraseña de administrador para confirmar:');
    
    if (!passwordAdmin) {
      setError('Debes ingresar tu contraseña para continuar');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${API_URL}/api/admin/clave-autorizacion`,
        {
          clave_nueva: claveNueva,
          password_admin: passwordAdmin,
          es_temporal: tipoClave === 'temporal',
          // Convertir a ISO con timezone correcto: el input datetime-local no tiene zona horaria,
          // new Date() en el navegador lo interpreta en hora local (Ecuador UTC-5),
          // .toISOString() lo convierte a UTC real para que el servidor lo guarde correctamente.
          fecha_expiracion: tipoClave === 'temporal' && fechaExpiracion ? new Date(fechaExpiracion).toISOString() : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let mensaje = '✅ Clave establecida correctamente';
      
      if (tipoClave === 'temporal' && fechaExpiracion) {
        const fecha = new Date(fechaExpiracion);
        mensaje += ` (expira: ${fecha.toLocaleString('es-ES')})`;
      }

      setSuccess(mensaje);
      setClaveNueva('');
      setConfirmarClave('');
      setFechaExpiracion('');
      setClaveGenerada('');
      setClaveConfigurada(true);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error al establecer la clave';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
            <VpnKey sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
            Gestión de Clave de Cierre de Caja
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configura la clave que Tesorería necesitará para realizar cierres de caja
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Alert 
          severity={claveConfigurada ? "success" : "warning"} 
          icon={claveConfigurada ? <CheckCircle /> : <Warning />}
          sx={{ mb: 3 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {claveConfigurada 
                  ? "✅ Hay una clave de autorización activa" 
                  : "⚠️ No hay clave de autorización configurada"
                }
              </Typography>
              <Typography variant="body2">
                {claveConfigurada 
                  ? "Tesorería puede cerrar caja usando esta clave" 
                  : "Debes configurar una clave para permitir cierres de caja"
                }
              </Typography>
            </Box>
            {claveConfigurada && (
              <Button
                variant="outlined"
                size="small"
                startIcon={loadingVerClave ? <CircularProgress size={16} /> : <Visibility />}
                onClick={verClaveActual}
                disabled={loadingVerClave}
              >
                Ver Clave Actual
              </Button>
            )}
          </Box>
        </Alert>

        {mostrarClaveActual && claveActual && (
          <Alert severity="info" icon={<VpnKey />} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              🔑 Clave Actual Activa:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              backgroundColor: 'background.paper',
              p: 2,
              borderRadius: 1,
              mt: 1
            }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {claveActual}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopy />}
                onClick={() => {
                  navigator.clipboard.writeText(claveActual);
                  setSuccess('📋 Clave copiada');
                  setTimeout(() => setSuccess(''), 2000);
                }}
              >
                Copiar
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              ⚠️ Esta clave se ocultará automáticamente en 10 segundos
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Lock sx={{ fontSize: 35, color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      Configurar Nueva Clave
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Establece una clave temporal o definitiva
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Tipo de Clave
                  </FormLabel>
                  <RadioGroup
                    value={tipoClave}
                    onChange={(e) => setTipoClave(e.target.value)}
                    row
                  >
                    <FormControlLabel 
                      value="definitiva" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">Definitiva</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Válida hasta que la cambies manualmente
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="temporal" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="bold">Temporal</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Para turnos específicos - Recuerda cambiarla después
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nueva Clave (4-6 dígitos)"
                      type={showClave ? "text" : "password"}
                      value={claveNueva}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 6) {
                          setClaveNueva(value);
                        }
                      }}
                      placeholder="Ej: 5678"
                      inputProps={{ maxLength: 6 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowClave(!showClave)} edge="end">
                              {showClave ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Confirmar Clave"
                      type="password"
                      value={confirmarClave}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 6) {
                          setConfirmarClave(value);
                        }
                      }}
                      placeholder="Repite la clave"
                      inputProps={{ maxLength: 6 }}
                      error={claveNueva !== '' && confirmarClave !== '' && claveNueva !== confirmarClave}
                      helperText={
                        claveNueva !== '' && confirmarClave !== '' && claveNueva !== confirmarClave 
                          ? "Las claves no coinciden" 
                          : ""
                      }
                    />
                  </Grid>

                  {tipoClave === 'temporal' && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Nota:</strong> La fecha es solo referencia. Recuerda cambiar la clave manualmente cuando ya no la necesites.
                        </Typography>
                      </Alert>
                      <TextField
                        fullWidth
                        id="fechaExpiracion"
                        type="datetime-local"
                        label="Fecha de Expiración (Referencia)"
                        value={fechaExpiracion}
                        onChange={(e) => setFechaExpiracion(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="Establece una fecha como recordatorio"
                      />
                    </Grid>
                  )}
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Casino />}
                    onClick={generarClaveAleatoria}
                    sx={{ mr: 2 }}
                  >
                    Generar Clave Aleatoria
                  </Button>
                  {claveGenerada && (
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={copiarClave}
                    >
                      Copiar Clave
                    </Button>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  fullWidth
                  onClick={establecerClave}
                  disabled={loading || !claveNueva || !confirmarClave}
                  startIcon={loading ? <CircularProgress size={20} /> : <VpnKey />}
                >
                  {loading ? 'Estableciendo...' : 'Establecer Clave'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTime sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Clave Temporal
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Ideal para turnos específicos o situaciones puntuales.
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                  <Typography component="li" variant="body2">
                    Recuerda cambiarla manualmente
                  </Typography>
                  <Typography component="li" variant="body2">
                    Úsala solo por tiempo limitado
                  </Typography>
                  <Typography component="li" variant="body2">
                    Mayor seguridad para turnos
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ boxShadow: 2, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Lock sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Clave Definitiva
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Para uso regular y continuo.
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                  <Typography component="li" variant="body2">
                    No expira automáticamente
                  </Typography>
                  <Typography component="li" variant="body2">
                    Puedes cambiarla cuando quieras
                  </Typography>
                  <Typography component="li" variant="body2">
                    Más conveniente
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Alert severity="warning" icon={<Warning />}>
              <Typography variant="body2" fontWeight="600" gutterBottom>
                🔒 Recomendaciones
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 0, fontSize: '0.875rem' }}>
                <li>No uses claves obvias como "1234"</li>
                <li>Cambia claves definitivas cada mes</li>
                <li>Usa claves temporales para turnos específicos</li>
                <li>No compartas la clave por WhatsApp</li>
              </Box>
            </Alert>
          </Grid>
        </Grid>

        <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>💡 ¿Cómo funciona?</strong> Cuando Tesorería vaya a cerrar caja, el sistema 
            le pedirá que ingrese esta clave. Tú le proporcionas la clave verbalmente o por mensaje 
            seguro, y ellos la ingresan para completar el cierre.
          </Typography>
        </Alert>
      </Container>
    </Box>
  );
};

export default ClaveAutorizacionPage;
