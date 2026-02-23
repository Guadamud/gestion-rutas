import { createTheme } from '@mui/material/styles';

export const getTheme = (primaryColor = '#6366f1') => {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#5B68E6', // Indigo más suave y menos saturado
        light: '#8B95F0',
        dark: '#4650D1',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#7B6CF0', // Púrpura menos intenso
        light: '#9B8BF3',
        dark: '#6A5AE0',
        contrastText: '#ffffff'
      },
      background: {
        default: '#FAFBFC', // Fondo principal más suave
        paper: '#FFFFFF'
      },
      text: {
        primary: '#3F4752', // Gris azulado muy suave para texto principal
        secondary: '#6B7485' // Gris medio menos contrastante
      },
      grey: {
        50: '#FAFBFC',
        100: '#F4F6F8',
        200: '#E8EAED',
        300: '#D5D9DD',
        400: '#9DA4AE',
        500: '#6B7485',
        600: '#4B5462',
        700: '#3F4752',
        800: '#2C3338',
        900: '#1A1E23'
      },
      success: {
        main: '#00B386', // Verde menos intenso
        light: '#33C49A',
        dark: '#008A65',
        contrastText: '#ffffff'
      },
      warning: {
        main: '#E6A845', // Ámbar más cálido y suave
        light: '#F0BA69',
        dark: '#CC8F2A',
        contrastText: '#ffffff'
      },
      error: {
        main: '#E85A5A', // Rojo coral más suave
        light: '#ED7D7D',
        dark: '#D43B3B'
      },
      info: {
        main: '#4A90F5', // Azul más suave
        light: '#73A9F7',
        dark: '#2B77E8'
      }
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600, // Reducido de 700 para menos peso visual
        lineHeight: 1.3,
        color: '#2C3338', // Color más suave
        letterSpacing: '-0.02em'
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        color: '#2C3338',
        letterSpacing: '-0.01em'
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
        color: '#3F4752'
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color: '#3F4752'
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500, // Menos peso
        lineHeight: 1.4,
        color: '#4B5462'
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.4,
        color: '#4B5462'
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        color: '#4B5462', // Más suave que el anterior
        fontWeight: 400
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: '#6B7485', // Menos contrastante
        fontWeight: 400
      }
    },
    shape: {
      borderRadius: 10 // Reducido ligeramente para una apariencia más sutil
    },
    shadows: [
      'none',
      '0 1px 3px 0 rgba(30, 41, 59, 0.08), 0 1px 2px 0 rgba(30, 41, 59, 0.06)', // Sombras más suaves
      '0 4px 6px -1px rgba(30, 41, 59, 0.08), 0 2px 4px -1px rgba(30, 41, 59, 0.06)',
      '0 10px 15px -3px rgba(30, 41, 59, 0.08), 0 4px 6px -2px rgba(30, 41, 59, 0.05)',
      '0 20px 25px -5px rgba(30, 41, 59, 0.08), 0 10px 10px -5px rgba(30, 41, 59, 0.04)',
      '0 25px 50px -12px rgba(30, 41, 59, 0.15)', // Reducida opacidad para menos peso visual
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
            padding: '10px 20px',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 2px 8px 0 rgba(91, 104, 230, 0.2)', // Sombra suave del color primario
              transform: 'translateY(-1px)'
            }
          },
          contained: {
            background: 'linear-gradient(135deg, #5B68E6 0%, #7B6CF0 100%)', // Gradiente sutil
            '&:hover': {
              background: 'linear-gradient(135deg, #4650D1 0%, #6A5AE0 100%)',
              boxShadow: '0 4px 12px 0 rgba(91, 104, 230, 0.3)'
            },
            '&:active': {
              transform: 'translateY(0)'
            }
          },
          outlined: {
            borderColor: '#E8EAED',
            color: '#4B5462',
            '&:hover': {
              borderColor: '#5B68E6',
              backgroundColor: 'rgba(91, 104, 230, 0.04)',
              color: '#5B68E6'
            }
          },
          text: {
            color: '#6B7485',
            '&:hover': {
              backgroundColor: 'rgba(91, 104, 230, 0.04)',
              color: '#5B68E6'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: '1px solid #F0F2F5', // Borde más sutil
            backgroundColor: '#FFFFFF'
          },
          elevation1: {
            boxShadow: '0 1px 3px 0 rgba(30, 41, 59, 0.08), 0 1px 2px 0 rgba(30, 41, 59, 0.06)'
          },
          elevation2: {
            boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.08), 0 2px 4px -1px rgba(30, 41, 59, 0.06)'
          },
          elevation3: {
            boxShadow: '0 10px 15px -3px rgba(30, 41, 59, 0.08), 0 4px 6px -2px rgba(30, 41, 59, 0.05)'
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              transition: 'all 0.2s ease-in-out',
              '& fieldset': {
                borderColor: '#E8EAED',
                borderWidth: '1px'
              },
              '&:hover fieldset': {
                borderColor: '#D5D9DD'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#5B68E6',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(91, 104, 230, 0.1)' // Sombra de foco suave
              },
              '& input': {
                color: '#4B5462'
              },
              '& input::placeholder': {
                color: '#9DA4AE',
                opacity: 1
              }
            },
            '& .MuiInputLabel-root': {
              color: '#6B7485',
              '&.Mui-focused': {
                color: '#5B68E6'
              }
            }
          }
        }
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: '#F8FAFC', // Fondo más suave
            fontWeight: 600,
            color: '#4B5462', // Color más suave
            borderBottom: '1px solid #E8EAED', // Borde más sutil
            fontSize: '0.875rem',
            padding: '16px'
          },
          body: {
            borderBottom: '1px solid #F4F6F8', // Líneas muy sutiles
            color: '#4B5462',
            padding: '16px',
            '&:hover': {
              backgroundColor: 'rgba(91, 104, 230, 0.02)' // Hover muy sutil
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: '1px solid #F0F2F5',
            boxShadow: '0 1px 3px 0 rgba(30, 41, 59, 0.08), 0 1px 2px 0 rgba(30, 41, 59, 0.06)',
            backgroundColor: '#FFFFFF',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(30, 41, 59, 0.1), 0 2px 4px -1px rgba(30, 41, 59, 0.06)',
              transform: 'translateY(-1px)'
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem'
          },
          colorPrimary: {
            backgroundColor: 'rgba(91, 104, 230, 0.1)',
            color: '#5B68E6',
            border: '1px solid rgba(91, 104, 230, 0.2)'
          },
          colorSuccess: {
            backgroundColor: 'rgba(0, 179, 134, 0.1)',
            color: '#00B386',
            border: '1px solid rgba(0, 179, 134, 0.2)'
          },
          colorError: {
            backgroundColor: 'rgba(232, 90, 90, 0.1)',
            color: '#E85A5A',
            border: '1px solid rgba(232, 90, 90, 0.2)'
          },
          colorWarning: {
            backgroundColor: 'rgba(230, 168, 69, 0.1)',
            color: '#E6A845',
            border: '1px solid rgba(230, 168, 69, 0.2)'
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            color: '#6B7485',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(91, 104, 230, 0.08)',
              color: '#5B68E6',
              transform: 'scale(1.05)'
            }
          }
        }
      }
    }
  });
};
