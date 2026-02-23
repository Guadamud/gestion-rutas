import React from 'react';
import RoleHeader from '../../components/RoleHeader';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip
} from '@mui/material';
import {
  Route as RouteIcon,
  DirectionsBus,
  People,
  Assessment,
  Dashboard,
  MonetizationOn,
  Business,
  Settings,
  DeleteSweep,
  VpnKey
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const actions = [
  {
    label: 'Panel de Dashboard',
    description: 'Visualiza métricas y estadísticas del sistema',
    icon: <Dashboard fontSize="large" />,
    route: '/dashboard',
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    priority: 'high'
  },
  {
    label: 'Gestión de Usuarios',
    description: 'Administra usuarios y permisos del sistema',
    icon: <People fontSize="large" />,
    route: '/usuarios-admin',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    priority: 'high'
  },
  {
    label: 'Gestión de Buses',
    description: 'Administra la flota de buses y vehículos',
    icon: <DirectionsBus fontSize="large" />,
    route: '/buses-admin',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    priority: 'medium'
  },
  {
    label: 'Gestión de Cooperativas',
    description: 'Administra cooperativas de transporte',
    icon: <Business fontSize="large" />,
    route: '/cooperativas-admin',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    priority: 'medium'
  },
  {
    label: 'Gestión de Rutas',
    description: 'Define y administra las rutas del sistema',
    icon: <RouteIcon fontSize="large" />,
    route: '/rutas-admin',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    priority: 'medium'
  },
  {
    label: 'Límites de Rutas por Bus',
    description: 'Configura cuántas veces cada bus puede hacer una ruta al día',
    icon: <Settings fontSize="large" />,
    route: '/limites-ruta-bus-admin',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.1)',
    priority: 'medium'
  },
  {
    label: 'Gestión de Frecuencias',
    description: 'Administra horarios y frecuencias de viajes',
    icon: <Assessment fontSize="large" />,
    route: '/frecuencias-admin',
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    priority: 'medium'
  },
  {
    label: 'Gestión de Conductores',
    description: 'Administra conductores y sus licencias',
    icon: <People fontSize="large" />,
    route: '/conductores-admin',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    priority: 'medium'
  },
  {
    label: 'Clave de Cierre de Caja',
    description: 'Gestiona la clave para autorizar cierres de caja',
    icon: <VpnKey fontSize="large" />,
    route: '/clave-autorizacion',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    priority: 'high'
  },
  {
    label: 'Revisión de Tesorería',
    description: 'Supervisa ingresos y balance financiero',
    icon: <MonetizationOn fontSize="large" />,
    route: '/tesoreria',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    priority: 'low'
  },
  {
    label: 'Limpieza Anual',
    description: 'Elimina datos históricos del sistema',
    icon: <DeleteSweep fontSize="large" />,
    route: '/configuracion-admin',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.1)',
    priority: 'high'
  },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Header con rol distintivo */}
        <RoleHeader 
          rol="admin" 
          titulo="Panel del Administrador"
          subtitulo="Administra todos los recursos del sistema desde un solo lugar"
        />

        {/* Action Cards */}
        <Typography variant="h5" fontWeight="600" color="text.primary" mb={3}>
          Módulos del Sistema
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {actions.map(({ label, description, icon, route, color, bgColor, priority }) => (
            <Card
              key={label}
              elevation={1}
              sx={{
                width: 320,
                height: 280,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                border: '1px solid',
                borderColor: 'grey.200',
                '@media (max-width: 768px)': {
                  width: '100%',
                },
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  borderColor: color
                },
              }}
            >
                <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', minHeight: 180 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box
                      sx={{
                        backgroundColor: bgColor,
                        borderRadius: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        color: color,
                        width: 48,
                        height: 48,
                        justifyContent: 'center'
                      }}
                    >
                      {icon}
                    </Box>
                    <Chip 
                      label={priority} 
                      size="small" 
                      color={getPriorityColor(priority)}
                      variant="outlined"
                      sx={{ minWidth: 70 }}
                    />
                  </Box>
                  
                  <Typography variant="h6" fontWeight="600" color="text.primary" gutterBottom sx={{ minHeight: 32 }}>
                    {label}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, flexGrow: 1, minHeight: 40 }}>
                    {description}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(route)}
                    sx={{ 
                      backgroundColor: color,
                      '&:hover': {
                        backgroundColor: color,
                        filter: 'brightness(0.9)'
                      },
                      borderRadius: 2,
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Acceder
                  </Button>
                </CardActions>
              </Card>
          ))}
        </Box>

        {/* Footer */}
        <Box mt={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Sistema de Gestión de Rutas - Terminal Terrestre de Paján
          </Typography>
          <Typography variant="caption" color="text.secondary">
            &copy; {new Date().getFullYear()} Todos los derechos reservados
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminPage;
