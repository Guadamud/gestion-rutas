import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  useMediaQuery,
  Collapse,
  Menu,
  MenuItem
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Logout as LogoutIcon,
  DirectionsBusFilled as DirectionsBusFilledIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  Route as RouteIcon,
  DirectionsBus as BusIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  ExpandLess,
  ExpandMore,
  Dashboard as DashboardIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  BarChart as BarChartIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import { professionalColors } from '../utils/professionalColors';
import logoUleam from '../assets/LOGO-ULEAM.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Redirección principal según rol
  const getMainRoute = () => {
    if (!user) return "/";
    switch (user.rol) {
      case "admin":
        return "/admin";
      case "tesoreria":
        return "/tesoreria";
      case "cliente":
        return "/clientes";
      case "conductor":
        return "/conductor";
      case "verificador":
        return "/verificador";
      default:
        return "/dashboard";
    }
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const openProfileMenu = Boolean(anchorEl);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAdminMenuToggle = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleGoToProfile = () => {
    handleProfileMenuClose();
    navigate('/perfil');
  };

  const handleLogoutFromMenu = () => {
    handleProfileMenuClose();
    handleLogout();
  };

  const getInitials = (nombres, apellidos) => {
    const firstInitial = nombres ? nombres.charAt(0).toUpperCase() : '';
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, route: '/admin' },
    { text: 'Frecuencias', icon: <ScheduleIcon />, route: '/frecuencias-admin' },
    { text: 'Rutas', icon: <RouteIcon />, route: '/rutas-admin' },
    { text: 'Buses', icon: <BusIcon />, route: '/buses-admin' },
    { text: 'Conductores', icon: <PersonIcon />, route: '/conductores-admin' },
    { text: 'Usuarios', icon: <PeopleIcon />, route: '/usuarios-admin' },
    { text: 'Cooperativas', icon: <DirectionsBusFilledIcon />, route: '/cooperativas-admin' },
    { text: 'Tesorería', icon: <AccountBalanceIcon />, route: '/tesoreria' },
    { text: 'Límites por Bus', icon: <BarChartIcon />, route: '/limites-ruta-bus-admin' },
    { text: 'Verificador', icon: <QrCodeScannerIcon />, route: '/verificador' },
    { text: 'Clave Cierre Caja', icon: <KeyIcon />, route: '/clave-autorizacion' },
    { text: 'Configuración', icon: <SettingsIcon />, route: '/configuracion-admin' },
  ];

  const drawer = (
    <Box sx={{ width: 280, pt: 2 }}>
      {/* Header del drawer */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <DirectionsBusFilledIcon sx={{ color: professionalColors.primary[500], fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: professionalColors.text.primary }}>
            Gestión Rutas
          </Typography>
        </Box>
        
        {user && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            bgcolor: professionalColors.background.secondary,
            borderRadius: 2
          }}>
            <Avatar
              sx={{
                bgcolor: professionalColors.primary[500],
                width: 40,
                height: 40,
                fontSize: '0.875rem'
              }}
            >
              {getInitials(user.nombres, user.apellidos)}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  color: professionalColors.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user.nombres} {user.apellidos}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: professionalColors.text.secondary,
                  textTransform: 'capitalize'
                }}
              >
                {user.rol === 'cliente' ? 'Dueño de Bus' : 
                 user.rol === 'conductor' ? 'Conductor' : 
                 user.rol === 'verificador' ? 'Verificador' : 
                 user.rol}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        {/* Botón Inicio — siempre visible para usuarios autenticados */}
        {user && (
          <ListItemButton
            component={Link}
            to={getMainRoute()}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Inicio" />
          </ListItemButton>
        )}

        {/* Menú de administrador */}
        {user?.rol === 'admin' && (
          <>
            <ListItemButton onClick={handleAdminMenuToggle} sx={{ borderRadius: 2, mb: 1 }}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Administración" />
              {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            
            <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {adminMenuItems.map((item) => (
                  <ListItemButton
                    key={item.text}
                    component={Link}
                    to={item.route}
                    onClick={() => setMobileOpen(false)}
                    sx={{ 
                      pl: 4, 
                      borderRadius: 2, 
                      mx: 1, 
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: professionalColors.background.secondary
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}

        {/* Menú de tesorería */}
        {user?.rol === 'tesoreria' && (
          <>
            <ListItemButton
              component={Link}
              to="/tesoreria"
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemIcon>
                <AccountBalanceIcon />
              </ListItemIcon>
              <ListItemText primary="Tesorería" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/verificador"
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemIcon>
                <QrCodeScannerIcon />
              </ListItemIcon>
              <ListItemText primary="Verificar Tickets" />
            </ListItemButton>
          </>
        )}

        {/* Menú de cliente */}
        {user?.rol === 'cliente' && (
          <>
            <ListItemButton
              component={Link}
              to="/clientes"
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemIcon>
                <ScheduleIcon />
              </ListItemIcon>
              <ListItemText primary="Mis Frecuencias" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              to="/historial-compras"
              onClick={() => setMobileOpen(false)}
              sx={{ borderRadius: 2, mb: 1 }}
            >
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="Historial de Compras" />
            </ListItemButton>
          </>
        )}

        {/* Menú de conductor */}
        {user?.rol === 'conductor' && (
          <ListItemButton
            component={Link}
            to="/conductor"
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText primary="Mis Frecuencias" />
          </ListItemButton>
        )}

        {/* Menú de verificador */}
        {user?.rol === 'verificador' && (
          <ListItemButton
            component={Link}
            to="/verificador"
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 1 }}
          >
            <ListItemIcon>
              <QrCodeScannerIcon />
            </ListItemIcon>
            <ListItemText primary="Verificar Tickets" />
          </ListItemButton>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Perfil y logout */}
        {user && (
          <>
            <ListItemButton
              component={Link}
              to="/perfil"
              onClick={() => setMobileOpen(false)}
              sx={{ 
                borderRadius: 2,
                mb: 1
              }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configuración" />
            </ListItemButton>
            <ListItemButton
              onClick={handleLogout}
              sx={{ 
                borderRadius: 2,
                color: theme.palette.error.main,
                '&:hover': {
                  bgcolor: theme.palette.error.light + '10'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItemButton>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={2}
        sx={{ 
          backgroundColor: professionalColors.neutral[800],
          borderBottom: `1px solid ${professionalColors.neutral[700]}`,
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="abrir menú"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo y título */}
          <Box display="flex" alignItems="center" gap={2} sx={{ flexGrow: isMobile ? 1 : 0 }}>
            <DirectionsBusFilledIcon sx={{ color: professionalColors.neutral[200] }} />
            <Typography 
              variant="h6"
              component={Link}
              to={getMainRoute()}
              sx={{ 
                color: professionalColors.neutral[200], 
                textDecoration: 'none',
                fontWeight: 600,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              Gestión Rutas
            </Typography>
          </Box>

          {/* Desktop navigation */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', ml: 4, gap: 0.5 }}>
              {user?.rol === 'admin' && (
                <>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/admin"
                  >
                    Inicio
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/dashboard"
                  >
                    Dashboard
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/frecuencias-admin"
                  >
                    Frecuencias
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/rutas-admin"
                  >
                    Rutas
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/buses-admin"
                  >
                    Buses
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/conductores-admin"
                  >
                    Conductores
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/usuarios-admin"
                  >
                    Usuarios
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/cooperativas-admin"
                  >
                    Cooperativas
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      px: 1.5
                    }} 
                    component={Link} 
                    to="/tesoreria"
                  >
                    Tesorería
                  </Button>
                </>
              )}

              {user?.rol === 'tesoreria' && (
                <Button 
                  sx={{ 
                    color: professionalColors.neutral[300], 
                    '&:hover': { 
                      backgroundColor: professionalColors.neutral[700], 
                      color: professionalColors.neutral[100] 
                    },
                    textTransform: 'none',
                    fontWeight: 500
                  }} 
                  component={Link} 
                  to="/tesoreria"
                >
                  Tesorería
                </Button>
              )}

              {user?.rol === 'cliente' && (
                <>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500
                    }} 
                    component={Link} 
                    to="/clientes"
                  >
                    Mis Frecuencias
                  </Button>
                  <Button 
                    sx={{ 
                      color: professionalColors.neutral[300], 
                      '&:hover': { 
                        backgroundColor: professionalColors.neutral[700], 
                        color: professionalColors.neutral[100] 
                      },
                      textTransform: 'none',
                      fontWeight: 500
                    }} 
                    component={Link} 
                    to="/historial-compras"
                  >
                    Mis Compras
                  </Button>
                </>
              )}

              {user?.rol === 'conductor' && (
                <Button 
                  sx={{ 
                    color: professionalColors.neutral[300], 
                    '&:hover': { 
                      backgroundColor: professionalColors.neutral[700], 
                      color: professionalColors.neutral[100] 
                    },
                    textTransform: 'none',
                    fontWeight: 500
                  }} 
                  component={Link} 
                  to="/conductor"
                >
                  Mis Frecuencias
                </Button>
              )}
            </Box>
          )}

          {/* User info and logout - Desktop */}
          {!isMobile && user && (
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{ 
                  color: professionalColors.neutral[200],
                  '&:hover': { 
                    backgroundColor: professionalColors.neutral[700] 
                  },
                  p: 0.5
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar
                    sx={{
                      bgcolor: professionalColors.primary[500],
                      width: 32,
                      height: 32,
                      fontSize: '0.75rem'
                    }}
                  >
                    {getInitials(user.nombres, user.apellidos)}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: professionalColors.neutral[200], 
                        fontWeight: 500,
                        lineHeight: 1,
                        textAlign: 'left'
                      }}
                    >
                      {user.nombres}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: professionalColors.neutral[400],
                        textTransform: 'capitalize',
                        lineHeight: 1
                      }}
                    >
                      {user.rol === 'cliente' ? 'Dueño de Bus' : user.rol === 'conductor' ? 'Conductor' : user.rol}
                    </Typography>
                  </Box>
                </Box>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={openProfileMenu}
                onClose={handleProfileMenuClose}
                onClick={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1.5
                    }
                  }
                }}
              >
                <MenuItem onClick={handleGoToProfile}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Configuración</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogoutFromMenu} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText>Cerrar Sesión</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}

          {/* Logo ULEAM en la esquina derecha */}
          <Box sx={{ ml: { xs: 1, md: 2 } }}>
            <img 
              src={logoUleam} 
              alt="Logo ULEAM" 
              style={{ 
                height: isMobile ? '50px' : '70px', 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            backgroundColor: professionalColors.background.paper,
            borderRight: `1px solid ${professionalColors.border.light}`
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
