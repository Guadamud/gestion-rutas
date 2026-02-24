import React from 'react';
import { Box, Typography, Paper, Chip, useTheme } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  AccountBalance as TesoreriaIcon,
  VerifiedUser as VerificadorIcon,
  Person as ClienteIcon,
  DirectionsBus as ConductorIcon,
} from '@mui/icons-material';

const RoleHeader = ({ rol, titulo, subtitulo }) => {
  const theme = useTheme();

  const roleConfig = {
    admin: {
      icon: <AdminIcon sx={{ fontSize: 50 }} />,
      label: 'Administrador',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      descripcion: 'Control total del sistema',
    },
    tesoreria: {
      icon: <TesoreriaIcon sx={{ fontSize: 50 }} />,
      label: 'Tesorería',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      descripcion: 'Gestión financiera y cierres de caja',
    },
    verificador: {
      icon: <VerificadorIcon sx={{ fontSize: 50 }} />,
      label: 'Verificador',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      descripcion: 'Verificación y control de frecuencias',
    },
    cliente: {
      icon: <ClienteIcon sx={{ fontSize: 50 }} />,
      label: 'Cliente',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      descripcion: 'Compra de boletos y consultas',
    },
    conductor: {
      icon: <ConductorIcon sx={{ fontSize: 50 }} />,
      label: 'Conductor',
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
      descripcion: 'Registro de frecuencias y rutas',
    },
  };

  const config = roleConfig[rol] || roleConfig.cliente;

  return (
    <Paper
      elevation={3}
      sx={{
        background: config.gradient,
        color: 'white',
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            p: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(config.icon, { sx: { fontSize: { xs: 32, sm: 50 } } })}
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: { xs: '1.2rem', sm: '1.75rem', md: '2.125rem' },
              lineHeight: 1.2,
              mb: { xs: 0.5, sm: 1 },
              wordBreak: 'break-word',
            }}
          >
            {titulo || 'Panel de ' + config.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ opacity: 0.95, fontSize: { xs: '0.8rem', sm: '1rem' } }}>
              {subtitulo || config.descripcion}
            </Typography>
            <Chip
              label={config.label.toUpperCase()}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default RoleHeader;
