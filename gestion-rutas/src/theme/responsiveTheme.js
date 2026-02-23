import { createTheme } from '@mui/material/styles';

// Tema optimizado para dispositivos móviles
export const responsiveTheme = createTheme({
  // Breakpoints personalizados
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  
  // Tipografía responsiva
  typography: {
    h1: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3rem',
      },
    },
    h2: {
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2.125rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2.5rem',
      },
    },
    h3: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2rem',
      },
    },
    h4: {
      fontSize: '1.25rem',
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.75rem',
      },
    },
    h5: {
      fontSize: '1.125rem',
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.5rem',
      },
    },
    h6: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.125rem',
      },
      '@media (min-width:960px)': {
        fontSize: '1.25rem',
      },
    },
    body1: {
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
    },
    body2: {
      fontSize: '0.8rem',
      '@media (min-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    button: {
      fontSize: '0.875rem',
      '@media (min-width:600px)': {
        fontSize: '1rem',
      },
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  
  // Componentes personalizados para móviles
  components: {
    // AppBar responsivo
    MuiAppBar: {
      styleOverrides: {
        root: {
          minHeight: '56px',
          '@media (min-width:600px)': {
            minHeight: '64px',
          },
        },
      },
    },
    
    // Toolbar responsivo
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '56px !important',
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width:600px)': {
            minHeight: '64px !important',
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
    
    // Container responsivo
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width:600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
    
    // Card responsivo
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          '@media (min-width:600px)': {
            borderRadius: '12px',
          },
        },
      },
    },
    
    // Button responsivo
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px', // Tamaño mínimo para touch targets
          borderRadius: '8px',
          '@media (min-width:600px)': {
            borderRadius: '12px',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
          '@media (max-width:599px)': {
            padding: '10px 20px',
            fontSize: '0.875rem',
          },
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: '0.875rem',
          '@media (max-width:599px)': {
            padding: '6px 12px',
            fontSize: '0.8rem',
          },
        },
      },
    },
    
    // IconButton responsivo
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: '44px',
          minHeight: '44px',
          padding: '10px',
          '@media (max-width:599px)': {
            minWidth: '40px',
            minHeight: '40px',
            padding: '8px',
          },
        },
      },
    },
    
    // TextField responsivo
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '44px',
            '@media (max-width:599px)': {
              minHeight: '40px',
            },
          },
        },
      },
    },
    
    // Dialog responsivo
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: '32px',
          '@media (max-width:599px)': {
            margin: '16px',
            borderRadius: '8px',
          },
        },
      },
    },
    
    // Drawer responsivo
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: '280px',
          '@media (max-width:599px)': {
            width: '90vw',
            maxWidth: '320px',
          },
        },
      },
    },
    
    // Typography responsivo
    MuiTypography: {
      styleOverrides: {
        h1: {
          lineHeight: 1.2,
        },
        h2: {
          lineHeight: 1.2,
        },
        h3: {
          lineHeight: 1.3,
        },
        h4: {
          lineHeight: 1.3,
        },
        h5: {
          lineHeight: 1.4,
        },
        h6: {
          lineHeight: 1.4,
        },
      },
    },
    
    // Chip responsivo
    MuiChip: {
      styleOverrides: {
        root: {
          height: 'auto',
          borderRadius: '16px',
          '& .MuiChip-label': {
            padding: '6px 12px',
            fontSize: '0.8rem',
            '@media (min-width:600px)': {
              padding: '8px 16px',
              fontSize: '0.875rem',
            },
          },
        },
      },
    },
    
    // Avatar responsivo
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: '40px',
          height: '40px',
          fontSize: '1rem',
          '@media (min-width:600px)': {
            width: '48px',
            height: '48px',
            fontSize: '1.25rem',
          },
        },
      },
    },
  },
  
  // Espaciado responsivo
  spacing: (factor) => {
    const baseSpacing = 8;
    return `${baseSpacing * factor}px`;
  },
  
  // Paleta de colores optimizada para accesibilidad móvil
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
});

// Utilidades para responsive design
export const responsiveHelpers = {
  // Funciones para breakpoints
  breakpoint: {
    up: (size) => `@media (min-width: ${responsiveTheme.breakpoints.values[size]}px)`,
    down: (size) => `@media (max-width: ${responsiveTheme.breakpoints.values[size] - 1}px)`,
    between: (start, end) => 
      `@media (min-width: ${responsiveTheme.breakpoints.values[start]}px) and (max-width: ${responsiveTheme.breakpoints.values[end] - 1}px)`,
  },
  
  // Espaciado responsivo
  spacing: {
    responsive: (xs, sm = null, md = null, lg = null) => ({
      padding: `${xs * 8}px`,
      [responsiveTheme.breakpoints.up('sm')]: {
        padding: `${(sm || xs) * 8}px`,
      },
      ...(md && {
        [responsiveTheme.breakpoints.up('md')]: {
          padding: `${md * 8}px`,
        },
      }),
      ...(lg && {
        [responsiveTheme.breakpoints.up('lg')]: {
          padding: `${lg * 8}px`,
        },
      }),
    }),
  },
  
  // Tamaños de fuente responsivos
  fontSize: {
    responsive: (xs, sm = null, md = null) => ({
      fontSize: `${xs}rem`,
      ...(sm && {
        [responsiveTheme.breakpoints.up('sm')]: {
          fontSize: `${sm}rem`,
        },
      }),
      ...(md && {
        [responsiveTheme.breakpoints.up('md')]: {
          fontSize: `${md}rem`,
        },
      }),
    }),
  },
};

export default responsiveTheme;
