import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  PhoneAndroid,
  Tablet,
  Computer,
  ExpandMore,
  ExpandLess,
  Visibility,
  TouchApp,
  Speed,
  NetworkCheck
} from '@mui/icons-material';

const DeviceInfo = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});

  // Detectar tipo de dispositivo
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    // Obtener información del dispositivo
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
      connection: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
    setDeviceInfo(info);

    // Listener para cambios de orientación
    const handleOrientationChange = () => {
      setDeviceInfo(prev => ({
        ...prev,
        orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }));
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const getDeviceIcon = () => {
    if (isMobile) return <PhoneAndroid color="primary" />;
    if (isTablet) return <Tablet color="secondary" />;
    if (isDesktop) return <Computer color="action" />;
    return <Computer color="action" />;
  };

  const getDeviceType = () => {
    if (isMobile) return { type: 'Móvil', color: 'primary' };
    if (isTablet) return { type: 'Tablet', color: 'secondary' };
    if (isDesktop) return { type: 'Escritorio', color: 'default' };
    return { type: 'Desconocido', color: 'default' };
  };

  const deviceType = getDeviceType();

  return (
    <Paper 
      elevation={1}
      sx={{ 
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        borderRadius: 2,
        overflow: 'hidden',
        maxWidth: { xs: '90vw', sm: 320 },
        display: process.env.NODE_ENV === 'development' ? 'block' : 'none' // Solo en desarrollo
      }}
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {getDeviceIcon()}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" fontWeight="600">
            Información del Dispositivo
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {deviceInfo.viewportWidth}x{deviceInfo.viewportHeight}px
          </Typography>
        </Box>
        <Chip 
          label={deviceType.type} 
          color={deviceType.color} 
          size="small" 
          variant="outlined"
        />
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2, pt: 1 }}>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Visibility fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Viewport"
                secondary={`${deviceInfo.viewportWidth} × ${deviceInfo.viewportHeight}px`}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Computer fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Pantalla"
                secondary={`${deviceInfo.screenWidth} × ${deviceInfo.screenHeight}px`}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <TouchApp fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Touch"
                secondary={deviceInfo.touchSupport ? 'Soportado' : 'No soportado'}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Speed fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Pixel Ratio"
                secondary={`${deviceInfo.pixelRatio}x`}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <NetworkCheck fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Conexión"
                secondary={deviceInfo.connection || 'Desconocida'}
                primaryTypographyProps={{ variant: 'caption', fontWeight: 500 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 1 }} />

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            <strong>Orientación:</strong> {deviceInfo.orientation}<br/>
            <strong>Idioma:</strong> {deviceInfo.language}<br/>
            <strong>En línea:</strong> {deviceInfo.onLine ? 'Sí' : 'No'}
          </Typography>

          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={`MUI: ${isMobile ? 'xs' : isTablet ? 'md' : 'lg'}+`}
              size="small"
              variant="outlined"
              color="primary"
            />
            {deviceInfo.touchSupport && (
              <Chip
                label="Touch"
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
            {deviceInfo.pixelRatio > 1 && (
              <Chip
                label="HD"
                size="small"
                variant="outlined"
                color="success"
              />
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DeviceInfo;
