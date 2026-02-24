import React, { useEffect, useState } from 'react';
import {
  Typography, Grid, Paper, Box, Card, CardContent,
  IconButton, Divider, CircularProgress, Chip, Avatar, List, ListItem,
  ListItemText, ListItemAvatar, Badge
} from '@mui/material';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts';
import {
  DirectionsBus, Group, Route, Schedule, Refresh, TrendingUp,
  MonetizationOn, People, Warning, CheckCircle, Timer, Speed,
  Star, LocalShipping, AccessTime, Analytics, EmojiEvents
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBuses: 0,
    totalRutas: 0,
    totalFrecuencias: 0,
    totalUsuarios: 0,
    frecuenciasPorEstado: [],
    busesActivos: 0,
    conductoresActivos: 0,
    tasaOcupacion: 0,
    frecuenciasHoy: 0,
    frecuenciasCompletadas: 0,
    eficienciaOperativa: 0,
    conductoresTop: [],
    alertas: [],
    tendenciaSemanal: [],
    distribucionHoraria: []
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log('Cargando datos del dashboard...');

      const [busesResp, rutasResp, frecuenciasResp, usuariosResp, conductoresResp] = await Promise.all([
        axios.get(`${API_URL}/api/buses`, { headers }).catch(err => { console.error('Error buses:', err); return { data: [] }; }),
        axios.get(`${API_URL}/api/rutas`, { headers }).catch(err => { console.error('Error rutas:', err); return { data: [] }; }),
        axios.get(`${API_URL}/api/frecuencias`, { headers }).catch(err => { console.error('Error frecuencias:', err); return { data: [] }; }),
        axios.get(`${API_URL}/auth/users`, { headers }).catch(err => { console.error('Error usuarios:', err); return { data: [] }; }),
        axios.get(`${API_URL}/api/conductores`, { headers }).catch(err => { console.error('Error conductores:', err); return { data: [] }; })
      ]);

      const buses = Array.isArray(busesResp.data) ? busesResp.data : [];
      const rutas = Array.isArray(rutasResp.data) ? rutasResp.data : [];
      const frecuencias = Array.isArray(frecuenciasResp.data) ? frecuenciasResp.data : [];
      const usuarios = Array.isArray(usuariosResp.data) ? usuariosResp.data : [];
      const conductores = Array.isArray(conductoresResp.data) ? conductoresResp.data : [];

      console.log('Datos cargados:', { 
        buses: buses.length, 
        rutas: rutas.length, 
        frecuencias: frecuencias.length,
        usuarios: usuarios.length,
        conductores: conductores.length 
      });

      // Agrupar frecuencias por estado (usando estadoVerificacion)
      const estadosCount = frecuencias.reduce((acc, f) => {
        const estado = f.estadoVerificacion || f.estado || 'pendiente';
        acc[estado] = (acc[estado] || 0) + 1;
        return acc;
      }, {});

      const frecuenciasPorEstado = Object.entries(estadosCount).length > 0 
        ? Object.entries(estadosCount).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
          }))
        : [{ name: 'Sin datos', value: 1 }];

      // Frecuencias de hoy (usar fecha local Ecuador, no UTC)
      const hoyDate = new Date();
      const hoy = `${hoyDate.getFullYear()}-${String(hoyDate.getMonth() + 1).padStart(2, '0')}-${String(hoyDate.getDate()).padStart(2, '0')}`;
      const frecuenciasHoy = frecuencias.filter(f => {
        if (!f.fecha) return false;
        const fechaSalida = String(f.fecha).split('T')[0];
        return fechaSalida === hoy;
      }).length;

      // Frecuencias completadas (verificadas o usadas)
      const frecuenciasCompletadas = frecuencias.filter(f => 
        f.estadoVerificacion === 'verificado' || f.estadoVerificacion === 'usado' || f.estado === 'completada' || f.estado === 'pagado'
      ).length;

      // Tasa de ocupación (frecuencias activas vs capacidad total)
      const busesActivos = buses.filter(b => b.estado === 'activo' || b.estado === 'Activo').length;
      const frecuenciasEnCurso = frecuencias.filter(f => 
        f.estadoVerificacion === 'verificado' || f.estado === 'en_curso' || f.estado === 'activa'
      ).length;
      const tasaOcupacion = busesActivos > 0 ? 
        Math.min(100, (frecuenciasEnCurso / busesActivos) * 100) : 0;

      // Eficiencia operativa (completadas vs total)
      const eficienciaOperativa = frecuencias.length > 0 ? 
        (frecuenciasCompletadas / frecuencias.length) * 100 : 0;

      // Top conductores (más frecuencias completadas)
      const conductoresPorFrecuencia = conductores
        .map(conductor => {
          const frecuenciasCond = frecuencias.filter(f => 
            f.conductorId === conductor.id && (f.estadoVerificacion === 'verificado' || f.estadoVerificacion === 'usado' || f.estado === 'completada' || f.estado === 'pagado')
          ).length;
          return {
            id: conductor.id,
            nombre: conductor.nombre || 'Sin nombre',
            apellido: '',
            frecuencias: frecuenciasCond,
            estado: conductor.estado
          };
        })
        .filter(c => c.frecuencias > 0 || conductores.length <= 5)
        .sort((a, b) => b.frecuencias - a.frecuencias)
        .slice(0, 5);

      // Alertas del sistema
      const alertas = [];
      const busesInactivos = buses.filter(b => b.estado === 'inactivo' || b.estado === 'Inactivo').length;
      if (busesInactivos > 0) {
        alertas.push({
          tipo: 'warning',
          mensaje: `${busesInactivos} bus(es) inactivo(s)`,
          icono: Warning
        });
      }
      
      const frecuenciasPendientes = frecuencias.filter(f => f.estadoVerificacion === 'pendiente' || f.estado === 'programada').length;
      if (frecuenciasPendientes > 0) {
        alertas.push({
          tipo: 'info',
          mensaje: `${frecuenciasPendientes} frecuencia(s) pendiente(s)`,
          icono: Schedule
        });
      }

      if (eficienciaOperativa > 80 && frecuencias.length > 0) {
        alertas.push({
          tipo: 'success',
          mensaje: `Excelente eficiencia: ${eficienciaOperativa.toFixed(1)}%`,
          icono: CheckCircle
        });
      }

      if (buses.length > 0 && busesActivos === buses.length) {
        alertas.push({
          tipo: 'success',
          mensaje: `Todos los buses están activos`,
          icono: CheckCircle
        });
      }

      // Tendencia semanal (últimos 7 días)
      const tendenciaSemanal = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
        const frecuenciasDia = frecuencias.filter(f => {
          if (!f.fecha) return false;
          const fechaSalida = String(f.fecha).split('T')[0];
          return fechaSalida === fechaStr;
        }).length;
        const completadasDia = frecuencias.filter(f => {
          if (!f.fecha) return false;
          const fechaSalida = String(f.fecha).split('T')[0];
          return fechaSalida === fechaStr && (f.estadoVerificacion === 'verificado' || f.estadoVerificacion === 'usado' || f.estado === 'completada' || f.estado === 'pagado');
        }).length;
        
        tendenciaSemanal.push({
          dia: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][fecha.getDay()],
          total: frecuenciasDia,
          completadas: completadasDia
        });
      }

      // Distribución horaria (análisis de horas pico)
      const distribucionHoraria = [];
      for (let hora = 0; hora < 24; hora++) {
        const frecuenciasHora = frecuencias.filter(f => {
          if (!f.horaSalida && !f.hora_salida) return false;
          try {
            const horaSalida = f.horaSalida || f.hora_salida;
            const horaFrecuencia = parseInt(horaSalida.split(':')[0]);
            return horaFrecuencia === hora;
          } catch (e) {
            return false;
          }
        }).length;
        
        if (frecuenciasHora > 0) {
          distribucionHoraria.push({
            hora: `${hora.toString().padStart(2, '0')}:00`,
            frecuencias: frecuenciasHora
          });
        }
      }

      // Si no hay datos de distribución horaria, mostrar estructura básica
      if (distribucionHoraria.length === 0) {
        distribucionHoraria.push(
          { hora: '06:00', frecuencias: 0 },
          { hora: '12:00', frecuencias: 0 },
          { hora: '18:00', frecuencias: 0 }
        );
      }

      console.log('Estadísticas calculadas:', {
        busesActivos,
        tasaOcupacion: tasaOcupacion.toFixed(2),
        eficienciaOperativa: eficienciaOperativa.toFixed(2),
        frecuenciasHoy,
        conductoresTop: conductoresPorFrecuencia.length,
        alertas: alertas.length
      });

      setStats({
        totalBuses: buses.length,
        totalRutas: rutas.length,
        totalFrecuencias: frecuencias.length,
        totalUsuarios: usuarios.length,
        frecuenciasPorEstado,
        busesActivos,
        conductoresActivos: conductores.filter(c => c.estado === 'activo' || c.estado === 'Activo').length,
        tasaOcupacion,
        frecuenciasHoy,
        frecuenciasCompletadas,
        eficienciaOperativa,
        conductoresTop: conductoresPorFrecuencia,
        alertas,
        tendenciaSemanal,
        distribucionHoraria
      });

      console.log('Dashboard actualizado correctamente');
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      // Establecer valores por defecto en caso de error
      setStats({
        totalBuses: 0,
        totalRutas: 0,
        totalFrecuencias: 0,
        totalUsuarios: 0,
        frecuenciasPorEstado: [{ name: 'Sin datos', value: 1 }],
        busesActivos: 0,
        conductoresActivos: 0,
        tasaOcupacion: 0,
        frecuenciasHoy: 0,
        frecuenciasCompletadas: 0,
        eficienciaOperativa: 0,
        conductoresTop: [],
        alertas: [{
          tipo: 'warning',
          mensaje: 'Error al cargar datos. Verifica la conexión.',
          icono: Warning
        }],
        tendenciaSemanal: Array(7).fill(null).map((_, i) => ({
          dia: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][(new Date().getDay() - 6 + i + 7) % 7],
          total: 0,
          completadas: 0
        })),
        distribucionHoraria: [
          { hora: '06:00', frecuencias: 0 },
          { hora: '12:00', frecuencias: 0 },
          { hora: '18:00', frecuencias: 0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        sx={{ backgroundColor: '#f5f7fa' }}
      >
        <CircularProgress size={50} thickness={4} sx={{ color: '#667eea' }} />
        <Typography variant="body1" color="text.secondary" mt={2} fontWeight={500}>
          Cargando datos del dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa', py: 3, px: { xs: 2, md: 3, lg: 4 }, display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ maxWidth: 1400, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="700" sx={{ color: '#1e293b', mb: 0.5 }}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Vista general del sistema de gestión de rutas
            </Typography>
          </Box>
          <IconButton 
            onClick={cargarDatos}
            sx={{ 
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': { 
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s'
              } 
            }}
          >
            <Refresh sx={{ color: 'primary.main' }} />
          </IconButton>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={5} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                      Total Buses
                    </Typography>
                    <Typography variant="h3" fontWeight="700" sx={{ mb: 0.5 }}>
                      {stats.totalBuses}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {stats.busesActivos} activos
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'primary.main', 
                      color: 'white',
                      borderRadius: 2, 
                      p: 1.5
                    }}
                  >
                    <DirectionsBus fontSize="large" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                      Tasa de Ocupación
                    </Typography>
                    <Typography variant="h3" fontWeight="700" sx={{ mb: 0.5 }}>
                      {stats.tasaOcupacion.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Eficiencia en uso
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'success.main', 
                      color: 'white',
                      borderRadius: 2, 
                      p: 1.5
                    }}
                  >
                    <Speed fontSize="large" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                      Frecuencias Hoy
                    </Typography>
                    <Typography variant="h3" fontWeight="700" sx={{ mb: 0.5 }}>
                      {stats.frecuenciasHoy}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Del total: {stats.totalFrecuencias}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'warning.main', 
                      color: 'white',
                      borderRadius: 2, 
                      p: 1.5
                    }}
                  >
                    <AccessTime fontSize="large" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={0}
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                      Eficiencia Operativa
                    </Typography>
                    <Typography variant="h3" fontWeight="700" sx={{ mb: 0.5 }}>
                      {stats.eficienciaOperativa.toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {stats.frecuenciasCompletadas} completadas
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      backgroundColor: 'info.main', 
                      color: 'white',
                      borderRadius: 2, 
                      p: 1.5
                    }}
                  >
                    <Analytics fontSize="large" />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Segunda Fila - Estado del Sistema y Top 5 Conductores PRIMERO */}
        <Grid container spacing={3} mb={5} justifyContent="center">

          <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' }, maxWidth: { xs: '100%', md: '45%' }, flexBasis: { xs: '100%', md: '45%' } }}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                minHeight: 320,
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'warning.light',
                      borderRadius: 1.5,
                      p: 1,
                      mr: 1.5
                    }}
                  >
                    <Warning sx={{ color: 'warning.main', fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                    Estado del Sistema
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {stats.alertas.length > 0 ? (
                  <Box>
                    {stats.alertas.map((alerta, index) => {
                      const IconoAlerta = alerta.icono;
                      return (
                        <Chip
                          key={index}
                          icon={<IconoAlerta />}
                          label={alerta.mensaje}
                          color={
                            alerta.tipo === 'success' ? 'success' :
                            alerta.tipo === 'warning' ? 'warning' : 'info'
                          }
                          sx={{ 
                            mb: 1.5, 
                            width: '100%', 
                            justifyContent: 'flex-start',
                            height: 'auto',
                            py: 1.5,
                            px: 1.5,
                            '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'left' }
                          }}
                        />
                      );
                    })}
                    <Box mt={2} p={2} sx={{ backgroundColor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Conductores Activos
                        </Typography>
                        <Chip label={stats.conductoresActivos} size="small" color="success" />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Rutas Activas
                        </Typography>
                        <Chip label={stats.totalRutas} size="small" color="primary" />
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sin alertas en este momento
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' }, maxWidth: { xs: '100%', md: '45%' }, flexBasis: { xs: '100%', md: '45%' } }}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                minHeight: 320,
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'warning.light',
                      borderRadius: 1.5,
                      p: 1,
                      mr: 1.5
                    }}
                  >
                    <EmojiEvents sx={{ color: 'warning.main', fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                    Top 5 Conductores
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List sx={{ maxHeight: 240, overflow: 'auto', p: 0 }}>
                  {stats.conductoresTop.length > 0 ? stats.conductoresTop.map((conductor, index) => (
                    <ListItem 
                      key={conductor.id}
                      sx={{ 
                        backgroundColor: index < 3 ? 'grey.50' : 'transparent',
                        borderRadius: 1.5,
                        mb: 1,
                        border: index < 3 ? '1px solid' : 'none',
                        borderColor: 'grey.200',
                        p: 1.5
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={index + 1}
                          color={index === 0 ? 'warning' : index === 1 ? 'default' : 'primary'}
                          sx={{
                            '& .MuiBadge-badge': {
                              fontWeight: 'bold',
                              fontSize: '0.7rem'
                            }
                          }}
                        >
                          <Avatar sx={{ 
                            backgroundColor: index === 0 ? 'warning.main' : 
                                           index === 1 ? 'grey.400' : 
                                           index === 2 ? '#CD7F32' : 'primary.main',
                            width: 40,
                            height: 40,
                            fontWeight: 'bold',
                            fontSize: '0.95rem'
                          }}>
                            {conductor.nombre.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography fontWeight={index < 3 ? '600' : '500'} sx={{ fontSize: '0.9rem' }}>
                            {conductor.nombre}
                          </Typography>
                        }
                        secondary={
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Chip 
                              label={`${conductor.frecuencias} viajes`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                            {index === 0 && <Star sx={{ color: 'warning.main', fontSize: 16 }} />}
                          </Box>
                        }
                      />
                    </ListItem>
                  )) : (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                      No hay conductores registrados
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* GRÁFICOS PRINCIPALES - EXACTAMENTE 2 POR FILA */}
        <Grid container spacing={3} mb={5} justifyContent="center">
        
          {/* Gráfico 1: Estados de Frecuencias */}
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' }, maxWidth: { xs: '100%', md: '45%' }, flexBasis: { xs: '100%', md: '45%' } }}>
            <Card 
              elevation={0} 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'primary.light',
                      borderRadius: 1.5,
                      p: 1,
                      mr: 1.5
                    }}
                  >
                    <Analytics sx={{ color: 'primary.main', fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                    Estados de Frecuencias
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={stats.frecuenciasPorEstado}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={130}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.frecuenciasPorEstado.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico 2: Tendencia */}
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' }, maxWidth: { xs: '100%', md: '45%' }, flexBasis: { xs: '100%', md: '45%' } }}>
            <Card 
              elevation={0}
              sx={{ 
                height: '100%',
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box 
                    sx={{ 
                      backgroundColor: 'success.light',
                      borderRadius: 1.5,
                      p: 1,
                      mr: 1.5
                    }}
                  >
                    <TrendingUp sx={{ color: 'success.main', fontSize: 22 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                    Tendencia - Últimos 7 Días
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={450}>
                  <AreaChart data={stats.tendenciaSemanal}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompletadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="dia" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTotal)"
                      name="Total"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completadas" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCompletadas)"
                      name="Completadas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico 3: Distribución Horaria */}
          <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' }, maxWidth: { xs: '100%', md: '45%' }, flexBasis: { xs: '100%', md: '45%' } }}>
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center">
                    <Box 
                      sx={{ 
                        backgroundColor: 'secondary.light',
                        borderRadius: 1.5,
                        p: 1,
                        mr: 1.5
                      }}
                    >
                      <Timer sx={{ color: 'secondary.main', fontSize: 22 }} />
                    </Box>
                    <Typography variant="h6" fontWeight="600" sx={{ fontSize: '1rem' }}>
                      Distribución Horaria
                    </Typography>
                  </Box>
                  <Chip 
                    label="Horas Pico" 
                    size="small" 
                    color="primary" 
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={stats.distribucionHoraria}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="hora" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="frecuencias" fill="#9c27b0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <Box mt={2} display="flex" justifyContent="center" gap={1} flexWrap="wrap">
                  <Chip 
                    label={`${stats.totalRutas} Rutas`}
                    size="small"
                    variant="outlined"
                    color="success"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`${stats.busesActivos} Buses`}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`${stats.totalUsuarios} Users`}
                    size="small"
                    variant="outlined"
                    color="info"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
