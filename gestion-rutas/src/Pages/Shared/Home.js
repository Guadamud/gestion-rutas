import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { professionalColors } from '../../utils/professionalColors';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  CardMedia,
  useMediaQuery,
  Stack
} from '@mui/material';
import { 
  Login, 
  PersonAdd, 
  DirectionsBus,
  Schedule,
  Route,
  Security,
  Speed,
  Group,
  CheckCircle,
  Star,
  Explore,
  TrendingUp,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Importar imágenes de cooperativas
import img7Noviembre from '../../assets/buses/cooperativa-7-noviembre.jpg';
import img24Septiembre from '../../assets/buses/cooperativa-24-septiembre.jpg';
import imgJipijapa from '../../assets/buses/cooperativa-jipijapa.jpg';
import imgCaciqueGuale from '../../assets/buses/cooperativa-cacique-guale.jpg';
import img15Octubre from '../../assets/buses/cooperativa-15-octubre.jpg';
import img24Mayo from '../../assets/buses/24 de mayo.jpeg';
import logoPajan from '../../assets/logo pajan.png';
import imgSanJacinto from '../../assets/buses/San Jacinto Cotranscascol.jpg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Estado para almacenar las cooperativas desde la API
  const [cooperativasAPI, setCooperativasAPI] = useState([]);
  const [loadingCooperativas, setLoadingCooperativas] = useState(true);

  // Obtener cooperativas desde la API
  useEffect(() => {
    const fetchCooperativas = async () => {
      try {
        const response = await fetch(`${API_URL}/api/cooperativas/publicas`);
        if (response.ok) {
          const data = await response.json();
          console.log('Cooperativas cargadas desde API:', data); // Debug
          setCooperativasAPI(data);
        }
      } catch (error) {
        console.error('Error al cargar cooperativas:', error);
      } finally {
        setLoadingCooperativas(false);
      }
    };

    fetchCooperativas();
  }, []);

  // Función mejorada para obtener el estado de una cooperativa desde la API
  const getEstadoCooperativa = (nombreCooperativa) => {
    if (!cooperativasAPI || cooperativasAPI.length === 0) {
      return 'activo'; // Default mientras carga
    }

    // Extraer palabras clave del nombre (eliminar palabras comunes)
    const extraerPalabrasClave = (nombre) => {
      const palabrasIgnorar = [
        'cooperativa', 'compañia', 'compania', 'de', 'transporte', 'interprovincial',
        'intraprovincial', 'intracantonal', 'pasajeros', 'buses', 'en', 's.a', 'sa',
        'la', 'el', 'los', 'las', 'del', 'y', 'a', 's'
      ];
      
      return nombre
        .toLowerCase()
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/\./g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(palabra => palabra.length >= 2 && !palabrasIgnorar.includes(palabra));
    };

    const palabrasClavesBuscadas = extraerPalabrasClave(nombreCooperativa);
    
    console.group(`🔍 Buscando estado de: "${nombreCooperativa}"`);
    console.log('Palabras clave extraídas:', palabrasClavesBuscadas);
    
    const cooperativaEncontrada = cooperativasAPI.find(c => {
      const palabrasClaveAPI = extraerPalabrasClave(c.nombre);
      
      // Buscar si al menos 2 palabras clave coinciden (o 1 si es un nombre muy específico)
      const coincidencias = palabrasClavesBuscadas.filter(palabraBuscada => 
        palabrasClaveAPI.some(palabraAPI => 
          palabraAPI === palabraBuscada || 
          palabraAPI.includes(palabraBuscada) || 
          palabraBuscada.includes(palabraAPI)
        )
      );
      
      const numCoincidencias = coincidencias.length;
      const minimoRequerido = palabrasClavesBuscadas.length >= 3 ? 2 : 1;
      
      // Debug: mostrar comparación
      if (numCoincidencias > 0) {
        console.log(`  📋 "${c.nombre}"`);
        console.log(`     Palabras API: ${palabrasClaveAPI.join(', ')}`);
        console.log(`     Coincidencias: ${coincidencias.join(', ')} (${numCoincidencias}/${minimoRequerido})`);
      }
      
      return numCoincidencias >= minimoRequerido;
    });

    if (cooperativaEncontrada) {
      console.log(`✅ ENCONTRADA → Estado: ${cooperativaEncontrada.estado.toUpperCase()}`);
      console.groupEnd();
      return cooperativaEncontrada.estado;
    } else {
      console.warn(`❌ NO ENCONTRADA - Se usará estado por defecto: activo`);
      console.groupEnd();
    }
    
    return 'activo';
  };

  // Configuración de cooperativas con sus imágenes
  const cooperativas = {
    interprovinciales: [
      {
        nombre: "Cooperativa 7 de Noviembre",
        descripcion: "Rutas interprovinciales de larga distancia",
        imagen: img7Noviembre,
        color: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        colorTexto: theme.palette.primary.main
      },
      {
        nombre: "Cooperativa 24 de Septiembre", 
        descripcion: "Conexiones interprovinciales premium - Trans Paján",
        imagen: img24Septiembre,
        color: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
        colorTexto: theme.palette.error.main
      },
      {
        nombre: "Cooperativa Jipijapa",
        descripcion: "Servicios hacia la costa ecuatoriana", 
        imagen: imgJipijapa,
        color: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
        colorTexto: theme.palette.success.main
      }
    ],
    intracantonales: [
      {
        nombre: "Cooperativa Cacique Guale",
        descripcion: "Rutas locales dentro del cantón",
        imagen: imgCaciqueGuale,
        color: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
        colorTexto: theme.palette.secondary.main
      },
      {
        nombre: "Compañía San Jacinto Cotranscascol",
        descripcion: "Transporte intracantonal San Jacinto de Cascol S.A",
        imagen: imgSanJacinto,
        color: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
        colorTexto: '#0288d1'
      }
    ],
    intraprovinciales: [
      {
        nombre: "Cooperativa 24 de Mayo",
        descripcion: "Transporte de pasajeros en buses intraprovinciales",
        imagen: img24Mayo,
        color: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
        colorTexto: theme.palette.warning.main
      },
      {
        nombre: "Cooperativa 15 de Octubre",
        descripcion: "Rutas provinciales especializadas",
        imagen: img15Octubre,
        color: 'linear-gradient(135deg, #5d4037 0%, #8d6e63 100%)',
        colorTexto: '#5d4037'
      },
      {
        nombre: "Cooperativa 13 de Diciembre",
        descripcion: "Cooperativa de transportes provincial",
        color: 'linear-gradient(135deg, #c2185b 0%, #e91e63 100%)',
        colorTexto: '#c2185b'
      },
      {
        nombre: "Compañía Manabi Transman",
        descripcion: "Compañía de transporte de pasajeros Manabi S.A.",
        color: 'linear-gradient(135deg, #00695c 0%, #00897b 100%)',
        colorTexto: '#00695c'
      }
    ]
  };

  // Función para renderizar imagen o fallback
  const renderImagenCooperativa = (cooperativa, icono) => {
    if (cooperativa.imagen) {
      return (
        <CardMedia
          component="img"
          height="200"
          image={cooperativa.imagen}
          alt={cooperativa.nombre}
          sx={{
            objectFit: 'cover',
            filter: 'brightness(0.9)'
          }}
        />
      );
    } else {
      return (
        <Box
          sx={{
            height: 200,
            background: cooperativa.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {icono}
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 1,
              px: 1,
              py: 0.5
            }}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
              Imagen próximamente
            </Typography>
          </Box>
        </Box>
      );
    }
  };

  const features = [
    {
      icon: <DirectionsBus sx={{ fontSize: 40 }} />,
      title: 'Gestión de Buses',
      description: 'Administra tu flota de buses de manera eficiente'
    },
    {
      icon: <Route sx={{ fontSize: 40 }} />,
      title: 'Control de Rutas',
      description: 'Organiza y optimiza las rutas de transporte'
    },
    {
      icon: <Schedule sx={{ fontSize: 40 }} />,
      title: 'Programación de Frecuencias',
      description: 'Planifica horarios y frecuencias de viaje'
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Gestión de Usuarios',
      description: 'Administra perfiles de conductores y personal'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Seguridad Avanzada',
      description: 'Sistema seguro con autenticación robusta'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Reportes y Estadísticas',
      description: 'Analiza el rendimiento con informes detallados'
    }
  ];

  const benefits = [
    'Control centralizado de operaciones',
    'Reducción de tiempos de gestión',
    'Mejora en la experiencia del usuario',
    'Información en tiempo real',
    'Optimización de recursos',
    'Cumplimiento normativo'
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: professionalColors.background.primary,
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1, md: 1.5 } }}>
              <img
                src={logoPajan}
                alt="Logo Paján"
                style={{
                  width: 'clamp(120px, 14vw, 180px)',
                  height: 'clamp(120px, 14vw, 180px)',
                  objectFit: 'contain'
                }}
              />
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: professionalColors.text.primary,
                mb: 2,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem', lg: '3.75rem' },
                lineHeight: { xs: 1.2, md: 1.1 },
                px: { xs: 1, sm: 2 }
              }}
            >
              Gestión Municipal de Tránsito, Transporte Terrestre y Seguridad Vial
            </Typography>

            <Typography
              variant="h5"
              sx={{ 
                color: theme.palette.text.secondary, 
                mb: 1,
                fontWeight: 300,
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              Terminal Terrestre del Cantón Paján
            </Typography>

            <Typography
              variant="h6"
              sx={{ 
                color: theme.palette.text.secondary, 
                mb: { xs: 3, md: 4 },
                fontWeight: 400,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              Sistema de Gestión de Frecuencias
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.primary,
                mb: { xs: 3, md: 4 },
                maxWidth: { xs: '100%', sm: 600, md: 800 },
                mx: 'auto',
                lineHeight: 1.6,
                fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              Plataforma integral para la administración eficiente de rutas, 
              frecuencias, buses y usuarios del sistema de transporte público
            </Typography>

            {/* Botones principales */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2} 
              justifyContent="center" 
              alignItems="center"
              sx={{ mb: { xs: 3, md: 4 }, px: { xs: 2, sm: 0 } }}
            >
              <Button
                variant="contained"
                size={isMobile ? "medium" : "large"}
                startIcon={<Login />}
                onClick={() => navigate('/login')}
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  borderRadius: 3,
                  boxShadow: theme.shadows[8],
                  minWidth: { xs: '100%', sm: 'auto' },
                  maxWidth: { xs: '300px', sm: 'none' },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[12]
                  }
                }}
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="outlined"
                size={isMobile ? "medium" : "large"}
                startIcon={<PersonAdd />}
                onClick={() => navigate('/register')}
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  borderRadius: 3,
                  borderWidth: 2,
                  minWidth: { xs: '100%', sm: 'auto' },
                  maxWidth: { xs: '300px', sm: 'none' },
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Registrarse
              </Button>
            </Stack>
          </Box>
        </motion.div>

        {/* Buses por Categorías Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Typography
              variant="h4"
              sx={{
                textAlign: 'center',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: { xs: 3, md: 4 },
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                px: { xs: 1, sm: 2 }
              }}
            >
              Cooperativas del Terminal
            </Typography>

            {/* Categoría Interprovincial */}
            <Box sx={{ mb: { xs: 4, md: 5 } }}>
              <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
                <Chip
                  label="SERVICIOS INTERPROVINCIALES"
                  color="primary"
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    fontWeight: 700,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.5, sm: 1 },
                    height: { xs: 32, sm: 40 }
                  }}
                />
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                {cooperativas.interprovinciales.map((cooperativa, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index} sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: { xs: '100%', sm: '400px' }
                  }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 + (index * 0.1) }}
                      style={{ width: '100%', maxWidth: '380px' }}
                    >
                      <Card 
                        sx={{
                          width: '380px',
                          maxWidth: '100%',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          overflow: 'hidden',
                          borderRadius: { xs: 2, sm: 3 },
                          '&:hover': {
                            transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)' },
                            boxShadow: theme.shadows[15]
                          }
                        }}
                      >
                        {renderImagenCooperativa(cooperativa, <DirectionsBus sx={{ fontSize: { xs: 60, sm: 80 }, color: 'white', opacity: 0.9 }} />)}
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              textAlign: 'center',
                              mb: 1,
                              color: cooperativa.colorTexto,
                              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                              lineHeight: { xs: 1.2, sm: 1.3 },
                              minHeight: { xs: '48px', sm: '56px' }
                            }}
                          >
                            {cooperativa.nombre}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              textAlign: 'center',
                              color: theme.palette.text.secondary,
                              mb: 1,
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              lineHeight: { xs: 1.3, sm: 1.4 },
                              minHeight: { xs: '40px', sm: '44px' }
                            }}
                          >
                            {cooperativa.descripcion}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip
                              size="small"
                              label={getEstadoCooperativa(cooperativa.nombre) === 'activo' ? 'Activo' : 'Inactivo'}
                              color={getEstadoCooperativa(cooperativa.nombre) === 'activo' ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>            {/* Categoría Intracantonal */}
            <Box sx={{ mb: { xs: 4, md: 5 } }}>
              <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
                <Chip
                  label="SERVICIOS INTRACANTONALES"
                  color="secondary"
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    fontWeight: 700,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.5, sm: 1 },
                    height: { xs: 32, sm: 40 }
                  }}
                />
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                {cooperativas.intracantonales.map((cooperativa, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index} sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: { xs: '100%', sm: '400px' }
                  }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.5 + (index * 0.1) }}
                      style={{ width: '100%', maxWidth: '380px' }}
                    >
                      <Card 
                        sx={{
                          width: '380px',
                          maxWidth: '100%',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          overflow: 'hidden',
                          borderRadius: { xs: 2, sm: 3 },
                          '&:hover': {
                            transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)' },
                            boxShadow: theme.shadows[15]
                          }
                        }}
                      >
                        {renderImagenCooperativa(cooperativa, <Route sx={{ fontSize: { xs: 60, sm: 80 }, color: 'white', opacity: 0.9 }} />)}
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              textAlign: 'center',
                              mb: 1,
                              color: cooperativa.colorTexto,
                              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                              lineHeight: { xs: 1.2, sm: 1.3 },
                              minHeight: { xs: '48px', sm: '56px' }
                            }}
                          >
                            {cooperativa.nombre}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              textAlign: 'center',
                              color: theme.palette.text.secondary,
                              mb: 1,
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              lineHeight: { xs: 1.3, sm: 1.4 },
                              minHeight: { xs: '40px', sm: '44px' }
                            }}
                          >
                            {cooperativa.descripcion}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip
                              size="small"
                              label={getEstadoCooperativa(cooperativa.nombre) === 'activo' ? 'Activo' : 'Inactivo'}
                              color={getEstadoCooperativa(cooperativa.nombre) === 'activo' ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Categoría Intraprovincial */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Chip
                  label="SERVICIOS INTRAPROVINCIALES"
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                    fontWeight: 700,
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.5, sm: 1 },
                    height: { xs: 32, sm: 40 },
                    backgroundColor: theme.palette.warning.main,
                    color: 'white'
                  }}
                />
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
                {cooperativas.intraprovinciales.map((cooperativa, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index} sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    maxWidth: { xs: '100%', sm: '400px' }
                  }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 + (index * 0.1) }}
                      style={{ width: '100%', maxWidth: '380px' }}
                    >
                      <Card 
                        sx={{
                          width: '380px',
                          maxWidth: '100%',
                          height: '100%',
                          transition: 'all 0.3s ease',
                          overflow: 'hidden',
                          borderRadius: { xs: 2, sm: 3 },
                          '&:hover': {
                            transform: { xs: 'translateY(-4px)', sm: 'translateY(-8px)' },
                            boxShadow: theme.shadows[15]
                          }
                        }}
                      >
                        {renderImagenCooperativa(cooperativa, <Explore sx={{ fontSize: { xs: 60, sm: 80 }, color: 'white', opacity: 0.9 }} />)}
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              textAlign: 'center',
                              mb: 1,
                              color: cooperativa.colorTexto,
                              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                              lineHeight: { xs: 1.2, sm: 1.3 },
                              minHeight: { xs: '48px', sm: '56px' }
                            }}
                          >
                            {cooperativa.nombre}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              textAlign: 'center',
                              color: theme.palette.text.secondary,
                              mb: 1,
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              lineHeight: { xs: 1.3, sm: 1.4 },
                              minHeight: { xs: '40px', sm: '44px' }
                            }}
                          >
                            {cooperativa.descripcion}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Chip
                              size="small"
                              label={getEstadoCooperativa(cooperativa.nombre) === 'activo' ? 'Activo' : 'Inactivo'}
                              color={getEstadoCooperativa(cooperativa.nombre) === 'activo' ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </motion.div>

        {/* Benefits and Contact Section with Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Grid 
            container 
            spacing={{ xs: 2, sm: 3, md: 4 }} 
            justifyContent="center"
            alignItems="stretch"
            sx={{ mb: { xs: 4, md: 6 } }}
          >
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: { xs: 2, sm: 3 } }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    <Star color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    Beneficios del Sistema
                  </Typography>

                  <List>
                    {benefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 36, sm: 56 } }}>
                          <CheckCircle color="success" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit}
                          primaryTypographyProps={{
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Información de Contacto en el centro */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: { xs: 2, sm: 3 } }}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    <Phone color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    Información de Contacto
                  </Typography>

                  <List>
                    <ListItem sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 36, sm: 56 } }}>
                        <LocationOn color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Terminal Terrestre"
                        secondary="Cantón Paján, Ecuador"
                        primaryTypographyProps={{
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                        secondaryTypographyProps={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 36, sm: 56 } }}>
                        <Phone color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Teléfono"
                        secondary="+593 XX XXX XXXX"
                        primaryTypographyProps={{
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                        secondaryTypographyProps={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 36, sm: 56 } }}>
                        <Email color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary="alcaldia@pajan.gob.ec"
                        primaryTypographyProps={{
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                        secondaryTypographyProps={{
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Mapa del Terminal a la derecha */}
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', borderRadius: { xs: 2, sm: 3 }, overflow: 'hidden', p: 0 }}>
                <Box sx={{ px: { xs: 1, sm: 1.5 }, pt: { xs: 1, sm: 1.5 }, pb: { xs: 0.5, sm: 1 } }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                      textAlign: 'center',
                      m: 0
                    }}
                  >
                    <LocationOn color="primary" sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    Ubicación Terminal
                  </Typography>
                </Box>

                <Box
                  sx={{
                    height: { xs: 280, sm: 320, md: 360 },
                    position: 'relative',
                    width: '100%',
                    m: 0,
                    p: 0
                  }}
                >
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5909.5402687898!2d-80.43644811139725!3d-1.5530488425499487!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x902c40eb4bf89def%3A0x5b852d50edc49bb4!2sTerminal%20Terrestre%20De%20Pajan!5e0!3m2!1ses-419!2sec!4v1754624671752!5m2!1ses-419!2sec"
                    width="100%"
                    height="100%"
                    style={{ border: 0, margin: 0, padding: 0, display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación Terminal Terrestre Paján"
                  />
                </Box>

                <Box sx={{ px: { xs: 1, sm: 1.5 }, py: { xs: 0.5, sm: 1 } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: 'center',
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      fontWeight: 500,
                      m: 0
                    }}
                  >
                    Terminal Terrestre del Cantón Paján, Ecuador
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Card sx={{ borderRadius: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                &copy; {new Date().getFullYear()} Terminal Terrestre de Paján — Dirección de Tránsito
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  display: 'block',
                  mt: 0.5,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' } 
                }}
              >
                Todos los derechos reservados • Sistema de Gestión de Frecuencias v1.0
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Home;
