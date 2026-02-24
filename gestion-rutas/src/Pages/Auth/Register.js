import { useState } from "react";
import useAutoAlert from '../../hooks/useAutoAlert';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { professionalColors } from '../../utils/professionalColors';
import {
  TextField,
  Button,
  Container,
  Typography,
  MenuItem,
  Paper,
  Box,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Alert,
  Fade,
  Grid,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import {
  Person,
  Email,
  Lock,
  Phone,
  Badge,
  Visibility,
  VisibilityOff,
  PersonAdd,
  DirectionsBus,
  ArrowBack
} from "@mui/icons-material";

const Register = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("cliente");
  const [error, setError] = useAutoAlert(10000);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validarCampos = () => {
    const soloNumeros = /^[0-9]+$/;
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!nombres || !apellidos || !cedula || !celular || !email || !password) {
      return "Todos los campos son obligatorios.";
    }
    if (!soloNumeros.test(cedula) || (cedula.length !== 10 && cedula.length !== 13)) {
      return "La cédula debe tener 10 dígitos o el RUC debe tener 13 dígitos numéricos.";
    }
    if (!soloNumeros.test(celular) || celular.length < 9 || celular.length > 10) {
      return "El celular debe tener entre 9 y 10 dígitos numéricos.";
    }
    if (!correoRegex.test(email)) {
      return "El correo electrónico no es válido.";
    }
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }

    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validacion = validarCampos();
    if (validacion) {
      setError(validacion);
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/register`, {
        nombres,
        apellidos,
        cedula,
        celular,
        email,
        password,
        rol,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: 'background.default',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
          zIndex: 0
        }
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              color: 'white',
              py: 4,
              px: 3,
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
                p: 1.5,
                mb: 2
              }}
            >
              <DirectionsBus sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Únete al Sistema
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Crea tu cuenta para acceder a nuestros servicios
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Back to Login Button */}
            <Box mb={3} display="flex" alignItems="center">
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate("/login")}
                sx={{ textTransform: 'none' }}
              >
                Volver al Login
              </Button>
            </Box>

            {error && (
              <Fade in={!!error}>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleRegister}>
              <Grid container spacing={3}>
                {/* Información Personal */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombres"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellidos"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cédula / RUC"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required
                    inputProps={{ maxLength: 13 }}
                    helperText="Cédula: 10 dígitos | RUC: 13 dígitos"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Celular"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    required
                    inputProps={{ maxLength: 10 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<PersonAdd />}
                sx={{ 
                  mt: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #5b21b6 100%)',
                  }
                }}
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </Button>
            </form>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes una cuenta?{' '}
                <Button 
                  onClick={() => navigate("/login")}
                  sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                  Inicia sesión aquí
                </Button>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
