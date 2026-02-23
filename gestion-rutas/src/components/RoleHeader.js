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
        p: 3,
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {config.icon}
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight={700}>
              {titulo || 'Panel de ' + config.label}
            </Typography>
            <Chip
              label={config.label.toUpperCase()}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.95 }}>
            {subtitulo || config.descripcion}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RoleHeader;
