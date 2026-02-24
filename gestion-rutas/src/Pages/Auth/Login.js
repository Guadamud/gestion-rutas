import { useState } from "react";
import useAutoAlert from '../../hooks/useAutoAlert';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { professionalColors } from '../../utils/professionalColors';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Alert,
  Fade,
  useTheme,
  useMediaQuery,
  CircularProgress
} from "@mui/material";
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd
} from "@mui/icons-material";
import logoPajan from '../../assets/logo pajan.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useAutoAlert(10000);
  const [success, setSuccess] = useAutoAlert(10000);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Por favor ingresa tu email y contraseña");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // Guardar token
      localStorage.setItem('token', data.token);
      
      // Guardar usuario y hacer login
      login(data.user);

      // Mostrar mensaje de éxito
      setSuccess(`¡Bienvenido ${data.user.nombres}! Ingresando al sistema...`);
      setLoading(false);

      // Redirigir después de mostrar el mensaje
      setTimeout(() => {
        switch (data.user.rol) {
          case "admin":
            navigate("/admin");
            break;
          case "tesoreria":
            navigate("/tesoreria");
            break;
          case "cliente":
            navigate("/clientes");
            break;
          default:
            navigate("/dashboard");
        }
      }, 2000);
      
      return;

    } catch (err) {
      console.error('Error de login:', err);
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: professionalColors.background.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: 'relative',
        p: { xs: 2, sm: 3 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${professionalColors.primary[100]} 0%, ${professionalColors.secondary[100]} 100%)`,
          zIndex: 0
        }
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            border: '1px solid',
            borderColor: professionalColors.border.light,
            overflow: 'hidden',
            backgroundColor: professionalColors.background.paper,
            width: '100%',
            maxWidth: { xs: '100%', sm: 480 },
            mx: 'auto'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${professionalColors.primary[500]} 0%, ${professionalColors.primary[600]} 100%)`,
              color: professionalColors.text.inverse,
              py: { xs: 2, sm: 2.5 },
              px: { xs: 2, sm: 3 },
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1
              }}
            >
              <img
                src={logoPajan}
                alt="Logo Paján"
                style={{ width: 220, height: 220, objectFit: 'contain' }}
              />
            </Box>
            <Typography 
              variant="h4" 
              fontWeight="600" 
              gutterBottom
              sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}
            >
              Sistema de Rutas
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Gestión integral de transporte urbano
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box mb={{ xs: 2, sm: 3 }}>
              <Typography 
                variant="h5" 
                fontWeight="600" 
                color={professionalColors.text.primary} 
                gutterBottom
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
              >
                Iniciar Sesión
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                Ingresa tus credenciales para acceder al sistema
              </Typography>
            </Box>

            {error && (
              <Fade in={!!error}>
                <Alert 
                  severity="error" 
                  sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {success && (
              <Fade in={!!success}>
                <Alert severity="success" sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                  {success}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleLogin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{
                    py: { xs: 1.25, sm: 1.5 },
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: { xs: '0.95rem', sm: '1rem' },
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${professionalColors.primary[500]} 0%, ${professionalColors.primary[600]} 100%)`,
                    boxShadow: `0 4px 12px ${professionalColors.primary[200]}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${professionalColors.primary[600]} 0%, ${professionalColors.primary[700]} 100%)`,
                      boxShadow: `0 6px 16px ${professionalColors.primary[300]}`,
                    },
                    '&:disabled': {
                      background: professionalColors.background.disabled,
                    }
                  }}
                >
                  {loading ? "Iniciando sesión..." : "Ingresar"}
                </Button>
              </Box>
            </form>

            <Box 
              sx={{ 
                mt: { xs: 3, sm: 4 }, 
                pt: { xs: 3, sm: 4 }, 
                borderTop: '1px solid',
                borderColor: professionalColors.border.light,
                textAlign: 'center'
              }}
            >
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
              >
                ¿Problemas para ingresar? Contacta al administrador
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                size={isMobile ? "medium" : "large"}
                startIcon={<PersonAdd />}
                onClick={() => navigate("/register")}
                disabled={loading}
                sx={{
                  py: { xs: 1, sm: 1.25 },
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  fontWeight: 500,
                  borderColor: professionalColors.primary[500],
                  color: professionalColors.primary[500],
                  '&:hover': {
                    borderColor: professionalColors.primary[600],
                    backgroundColor: professionalColors.primary[50],
                  }
                }}
              >
                Crear una cuenta
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            © 2025 Sistema de Gestión de Rutas. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
