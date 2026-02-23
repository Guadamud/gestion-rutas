import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Alert, Collapse, IconButton, Box, Typography } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from "./context/ThemeContext";

// Páginas de Autenticación
import Home from "./Pages/Shared/Home";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";

// Páginas del Administrador
import AdminPage from "./Pages/Admin/AdminPage";
import FrecuenciasAdmin from "./Pages/Admin/FrecuenciasAdmin";
import RutasAdmin from "./Pages/Admin/RutasAdmin";
import BusesAdmin from "./Pages/Admin/BusesAdmin";
import UsuariosAdmin from "./Pages/Admin/UsuariosAdmin";
import ConductoresAdmin from "./Pages/Admin/ConductoresAdmin";
import CooperativasAdmin from "./Pages/Admin/CooperativasAdmin";
import ConfiguracionAdmin from "./Pages/Admin/ConfiguracionAdmin";
import LimitesRutaBusAdmin from "./Pages/Admin/LimitesRutaBusAdmin";

// Páginas del Tesorero
import TesoreriaPage from "./Pages/Tesorero/TesoreriaPage";

// Páginas del Verificador
import VerificadorPage from "./Pages/Verificador/VerificadorPage";

// Páginas del Conductor
import ConductorPage from "./Pages/Conductor/ConductorPage";

// Páginas del Cliente
import ClientesPage from "./Pages/Cliente/ClientesPage";
import HistorialCompras from "./Pages/Cliente/HistorialCompras";

// Páginas Compartidas
import Dashboard from "./Pages/Shared/Dashboard";
import PerfilUsuario from "./Pages/Shared/PerfilUsuario";
import ClaveAutorizacionPage from "./Pages/Shared/ClaveAutorizacionPage";

// Componentes
import ThemeSelector from "./components/ThemeSelector";

import { useAuth } from "./context/AuthContext";
import { ClientesProvider } from "./context/ClientesContext";
import { Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const { user } = useAuth();
  const { temaActual, cargando } = useTheme();
  const [alertaMantenimiento, setAlertaMantenimiento] = useState(null);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  // Verificar estado de mantenimiento
  useEffect(() => {
    const verificarMantenimiento = async () => {
      if (!user) return; // Solo verificar si hay usuario autenticado
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/mantenimiento/configuracion-limpieza`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const config = response.data;
        
        if (config.esta_en_periodo_bloqueo) {
          const finBloqueo = new Date(config.fecha_fin_bloqueo);
          setAlertaMantenimiento({
            severity: 'error',
            message: `🚫 Sistema en mantenimiento. No se pueden registrar frecuencias hasta el ${finBloqueo.toLocaleDateString('es-ES')} a las ${finBloqueo.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
          });
          setMostrarAlerta(true);
        } else if (config.debe_notificar) {
          const inicioBloqueo = new Date(config.fecha_inicio_bloqueo);
          const finBloqueo = new Date(config.fecha_fin_bloqueo);
          const fechaLimpieza = new Date(config.fecha_limpieza);
          
          setAlertaMantenimiento({
            severity: 'warning',
            message: `⚠️ ATENCIÓN: El sistema realizará una limpieza en ${config.dias_restantes} días (${fechaLimpieza.toLocaleDateString('es-ES')} a las ${fechaLimpieza.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}). El sistema estará sin funcionar desde el ${inicioBloqueo.toLocaleDateString('es-ES')} ${inicioBloqueo.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hasta el ${finBloqueo.toLocaleDateString('es-ES')} ${finBloqueo.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`
          });
          setMostrarAlerta(true);
        } else {
          setMostrarAlerta(false);
        }
      } catch (error) {
        console.error('Error al verificar mantenimiento:', error);
      }
    };
    
    verificarMantenimiento();
    
    // Verificar cada 30 minutos
    const interval = setInterval(verificarMantenimiento, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Redirección según rol
  const getMainRoute = () => {
    if (!user) return "/login";
    switch (user.rol) {
      case "admin":
        return "/admin";
      case "tesoreria":
        return "/tesoreria";
      case "cliente":
        return "/clientes";
      case "conductor":
        return "/conductor";
      case "verificador":
        return "/verificador";
      default:
        return "/dashboard";
    }
  };

  // Rutas públicas protegidas para usuarios autenticados
  const PublicRoute = ({ children }) => {
    if (user) {
      return <Navigate to={getMainRoute()} replace />;
    }
    return children;
  };

  // Componente para proteger rutas según rol
  const RoleRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.rol)) {
      return <Navigate to={getMainRoute()} replace />;
    }
    return children;
  };

  // Mostrar un loader mientras se carga el tema
  if (cargando) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#FAFBFC',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="primary">
            Cargando sistema...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={temaActual}>
      <CssBaseline />
      <ClientesProvider>
        <Router>
          <Navbar />
          
          {/* Alerta global de mantenimiento */}
          {user && (
            <Collapse in={mostrarAlerta}>
              <Box sx={{ position: 'sticky', top: 64, zIndex: 1100 }}>
                <Alert 
                  severity={alertaMantenimiento?.severity || 'info'}
                  action={
                    <IconButton
                      aria-label="cerrar"
                      color="inherit"
                      size="small"
                      onClick={() => setMostrarAlerta(false)}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                  sx={{ 
                    borderRadius: 0,
                    boxShadow: 2
                  }}
                >
                  {alertaMantenimiento?.message}
                </Alert>
              </Box>
            </Collapse>
          )}
          
          <Routes>
            <Route path="/" element={
              <PublicRoute>
                <Home />
              </PublicRoute>
            } />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } /> 
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <RoleRoute allowedRoles={['admin']}>
                <Dashboard />
              </RoleRoute>
            } />
            <Route path="/admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <AdminPage />
              </RoleRoute>
            } />
            <Route path="/tesoreria" element={
              <RoleRoute allowedRoles={['admin', 'tesoreria']}>
                <TesoreriaPage />
              </RoleRoute>
            } />
            <Route path="/clientes" element={
              <RoleRoute allowedRoles={['cliente']}>
                <ClientesPage />
              </RoleRoute>
            } />
            <Route path="/historial-compras" element={
              <RoleRoute allowedRoles={['cliente']}>
                <HistorialCompras />
              </RoleRoute>
            } />
            <Route path="/conductor" element={
              <RoleRoute allowedRoles={['conductor']}>
                <ConductorPage />
              </RoleRoute>
            } />
            <Route path="/frecuencias-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <FrecuenciasAdmin />
              </RoleRoute>
            } />
            <Route path="/rutas-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <RutasAdmin />
              </RoleRoute>
            } />
            <Route path="/buses-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <BusesAdmin />
              </RoleRoute>
            } />
            <Route path="/limites-ruta-bus-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <LimitesRutaBusAdmin />
              </RoleRoute>
            } />
            <Route path="/usuarios-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <UsuariosAdmin />
              </RoleRoute>
            } />
            <Route path="/conductores-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <ConductoresAdmin />
              </RoleRoute>
            } />
            <Route path="/cooperativas-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <CooperativasAdmin />
              </RoleRoute>
            } />
            <Route path="/verificador" element={
              <RoleRoute allowedRoles={['verificador', 'admin', 'tesoreria']}>
                <VerificadorPage />
              </RoleRoute>
            } />
            <Route path="/configuracion-admin" element={
              <RoleRoute allowedRoles={['admin']}>
                <ConfiguracionAdmin />
              </RoleRoute>
            } />
            <Route path="/clave-autorizacion" element={
              <RoleRoute allowedRoles={['admin']}>
                <ClaveAutorizacionPage />
              </RoleRoute>
            } />
            <Route path="/perfil" element={
              <RoleRoute allowedRoles={['admin', 'tesoreria', 'cliente', 'conductor', 'verificador']}>
                <PerfilUsuario />
              </RoleRoute>
            } />
            <Route path="/personalizar-tema" element={
              <RoleRoute allowedRoles={['admin', 'tesoreria', 'cliente', 'conductor', 'verificador']}>
                <ThemeSelector />
              </RoleRoute>
            } />
          </Routes>
        </Router>
      </ClientesProvider>
    </ThemeProvider>
  );
}

export default App;
