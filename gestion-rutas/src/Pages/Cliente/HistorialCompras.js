import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  IconButton,
  TextField,
  Button
} from '@mui/material';
// TEMPORALMENTE COMENTADO - Instalar: npm install @mui/x-date-pickers date-fns
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { es } from 'date-fns/locale';
import {
  AccountBalanceWallet,
  Payment,
  Receipt,
  TrendingUp,
  ArrowBack,
  ArrowForward,
  Refresh
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { professionalColors } from '../../utils/professionalColors';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HistorialCompras = () => {
  const { user } = useAuth();
  const [compras, setCompras] = useState([]);
  const [recargasConductores, setRecargasConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaCompras, setPaginaCompras] = useState(0);
  const [paginaRecargas, setPaginaRecargas] = useState(0);
  const registrosPorPagina = 6;
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [estadisticas, setEstadisticas] = useState({
    totalComprado: 0,
    totalTransacciones: 0,
    ultimaCompra: null
  });
  const [estadisticasConductores, setEstadisticasConductores] = useState({
    totalRecargado: 0,
    totalRecargas: 0,
    ultimaRecarga: null
  });

  useEffect(() => {
    cargarCompras();
  }, []);

  useEffect(() => {
    // Recalcular estadísticas cuando cambia el filtro
    calcularEstadisticas();
    setPaginaCompras(0);
    setPaginaRecargas(0);
  }, [fechaSeleccionada, compras, recargasConductores]);

  const filtrarPorMes = (datos) => {
    if (!fechaSeleccionada) return datos;
    
    return datos.filter(item => {
      const fecha = new Date(item.fecha || item.createdAt);
      return fecha.getMonth() === fechaSeleccionada.getMonth() && 
             fecha.getFullYear() === fechaSeleccionada.getFullYear();
    });
  };

  const calcularEstadisticas = () => {
    const comprasFiltradas = filtrarPorMes(compras);
    const recargasFiltradas = filtrarPorMes(recargasConductores);

    // Solo contar aprobadas en el total comprado
    const soloAprobadas = comprasFiltradas.filter(t => t.estado === 'aprobada');
    const total = soloAprobadas.reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);
    const ultima = soloAprobadas.length > 0 ? soloAprobadas[0] : null;

    setEstadisticas({
      totalComprado: total,
      totalTransacciones: comprasFiltradas.length,
      ultimaCompra: ultima
    });

    // Estadísticas de recargas de conductores
    const totalRecargas = recargasFiltradas.reduce((sum, r) => sum + parseFloat(r.monto || 0), 0);
    const ultimaRecarga = recargasFiltradas.length > 0 ? recargasFiltradas[0] : null;

    setEstadisticasConductores({
      totalRecargado: totalRecargas,
      totalRecargas: recargasFiltradas.length,
      ultimaRecarga: ultimaRecarga
    });
  };

  const cargarCompras = async () => {
    try {
      setLoading(true);
      
      // Primero obtener el cliente del usuario
      const clienteResponse = await axios.get(`${API_URL}/api/clientes/user/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const cliente = clienteResponse.data;
      
      // Obtener las transacciones de compra del cliente
      const responseCompras = await axios.get(`${API_URL}/api/clientes/${cliente.id}/transacciones-compra`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const transacciones = responseCompras.data;
      setCompras(transacciones);

      // Obtener las recargas de los conductores
      const responseRecargas = await axios.get(`${API_URL}/api/clientes/${cliente.id}/recargas-conductores`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const recargas = responseRecargas.data;
      setRecargasConductores(recargas);
    } catch (error) {
      console.error('Error al cargar compras:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorMetodo = (metodo) => {
    const colores = {
      efectivo: 'success',
      transferencia: 'info',
      deposito: 'warning',
      tarjeta: 'primary'
    };
    return colores[metodo] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Receipt />
            Historial de Compras de Saldo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Todas tus compras de saldo realizadas
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={cargarCompras}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Filtros de Mes y Año */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filtrar por Período
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* TEMPORALMENTE DESHABILITADO - DatePicker requiere instalar @mui/x-date-pickers */}
          <TextField
            label="Mes y Año"
            type="month"
            value={fechaSeleccionada ? new Date(fechaSeleccionada).toISOString().slice(0, 7) : ''}
            onChange={(e) => setFechaSeleccionada(new Date(e.target.value))}
            sx={{ minWidth: 250 }}
            InputLabelProps={{ shrink: true }}
          />
          <Button 
            variant="outlined"
            onClick={() => setFechaSeleccionada(new Date())}
            sx={{ 
              color: professionalColors.primary[500],
              borderColor: professionalColors.primary[500],
              '&:hover': {
                borderColor: professionalColors.primary[600],
                bgcolor: professionalColors.primary[50]
              }
            }}
          >
            Mes Actual
          </Button>
        </Box>
      </Paper>

      {/* Tarjetas de Estadísticas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        <Card sx={{ 
          bgcolor: professionalColors.surface, 
          boxShadow: 2, 
          minHeight: 140, 
          flex: '0 0 calc(31% - 16px)', 
          minWidth: 280, 
          maxWidth: 'calc(31% - 16px)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <Avatar sx={{ bgcolor: professionalColors.primary[500], mr: 2 }}>
                <AccountBalanceWallet />
              </Avatar>
              <Typography variant="h6" sx={{ color: professionalColors.text.secondary }}>
                Total Comprado
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color={professionalColors.text.primary}>
              ${estadisticas.totalComprado.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          bgcolor: professionalColors.surface, 
          boxShadow: 2, 
          minHeight: 140, 
          flex: '0 0 calc(31% - 16px)', 
          minWidth: 280, 
          maxWidth: 'calc(31% - 16px)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <Avatar sx={{ bgcolor: professionalColors.secondary[500], mr: 2 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h6" sx={{ color: professionalColors.text.secondary }}>
                Transacciones
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color={professionalColors.text.primary}>
              {estadisticas.totalTransacciones}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          bgcolor: professionalColors.surface, 
          boxShadow: 2, 
          minHeight: 140, 
          flex: '0 0 calc(31% - 16px)', 
          minWidth: 280, 
          maxWidth: 'calc(31% - 16px)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <Avatar sx={{ bgcolor: professionalColors.success[500], mr: 2 }}>
                <Payment />
              </Avatar>
              <Typography variant="h6" sx={{ color: professionalColors.text.secondary }}>
                Última Compra
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" color={professionalColors.text.primary}>
              {estadisticas.ultimaCompra ? 
                `$${parseFloat(estadisticas.ultimaCompra.monto).toFixed(2)}` : 
                'N/A'
              }
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tabla de Compras */}
      <Paper elevation={3} sx={{ mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Mis Compras de Saldo
          </Typography>

          {filtrarPorMes(compras).length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No hay compras de saldo para el período seleccionado.
            </Alert>
          ) : (
            <>
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: professionalColors.neutral[100] }}>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Monto</strong></TableCell>
                      <TableCell><strong>Método de Pago</strong></TableCell>
                      <TableCell><strong>Descripción</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtrarPorMes(compras)
                      .slice(paginaCompras * registrosPorPagina, (paginaCompras + 1) * registrosPorPagina)
                      .map((compra) => (
                      <TableRow key={compra.id} hover>
                        <TableCell>{formatearFecha(compra.fecha)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ${parseFloat(compra.monto).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={compra.metodoPago || 'N/A'} 
                            color={obtenerColorMetodo(compra.metodoPago)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                            {compra.descripcion || 'Sin descripción'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={
                              compra.estado === 'aprobada' ? 'Aprobada' :
                              compra.estado === 'pendiente' ? 'Pendiente' :
                              compra.estado === 'rechazada' ? 'Rechazada' : 'Completado'
                            } 
                            color={
                              compra.estado === 'aprobada' ? 'success' :
                              compra.estado === 'pendiente' ? 'warning' :
                              compra.estado === 'rechazada' ? 'error' : 'default'
                            }
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Controles de Paginación */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                <IconButton 
                  onClick={() => setPaginaCompras(prev => Math.max(0, prev - 1))}
                  disabled={paginaCompras === 0}
                  sx={{ 
                    bgcolor: professionalColors.primary[500],
                    color: 'white',
                    '&:hover': { bgcolor: professionalColors.primary[600] },
                    '&:disabled': { bgcolor: professionalColors.neutral[300] }
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="body2">
                  Página {paginaCompras + 1} de {Math.max(1, Math.ceil(filtrarPorMes(compras).length / registrosPorPagina))}
                </Typography>
                <IconButton 
                  onClick={() => setPaginaCompras(prev => Math.min(Math.ceil(filtrarPorMes(compras).length / registrosPorPagina) - 1, prev + 1))}
                  disabled={paginaCompras >= Math.ceil(filtrarPorMes(compras).length / registrosPorPagina) - 1}
                  sx={{ 
                    bgcolor: professionalColors.primary[500],
                    color: 'white',
                    '&:hover': { bgcolor: professionalColors.primary[600] },
                    '&:disabled': { bgcolor: professionalColors.neutral[300] }
                  }}
                >
                  <ArrowForward />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Tabla de Recargas de Conductores */}
      <Paper elevation={3}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet fontSize="small" />
            Recargas de Mis Conductores
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Recargas realizadas por tus conductores en los buses
          </Typography>

          {filtrarPorMes(recargasConductores).length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No hay recargas de conductores para el período seleccionado.
            </Alert>
          ) : (
            <>
              <TableContainer sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: professionalColors.neutral[100] }}>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Conductor</strong></TableCell>
                      <TableCell><strong>Cédula</strong></TableCell>
                      <TableCell><strong>Monto</strong></TableCell>
                      <TableCell><strong>Método de Pago</strong></TableCell>
                      <TableCell><strong>Descripción</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtrarPorMes(recargasConductores)
                      .slice(paginaRecargas * registrosPorPagina, (paginaRecargas + 1) * registrosPorPagina)
                      .map((recarga) => (
                      <TableRow key={recarga.id} hover>
                        <TableCell>{formatearFecha(recarga.fecha)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {recarga.conductorNombre}
                          </Typography>
                        </TableCell>
                        <TableCell>{recarga.conductorCedula}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ${parseFloat(recarga.monto).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={recarga.metodoPago || 'N/A'} 
                            color={obtenerColorMetodo(recarga.metodoPago)}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {recarga.descripcion || 'Sin descripción'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={recarga.estado || 'Completado'} 
                            color="success"
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Controles de Paginación */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
                <IconButton 
                  onClick={() => setPaginaRecargas(prev => Math.max(0, prev - 1))}
                  disabled={paginaRecargas === 0}
                  sx={{ 
                    bgcolor: professionalColors.primary[500],
                    color: 'white',
                    '&:hover': { bgcolor: professionalColors.primary[600] },
                    '&:disabled': { bgcolor: professionalColors.neutral[300] }
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="body2">
                  Página {paginaRecargas + 1} de {Math.max(1, Math.ceil(filtrarPorMes(recargasConductores).length / registrosPorPagina))}
                </Typography>
                <IconButton 
                  onClick={() => setPaginaRecargas(prev => Math.min(Math.ceil(filtrarPorMes(recargasConductores).length / registrosPorPagina) - 1, prev + 1))}
                  disabled={paginaRecargas >= Math.ceil(filtrarPorMes(recargasConductores).length / registrosPorPagina) - 1}
                  sx={{ 
                    bgcolor: professionalColors.primary[500],
                    color: 'white',
                    '&:hover': { bgcolor: professionalColors.primary[600] },
                    '&:disabled': { bgcolor: professionalColors.neutral[300] }
                  }}
                >
                  <ArrowForward />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default HistorialCompras;
