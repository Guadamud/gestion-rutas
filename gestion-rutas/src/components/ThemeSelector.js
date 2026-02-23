import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Paper,
  Container,
  Fade,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Palette as PaletteIcon,
  Brightness4 as Brightness4Icon,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';

const ThemeSelector = () => {
  const { temaSeleccionado, cambiarTema, temasPredefinidos } = useTheme();
  const muiTheme = useMuiTheme();

  const handleCambiarTema = async (keyTema) => {
    await cambiarTema(keyTema);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <PaletteIcon sx={{ fontSize: 50, color: 'primary.main' }} />
        </Box>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Personalización de Tema
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Elige el tema de colores que más te guste. Todos los temas mantienen las mismas funcionalidades,
          solo cambia la apariencia visual para mejorar tu experiencia.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {Object.entries(temasPredefinidos).map(([key, tema]) => {
          const esSeleccionado = key === temaSeleccionado;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Fade in={true} timeout={500}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    cursor: 'pointer',
                    border: esSeleccionado ? 3 : 1,
                    borderColor: esSeleccionado ? 'primary.main' : 'divider',
                    transition: 'all 0.3s ease',
                    transform: esSeleccionado ? 'scale(1.02)' : 'scale(1)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleCambiarTema(key)}
                >
                  {esSeleccionado && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 1,
                      }}
                    >
                      <CheckCircleIcon
                        sx={{
                          fontSize: 32,
                          color: 'primary.main',
                          bgcolor: 'background.paper',
                          borderRadius: '50%',
                        }}
                      />
                    </Box>
                  )}

                  <CardContent>
                    {/* Nombre del tema */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {tema.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tema.descripcion}
                      </Typography>
                    </Box>

                    {/* Vista previa de colores */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Colores principales:
                      </Typography>
                      <Grid container spacing={1}>
                        {/* Color primario */}
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 40,
                                bgcolor: tema.colores.primary.main,
                                borderRadius: 1,
                                mb: 0.5,
                                boxShadow: 1,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Primario
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Color secundario */}
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 40,
                                bgcolor: tema.colores.secondary.main,
                                borderRadius: 1,
                                mb: 0.5,
                                boxShadow: 1,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Secundario
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Color de éxito */}
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 30,
                                bgcolor: tema.colores.success.main,
                                borderRadius: 1,
                                mb: 0.5,
                                boxShadow: 1,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Éxito
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Color de advertencia */}
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 30,
                                bgcolor: tema.colores.warning.main,
                                borderRadius: 1,
                                mb: 0.5,
                                boxShadow: 1,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Alerta
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Color de error */}
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 30,
                                bgcolor: tema.colores.error.main,
                                borderRadius: 1,
                                mb: 0.5,
                                boxShadow: 1,
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                              Error
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Botón de selección */}
                    <Button
                      fullWidth
                      variant={esSeleccionado ? 'contained' : 'outlined'}
                      sx={{
                        bgcolor: esSeleccionado ? tema.colores.primary.main : 'transparent',
                        borderColor: tema.colores.primary.main,
                        color: esSeleccionado ? '#fff' : tema.colores.primary.main,
                        '&:hover': {
                          bgcolor: esSeleccionado ? tema.colores.primary.dark : tema.colores.primary.light,
                          borderColor: tema.colores.primary.dark,
                        },
                      }}
                    >
                      {esSeleccionado ? 'Tema Actual' : 'Seleccionar'}
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>

      {/* Información adicional */}
      <Box sx={{ mt: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Brightness4Icon sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              ¿Por qué personalizar tu tema?
            </Typography>
          </Box>
          <Typography variant="body2">
            La personalización de colores te permite adaptar la interfaz a tus preferencias personales,
            mejorando tu comodidad visual y experiencia de uso. Cada tema está diseñado profesionalmente
            para mantener la legibilidad y accesibilidad en todas las funcionalidades del sistema.
          </Typography>
        </Paper>
      </Box>

      {/* Nota técnica */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Tu preferencia de tema se guarda automáticamente y se aplica en todos tus dispositivos
        </Typography>
      </Box>
    </Container>
  );
};

export default ThemeSelector;
