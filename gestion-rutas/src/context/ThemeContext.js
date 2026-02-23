import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ThemeContext = createContext();

// Definición de temas predefinidos
const temasPredefinidos = {
  azulProfesional: {
    nombre: 'Azul Profesional',
    descripcion: 'Tema clásico y profesional',
    colores: {
      primary: {
        main: '#5B68E6',
        light: '#8B95F0',
        dark: '#4650D1',
      },
      secondary: {
        main: '#7B6CF0',
        light: '#9B8BF3',
        dark: '#6A5AE0',
      },
      success: {
        main: '#00B386',
        light: '#33C49A',
        dark: '#008A65',
      },
      warning: {
        main: '#E6A845',
        light: '#F0BA69',
        dark: '#CC8F2A',
      },
      error: {
        main: '#E85A5A',
        light: '#ED7D7D',
        dark: '#D43B3B',
      },
      info: {
        main: '#4A90F5',
        light: '#73A9F7',
        dark: '#2B77E8',
      },
      background: {
        default: '#FAFBFC',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#3F4752',
        secondary: '#6B7485',
      },
    },
  },
  verdeEsmeralda: {
    nombre: 'Verde Esmeralda',
    descripcion: 'Tema financiero y profesional',
    colores: {
      primary: {
        main: '#00897B',
        light: '#4EBAAA',
        dark: '#005B4F',
      },
      secondary: {
        main: '#26A69A',
        light: '#64D8CB',
        dark: '#00766C',
      },
      success: {
        main: '#43A047',
        light: '#76D275',
        dark: '#00701A',
      },
      warning: {
        main: '#FFB300',
        light: '#FFE54C',
        dark: '#C68400',
      },
      error: {
        main: '#E53935',
        light: '#FF6F60',
        dark: '#AB000D',
      },
      info: {
        main: '#00ACC1',
        light: '#5DDEF4',
        dark: '#007C91',
      },
      background: {
        default: '#E0F2F1',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#004D40',
        secondary: '#00695C',
      },
    },
  },
  naranjaEnergia: {
    nombre: 'Naranja Energía',
    descripcion: 'Tema vibrante y energético',
    colores: {
      primary: {
        main: '#F57C00',
        light: '#FFA726',
        dark: '#C66900',
      },
      secondary: {
        main: '#FF6F00',
        light: '#FFA040',
        dark: '#C43E00',
      },
      success: {
        main: '#66BB6A',
        light: '#98EE99',
        dark: '#338A3E',
      },
      warning: {
        main: '#FFA726',
        light: '#FFD95B',
        dark: '#C77800',
      },
      error: {
        main: '#EF5350',
        light: '#FF867C',
        dark: '#B61827',
      },
      info: {
        main: '#29B6F6',
        light: '#73E8FF',
        dark: '#0086C3',
      },
      background: {
        default: '#FFF3E0',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#E65100',
        secondary: '#F57C00',
      },
    },
  },
  moradoCreativo: {
    nombre: 'Morado Creativo',
    descripcion: 'Tema creativo y moderno',
    colores: {
      primary: {
        main: '#7B1FA2',
        light: '#AE52D4',
        dark: '#4A0072',
      },
      secondary: {
        main: '#9C27B0',
        light: '#D05CE3',
        dark: '#6A0080',
      },
      success: {
        main: '#66BB6A',
        light: '#98EE99',
        dark: '#338A3E',
      },
      warning: {
        main: '#FFA726',
        light: '#FFD95B',
        dark: '#C77800',
      },
      error: {
        main: '#EF5350',
        light: '#FF867C',
        dark: '#B61827',
      },
      info: {
        main: '#29B6F6',
        light: '#73E8FF',
        dark: '#0086C3',
      },
      background: {
        default: '#F3E5F5',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#4A148C',
        secondary: '#7B1FA2',
      },
    },
  },
  rojoPasion: {
    nombre: 'Rojo Pasión',
    descripcion: 'Tema intenso y apasionado',
    colores: {
      primary: {
        main: '#D32F2F',
        light: '#FF6659',
        dark: '#9A0007',
      },
      secondary: {
        main: '#C62828',
        light: '#FF5F52',
        dark: '#8E0000',
      },
      success: {
        main: '#66BB6A',
        light: '#98EE99',
        dark: '#338A3E',
      },
      warning: {
        main: '#FFA726',
        light: '#FFD95B',
        dark: '#C77800',
      },
      error: {
        main: '#F44336',
        light: '#FF7961',
        dark: '#BA000D',
      },
      info: {
        main: '#29B6F6',
        light: '#73E8FF',
        dark: '#0086C3',
      },
      background: {
        default: '#FFEBEE',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#B71C1C',
        secondary: '#D32F2F',
      },
    },
  },
  marronTierra: {
    nombre: 'Marrón Tierra',
    descripcion: 'Tema cálido y profesional',
    colores: {
      primary: {
        main: '#6D4C41',
        light: '#9C786C',
        dark: '#40241A',
      },
      secondary: {
        main: '#795548',
        light: '#A98274',
        dark: '#4B2C20',
      },
      success: {
        main: '#66BB6A',
        light: '#98EE99',
        dark: '#338A3E',
      },
      warning: {
        main: '#FFA726',
        light: '#FFD95B',
        dark: '#C77800',
      },
      error: {
        main: '#EF5350',
        light: '#FF867C',
        dark: '#B61827',
      },
      info: {
        main: '#29B6F6',
        light: '#73E8FF',
        dark: '#0086C3',
      },
      background: {
        default: '#EFEBE9',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#3E2723',
        secondary: '#5D4037',
      },
    },
  },
  grisProfesional: {
    nombre: 'Gris Profesional',
    descripcion: 'Tema elegante y minimalista',
    colores: {
      primary: {
        main: '#455A64',
        light: '#718792',
        dark: '#1C313A',
      },
      secondary: {
        main: '#607D8B',
        light: '#8EACBB',
        dark: '#34515E',
      },
      success: {
        main: '#66BB6A',
        light: '#98EE99',
        dark: '#338A3E',
      },
      warning: {
        main: '#FFA726',
        light: '#FFD95B',
        dark: '#C77800',
      },
      error: {
        main: '#EF5350',
        light: '#FF867C',
        dark: '#B61827',
      },
      info: {
        main: '#29B6F6',
        light: '#73E8FF',
        dark: '#0086C3',
      },
      background: {
        default: '#ECEFF1',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#263238',
        secondary: '#455A64',
      },
    },
  },
  indigoNocturno: {
    nombre: 'Índigo Nocturno',
    descripcion: 'Tema elegante y sofisticado',
    colores: {
      primary: {
        main: '#303F9F',
        light: '#666AD1',
        dark: '#001970',
      },
      secondary: {
        main: '#3F51B5',
        light: '#757DE8',
        dark: '#002984',
      },
      success: {
        main: '#66BB6A',
        light: '#98EE99',
        dark: '#338A3E',
      },
      warning: {
        main: '#FFA726',
        light: '#FFD95B',
        dark: '#C77800',
      },
      error: {
        main: '#EF5350',
        light: '#FF867C',
        dark: '#B61827',
      },
      info: {
        main: '#29B6F6',
        light: '#73E8FF',
        dark: '#0086C3',
      },
      background: {
        default: '#E8EAF6',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#1A237E',
        secondary: '#303F9F',
      },
    },
  },
};

// Función para crear un tema basado en los colores
const crearTemaPersonalizado = (colores) => {
  return createTheme({
    palette: {
      mode: 'light',
      ...colores,
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
        900: '#1A1E23',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0 2px 4px rgba(0, 0, 0, 0.05)',
      '0 4px 8px rgba(0, 0, 0, 0.08)',
      '0 8px 16px rgba(0, 0, 0, 0.1)',
      '0 12px 24px rgba(0, 0, 0, 0.12)',
      '0 16px 32px rgba(0, 0, 0, 0.14)',
      '0 20px 40px rgba(0, 0, 0, 0.16)',
      '0 24px 48px rgba(0, 0, 0, 0.18)',
      '0 28px 56px rgba(0, 0, 0, 0.20)',
      '0 32px 64px rgba(0, 0, 0, 0.22)',
      '0 36px 72px rgba(0, 0, 0, 0.24)',
      '0 40px 80px rgba(0, 0, 0, 0.26)',
      '0 44px 88px rgba(0, 0, 0, 0.28)',
      '0 48px 96px rgba(0, 0, 0, 0.30)',
      '0 52px 104px rgba(0, 0, 0, 0.32)',
      '0 56px 112px rgba(0, 0, 0, 0.34)',
      '0 60px 120px rgba(0, 0, 0, 0.36)',
      '0 64px 128px rgba(0, 0, 0, 0.38)',
      '0 68px 136px rgba(0, 0, 0, 0.40)',
      '0 72px 144px rgba(0, 0, 0, 0.42)',
      '0 76px 152px rgba(0, 0, 0, 0.44)',
      '0 80px 160px rgba(0, 0, 0, 0.46)',
      '0 84px 168px rgba(0, 0, 0, 0.48)',
      '0 88px 176px rgba(0, 0, 0, 0.50)',
      '0 92px 184px rgba(0, 0, 0, 0.52)',
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: '0.95rem',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${colores.primary.main} 0%, ${colores.primary.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colores.primary.dark} 0%, ${colores.primary.main} 100%)`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
            },
          },
        },
      },
    },
  });
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Mapeo de roles a temas predeterminados
const temasPorRol = {
  admin: 'azulProfesional',
  tesoreria: 'verdeEsmeralda',
  verificador: 'indigoNocturno',
  cliente: 'grisProfesional',
  conductor: 'marronTierra',
};

export const ThemeContextProvider = ({ children }) => {
  const { user } = useAuth();
  const [temaSeleccionado, setTemaSeleccionado] = useState('azulProfesional');
  const [cargando, setCargando] = useState(true);

  // Cargar preferencia de tema del usuario
  useEffect(() => {
    const cargarPreferenciaTema = async () => {
      if (user && user.id) {
        console.log('🎨 Cargando tema para usuario:', user.nombres, 'Rol:', user.rol);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${API_URL}/api/usuarios/${user.id}/preferencias-tema`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          console.log('📥 Tema recibido del servidor:', response.data.tema_preferido);
          
          if (response.data.tema_preferido) {
            setTemaSeleccionado(response.data.tema_preferido);
            console.log('✅ Tema aplicado:', response.data.tema_preferido);
          } else {
            // Si no tiene tema, asignar según su rol
            const temaPorRol = temasPorRol[user.rol] || 'azulProfesional';
            console.log('⚙️ Asignando tema por rol:', temaPorRol);
            setTemaSeleccionado(temaPorRol);
          }
        } catch (error) {
          console.log('⚠️ Error al cargar tema, usando tema según rol', error.message);
          // Usar tema según rol si no se puede cargar
          const temaPorRol = temasPorRol[user.rol] || 'azulProfesional';
          console.log('🔧 Tema por rol aplicado:', temaPorRol);
          setTemaSeleccionado(temaPorRol);
        }
      } else {
        // Usuario no autenticado, usar tema por defecto
        const temaGuardado = localStorage.getItem('tema_no_autenticado');
        if (temaGuardado && temasPredefinidos[temaGuardado]) {
          setTemaSeleccionado(temaGuardado);
        }
      }
      setCargando(false);
    };

    cargarPreferenciaTema();
  }, [user]);

  // Guardar preferencia de tema
  const cambiarTema = async (nuevoTema) => {
    if (!temasPredefinidos[nuevoTema]) {
      console.error('❌ Tema no válido:', nuevoTema);
      return;
    }

    console.log('🎨 Cambiando tema a:', nuevoTema);
    setTemaSeleccionado(nuevoTema);

    if (user && user.id) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_URL}/api/usuarios/${user.id}/preferencias-tema`,
          { tema_preferido: nuevoTema },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('✅ Tema guardado en servidor');
      } catch (error) {
        console.error('❌ Error al guardar preferencia de tema:', error);
      }
    } else {
      // Guardar en localStorage para usuarios no autenticados
      localStorage.setItem('tema_no_autenticado', nuevoTema);
    }
  };

  // Crear el tema actual basado en la selección
  const temaActual = useMemo(() => {
    const colores = temasPredefinidos[temaSeleccionado]?.colores || 
                    temasPredefinidos.azulProfesional.colores;
    return crearTemaPersonalizado(colores);
  }, [temaSeleccionado]);

  const valor = {
    temaSeleccionado,
    cambiarTema,
    temasPredefinidos,
    temaActual,
    cargando,
  };

  return (
    <ThemeContext.Provider value={valor}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeContextProvider');
  }
  return context;
};

export default ThemeContext;
