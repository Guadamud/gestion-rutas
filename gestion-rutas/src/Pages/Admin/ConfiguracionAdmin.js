import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Box,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Grid, Divider, Chip, TextField,
  Switch, FormControlLabel, LinearProgress
} from '@mui/material';
import {
  DeleteSweep, Warning, Info, CheckCircle, Settings, Event, Cancel,
  AutoMode, PlayArrow, Stop
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ConfiguracionAdmin = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  
  // Estados para limpieza programada
  const [fechaLimpieza, setFechaLimpieza] = useState('');
  const [inicioBloqueo, setInicioBloqueo] = useState('');
  const [finBloqueo, setFinBloqueo] = useState('');
  const [configuracion, setConfiguracion] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  // Estados para limpieza automática
  const [limpiezaAutomatica, setLimpiezaAutomatica] = useState(false);
  const [horarioLimpieza, setHorarioLimpieza] = useState('03:00');
  const [loteLimpieza, setLoteLimpieza] = useState(1000);
  const [intervaloLimpieza, setIntervaloLimpieza] = useState(5);
  const [progresoAutomatico, setProgresoAutomatico] = useState(null);
  const [loadingAutomatico, setLoadingAutomatico] = useState(false);

  const obtenerEstadisticas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/mantenimiento/estadisticas-limpieza`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEstadisticas(response.data);
      setOpenDialog(true);
    } catch (error) {
      setError('Error al obtener estadísticas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar configuración de limpieza programada
  const cargarConfiguracion = async () => {
    setLoadingConfig(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/mantenimiento/configuracion-limpieza`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfiguracion(response.data);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoadingConfig(false);
    }
  };
  
  useEffect(() => {
    cargarConfiguracion();
    cargarProgresoAutomatico();
    
    // Actualizar progreso cada 30 segundos si hay limpieza en progreso
    const intervalo = setInterval(() => {
      cargarProgresoAutomatico();
    }, 30000);
    
    return () => clearInterval(intervalo);
  }, []);
  
  const programarLimpieza = async () => {
    if (!fechaLimpieza || !inicioBloqueo || !finBloqueo) {
      setError('Por favor, completa todos los campos de fecha');
      return;
    }
    
    setLoadingConfig(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/mantenimiento/configurar-limpieza`,
        {
          fecha_limpieza: fechaLimpieza,
          fecha_inicio_bloqueo: inicioBloqueo,
          fecha_fin_bloqueo: finBloqueo
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Limpieza programada exitosamente');
      setFechaLimpieza('');
      setInicioBloqueo('');
      setFinBloqueo('');
      cargarConfiguracion();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al programar limpieza');
      console.error(error);
    } finally {
      setLoadingConfig(false);
    }
  };
  
  const cancelarLimpieza = async () => {
    if (!window.confirm('¿Estás seguro de cancelar la limpieza programada?')) {
      return;
    }
    
    setLoadingConfig(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/mantenimiento/cancelar-limpieza`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Limpieza cancelada exitosamente');
      cargarConfiguracion();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al cancelar limpieza');
      console.error(error);
    } finally {
      setLoadingConfig(false);
    }
  };
  
  // Funciones para limpieza automática
  const cargarProgresoAutomatico = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/mantenimiento/progreso-limpieza-automatica`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgresoAutomatico(response.data);
      setLimpiezaAutomatica(response.data.activa || false);
      setHorarioLimpieza(response.data.horario || '03:00');
      setLoteLimpieza(response.data.lote || 1000);
      setIntervaloLimpieza(response.data.intervalo || 5);
    } catch (error) {
      console.error('Error al cargar progreso:', error);
    }
  };
  
  const configurarLimpiezaAutomatica = async () => {
    setLoadingAutomatico(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/mantenimiento/configurar-limpieza-automatica`,
        {
          activa: limpiezaAutomatica,
          horario: horarioLimpieza,
          lote: loteLimpieza,
          intervalo: intervaloLimpieza
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(limpiezaAutomatica 
        ? '✅ Limpieza automática activada. Se ejecutará gradualmente sin detener el sistema'
        : 'Limpieza automática desactivada');
      cargarProgresoAutomatico();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al configurar limpieza automática');
    } finally {
      setLoadingAutomatico(false);
    }
  };
  
  const iniciarLimpiezaManual = async () => {
    if (!window.confirm('¿Iniciar un ciclo de limpieza gradual ahora?')) {
      return;
    }
    
    setLoadingAutomatico(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/mantenimiento/ejecutar-limpieza-gradual`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(response.data.message);
      cargarProgresoAutomatico();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al ejecutar limpieza');
    } finally {
      setLoadingAutomatico(false);
    }
  };
  
  const detenerLimpiezaAutomatica = async () => {
    if (!window.confirm('¿Detener la limpieza en progreso?')) {
      return;
    }
    
    setLoadingAutomatico(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/mantenimiento/detener-limpieza-automatica`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess('Limpieza automática detenida');
      cargarProgresoAutomatico();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al detener limpieza');
    } finally {
      setLoadingAutomatico(false);
    }
  };

  const confirmarLimpieza = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/mantenimiento/limpiar-datos-anuales`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResultado(response.data.registrosEliminados);
      setSuccess('Limpieza completada exitosamente');
      setOpenDialog(false);
      
      setTimeout(() => {
        setResultado(null);
      }, 10000);
    } catch (error) {
      setError(error.response?.data?.message || 'Error al realizar la limpieza');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
          Configuración del Sistema
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra la configuración y mantenimiento del sistema
        </Typography>
      </Box>

      {/* Alertas */}
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

      {/* Resultado de limpieza */}
      {resultado && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Limpieza Completada
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Frecuencias</Typography>
              <Typography variant="h6">{resultado.frecuencias}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Transacciones</Typography>
              <Typography variant="h6">{resultado.transacciones}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Cierres</Typography>
              <Typography variant="h6">{resultado.cierresCaja}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h6" color="primary">{resultado.total}</Typography>
            </Grid>
          </Grid>
        </Alert>
      )}

      {/* Card: Programar Limpieza Anual */}
      <Card sx={{ boxShadow: 3, mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Event sx={{ fontSize: 35, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                📅 Programar Limpieza Anual
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configura la fecha de limpieza y el período de bloqueo de frecuencias
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {loadingConfig ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Estado actual de configuración */}
              {configuracion?.limpieza_programada && (
                <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Limpieza Programada Activa
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      📆 <strong>Fecha de limpieza:</strong> {new Date(configuracion.fecha_limpieza).toLocaleString('es-ES')}
                    </Typography>
                    <Typography variant="body2">
                      ⏰ <strong>Días restantes:</strong> {configuracion.dias_restantes} días
                    </Typography>
                    <Typography variant="body2">
                      🚫 <strong>Bloqueo:</strong> {new Date(configuracion.fecha_inicio_bloqueo).toLocaleDateString('es-ES')} - {new Date(configuracion.fecha_fin_bloqueo).toLocaleDateString('es-ES')}
                    </Typography>
                    {configuracion.debe_notificar && (
                      <Chip 
                        label="⚠️ Notificación activa (5 días o menos)" 
                        color="warning" 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    )}
                    {configuracion.esta_en_periodo_bloqueo && (
                      <Chip 
                        label="🔒 Sistema bloqueado - No se permiten frecuencias" 
                        color="error" 
                        size="small" 
                        sx={{ mt: 1, ml: 1 }}
                      />
                    )}
                  </Box>
                </Alert>
              )}

              {/* Alerta cuando está cerca la limpieza */}
              {configuracion?.debe_notificar && !configuracion?.esta_en_periodo_bloqueo && (
                <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>⚠️ ATENCIÓN:</strong> El sistema realizará una limpieza en <strong>{configuracion.dias_restantes} días</strong>.
                    Todos los datos antiguos serán eliminados.
                  </Typography>
                </Alert>
              )}

              {/* Formulario de programación */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Fecha y Hora de Limpieza"
                    value={fechaLimpieza}
                    onChange={(e) => setFechaLimpieza(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Cuándo se ejecutará la limpieza"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Inicio Bloqueo"
                    value={inicioBloqueo}
                    onChange={(e) => setInicioBloqueo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Desde cuándo bloquear frecuencias"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Fin Bloqueo"
                    value={finBloqueo}
                    onChange={(e) => setFinBloqueo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Hasta cuándo bloquear frecuencias"
                  />
                </Grid>
              </Grid>

              {/* Botones de acción */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={programarLimpieza}
                  disabled={!fechaLimpieza || !inicioBloqueo || !finBloqueo}
                  startIcon={<Event />}
                >
                  Programar Limpieza
                </Button>
                
                {configuracion?.limpieza_programada && (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={cancelarLimpieza}
                    startIcon={<Cancel />}
                  >
                    Cancelar Limpieza Programada
                  </Button>
                )}
              </Box>

              {/* Información adicional */}
              <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Funcionamiento:</strong>
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>El sistema notificará a todos los usuarios <strong>5 días antes</strong> de la limpieza</li>
                  <li>Durante el período de bloqueo, <strong>NO se permitirá</strong> crear nuevas frecuencias</li>
                  <li>La limpieza debe ejecutarse manualmente el día programado usando el botón de abajo</li>
                  <li>Se eliminan: frecuencias antiguas, transacciones procesadas y cierres de caja</li>
                </ul>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card de Limpieza Automática Gradual */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AutoMode sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                Limpieza Automática Gradual
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elimina datos antiguos gradualmente sin detener el sistema
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch 
                  checked={limpiezaAutomatica} 
                  onChange={(e) => setLimpiezaAutomatica(e.target.checked)}
                  color="success"
                />
              }
              label={limpiezaAutomatica ? "Activada" : "Desactivada"}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              ✅ Ventajas de la limpieza automática:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li><strong>Sin interrupciones:</strong> El sistema sigue funcionando normalmente</li>
              <li><strong>Gradual:</strong> Elimina datos en lotes pequeños para no afectar el rendimiento</li>
              <li><strong>Automática:</strong> Se ejecuta en horarios programados sin intervención manual</li>
              <li><strong>Segura:</strong> Solo elimina datos antiguos (mayores a 1 año)</li>
            </Box>
          </Alert>

          {/* Configuración */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Horario de Ejecución"
                type="time"
                value={horarioLimpieza}
                onChange={(e) => setHorarioLimpieza(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Hora del día para ejecutar limpieza"
                disabled={!limpiezaAutomatica}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Registros por Lote"
                type="number"
                value={loteLimpieza}
                onChange={(e) => setLoteLimpieza(parseInt(e.target.value))}
                inputProps={{ min: 100, max: 10000, step: 100 }}
                helperText="Cantidad a eliminar por ciclo"
                disabled={!limpiezaAutomatica}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Intervalo entre Lotes (minutos)"
                type="number"
                value={intervaloLimpieza}
                onChange={(e) => setIntervaloLimpieza(parseInt(e.target.value))}
                inputProps={{ min: 1, max: 60 }}
                helperText="Tiempo de espera entre cada lote"
                disabled={!limpiezaAutomatica}
              />
            </Grid>
          </Grid>

          {/* Progreso de limpieza actual */}
          {progresoAutomatico?.enProgreso && progresoAutomatico?.progreso && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🔄 Limpieza en Progreso
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {progresoAutomatico.progreso.eliminados} / {progresoAutomatico.progreso.eliminados + progresoAutomatico.progreso.restantes} registros
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {progresoAutomatico.progreso.porcentaje}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progresoAutomatico.progreso.porcentaje} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Restantes: {progresoAutomatico.progreso.restantes} registros
                </Typography>
              </Box>
            </Box>
          )}

          {/* Botones de acción */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="success"
              onClick={configurarLimpiezaAutomatica}
              disabled={loadingAutomatico}
              startIcon={loadingAutomatico ? <CircularProgress size={20} /> : <Settings />}
            >
              Guardar Configuración
            </Button>
            
            {limpiezaAutomatica && (
              <>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={iniciarLimpiezaManual}
                  disabled={loadingAutomatico || progresoAutomatico?.enProgreso}
                  startIcon={<PlayArrow />}
                >
                  Ejecutar un Ciclo Ahora
                </Button>
                
                {progresoAutomatico?.enProgreso && (
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={detenerLimpiezaAutomatica}
                    disabled={loadingAutomatico}
                    startIcon={<Stop />}
                  >
                    Detener Limpieza
                  </Button>
                )}
              </>
            )}
          </Box>

          <Alert severity="info" icon={<Info />} sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>¿Cómo funciona?</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Cuando está activada, el sistema revisa cada hora si debe ejecutar la limpieza. 
              A la hora programada, comienza a eliminar datos antiguos (mayores a 1 año) en lotes pequeños, 
              esperando el tiempo configurado entre cada lote. Esto permite que el sistema siga funcionando 
              normalmente sin interrupciones.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Card de Limpieza Anual */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DeleteSweep sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Limpieza Manual Completa
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elimina datos históricos para optimizar el rendimiento del sistema
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              ¿Qué se eliminará?
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Todas las frecuencias registradas</li>
              <li>Historial completo de compras de saldo</li>
              <li>Todos los cierres de caja</li>
            </Box>
          </Alert>

          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600" gutterBottom>
              ¿Qué se conservará?
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Todos los usuarios y sus credenciales</li>
              <li>El saldo actual de todos los usuarios</li>
              <li>Configuración de rutas, buses y cooperativas</li>
            </Box>
          </Alert>

          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              ⚠️ Advertencia: Esta acción no se puede deshacer
            </Typography>
            <Typography variant="body2">
              Se recomienda hacer una copia de seguridad antes de continuar
            </Typography>
          </Alert>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <DeleteSweep />}
              onClick={obtenerEstadisticas}
              disabled={loading}
              sx={{ px: 4, py: 1.5 }}
            >
              {loading ? 'Cargando...' : 'Iniciar Limpieza Anual'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirmar Limpieza de Datos
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {estadisticas && (
            <>
              {/* Mostrar error si hay pendientes */}
              {estadisticas.pendientes && estadisticas.pendientes.total > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    ❌ No se puede realizar la limpieza
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Hay procesos pendientes que deben completarse primero:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                    {estadisticas.pendientes.solicitudes > 0 && (
                      <li>{estadisticas.pendientes.solicitudes} solicitudes pendientes de aprobar/rechazar</li>
                    )}
                    {estadisticas.pendientes.frecuencias > 0 && (
                      <li>{estadisticas.pendientes.frecuencias} frecuencias pendientes de verificar</li>
                    )}
                    {estadisticas.pendientes.transaccionesSinCerrar > 0 && (
                      <li>{estadisticas.pendientes.transaccionesSinCerrar} transacciones aprobadas sin incluir en cierre de caja</li>
                    )}
                  </Box>
                </Alert>
              )}
              
              {/* Mostrar advertencia normal si no hay pendientes */}
              {(!estadisticas.pendientes || estadisticas.pendientes.total === 0) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Estás a punto de eliminar permanentemente los siguientes datos:
                </Alert>
              )}
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Frecuencias</Typography>
                      <Typography variant="h4" color="error.main">{estadisticas.frecuencias}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Transacciones</Typography>
                      <Typography variant="h4" color="error.main">{estadisticas.transacciones}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Cierres de Caja</Typography>
                      <Typography variant="h4" color="error.main">{estadisticas.cierresCaja}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">Total Registros</Typography>
                      <Typography variant="h4" color="primary.main">{estadisticas.total}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {estadisticas.puedeLimpiar === false ? (
                <Typography variant="body2" color="error" fontWeight="bold" textAlign="center">
                  ❌ Completa los procesos pendientes antes de continuar
                </Typography>
              ) : (
                <Typography variant="body2" color="error" fontWeight="bold" textAlign="center">
                  ⚠️ Esta acción es irreversible. ¿Deseas continuar?
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={confirmarLimpieza}
            variant="contained"
            color="error"
            disabled={loading || (estadisticas && estadisticas.puedeLimpiar === false)}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteSweep />}
          >
            {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConfiguracionAdmin;
