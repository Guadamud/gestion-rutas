import React, { useEffect, useState } from 'react';
import RoleHeader from '../../components/RoleHeader';
import {
  Container, Typography, Card, CardContent, Grid, Box, 
  Button, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, FormControl, InputLabel,
  Select, Divider, Avatar, Paper, Alert, TableContainer,
  Stack, Badge, CircularProgress, InputAdornment, AlertTitle, useTheme
} from '@mui/material';
import {
  DirectionsBus, Schedule, MonetizationOn, Route, Person,
  Add, Refresh, Payment, QrCode, CheckCircle, PendingActions,
  Cancel, Edit, Delete, AccountBalanceWallet, AttachMoney,
  History, PersonAdd, CreditCard, TrendingUp, TrendingDown,
  ToggleOn, ToggleOff, Visibility, VisibilityOff, QrCode2,
  ChevronLeft, ChevronRight
} from '@mui/icons-material';
import CustomSnackbar from '../../components/CustomSnackbar';
import QRTicketDialog from '../../components/QRTicketDialog';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Función para convertir hora de 24h a 12h AM/PM
const convertirHoraAMPM = (hora24) => {
  if (!hora24) return '';
  const [horas, minutos] = hora24.split(':');
  const h = parseInt(horas);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutos} ${ampm}`;
};

const DuenoBusPage = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [duenoBus, setDuenoBus] = useState(null);
  const [conductores, setConductores] = useState([]);
  const [buses, setBuses] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [frecuencias, setFrecuencias] = useState([]);
  const [rutasDisponibles, setRutasDisponibles] = useState([]);
  const [solicitudesConductores, setSolicitudesConductores] = useState([]);
  const [cooperativas, setCooperativas] = useState([]);
  
  // Estados de diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [openBusDialog, setOpenBusDialog] = useState(false);
  const [openSaldoDialog, setOpenSaldoDialog] = useState(false);
  const [openCompraSaldoDialog, setOpenCompraSaldoDialog] = useState(false);
  const [openFrecuenciaDialog, setOpenFrecuenciaDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedFrecuencia, setSelectedFrecuencia] = useState(null);
  const [editando, setEditando] = useState(false);
  
  // Vista actual
  const [vistaActual, setVistaActual] = useState('saldo');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  });
  
  // Paginación para frecuencias
  const [paginaFrecuencias, setPaginaFrecuencias] = useState(0);
  const filasPorPaginaFrecuencias = 5;

  // Formularios
  const [form, setForm] = useState({
    id: null,
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    password: '',
    tipoLicencia: '',
    vencimientoLicencia: ''
  });

  const [formBus, setFormBus] = useState({
    numero: '',
    placa: '',
    modelo: '',
    empresa: ''
  });

  const [formSaldo, setFormSaldo] = useState({
    conductorId: null,
    monto: 0,
    tipo: 'recarga',
    metodoPago: 'efectivo',
    descripcion: ''
  });

  const [formCompraSaldo, setFormCompraSaldo] = useState({
    monto: 0,
    metodoPago: 'transferencia',
    descripcion: '',
    comprobante: null,
    comprobantePreview: null
  });

  const [formFrecuencia, setFormFrecuencia] = useState({
    conductorId: null,
    rutaId: '',
    busId: '',
    horaSalida: '',
    horaLlegada: '',
    fechaSalida: (() => {
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    })()
  });

  const [conductorSeleccionado, setConductorSeleccionado] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const colors = {
    primary: theme.palette.primary.main,
    surface: theme.palette.background.paper,
    text: theme.palette.text
  };

  const mostrarAlerta = (mensaje, tipo = 'success') => {
    setSnackbar({ open: true, message: mensaje, severity: tipo });
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      cargarDatosDuenoBus();
      cargarRutas();
      cargarFrecuencias();
    }
  }, [user]);

  const cargarDatosDuenoBus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Obtener información del cliente
      const resDuenoBus = await fetch(`${API_URL}/api/clientes/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resDuenoBus.ok) {
        const dataDuenoBus = await resDuenoBus.json();
        
        if (!dataDuenoBus) {
          mostrarAlerta('No se encontró perfil de duenoBus. Por favor, contacta al administrador.', 'warning');
          return;
        }
        
        setDuenoBus(dataDuenoBus);
        
        // Cargar conductores del duenoBus
        await cargarConductores(dataDuenoBus.id);
        
        // Cargar buses del duenoBus
        await cargarBuses(dataDuenoBus.id);
        
        // Cargar solicitudes de conductores
        await cargarSolicitudesConductores(dataDuenoBus.id);
      } else {
        const errorData = await resDuenoBus.json();
        console.error('Error al cargar duenoBus:', errorData);
        mostrarAlerta(errorData.message || 'No se encontró perfil de duenoBus', 'error');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarAlerta('Error al cargar información del duenoBus', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarSolicitudesConductores = async (duenoBusId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/clientes/solicitudes/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        // Filtrar TODAS las solicitudes de conductores para este duenoBus (sin filtrar por estado)
        const solicitudesFiltradas = data.filter(
          sol => sol.clienteId === duenoBusId && 
                 sol.solicitadoPor === 'conductor'
        );
        // Ordenar por fecha descendente (más recientes primero)
        solicitudesFiltradas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSolicitudesConductores(solicitudesFiltradas);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes de conductores:', error);
    }
  };

  const cargarConductores = async (duenoBusId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/conductores/cliente/${duenoBusId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setConductores(data);
      }
    } catch (error) {
      console.error('Error al cargar conductores:', error);
    }
  };

  const cargarBuses = async (duenoBusId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/buses/cliente/${duenoBusId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setBuses(data);
      }
    } catch (error) {
      console.error('Error al cargar buses:', error);
    }
  };

  const cargarRutas = async () => {
    try {
      const token = localStorage.getItem('token');
      const [rutasRes, cooperativasRes] = await Promise.all([
        fetch(`${API_URL}/api/rutas`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/cooperativas`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (rutasRes.ok) {
        const data = await rutasRes.json();
        setRutasDisponibles(data);
      }
      
      if (cooperativasRes.ok) {
        const cooperativasData = await cooperativasRes.json();
        setCooperativas(cooperativasData);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const cargarTransacciones = async (conductorId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/conductores/${conductorId}/transacciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTransacciones(data);
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  const cargarFrecuencias = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/frecuencias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFrecuencias(data);
      }
    } catch (error) {
      console.error('Error al cargar frecuencias:', error);
    }
  };

  // Funciones de conductores
  const abrirDialog = (conductor = null) => {
    if (conductor) {
      setEditando(true);
      setForm({
        id: conductor.id,
        nombre: conductor.nombre,
        cedula: conductor.cedula,
        telefono: conductor.telefono,
        email: conductor.email || '',
        tipoLicencia: conductor.tipoLicencia,
        vencimientoLicencia: conductor.vencimientoLicencia
      });
    } else {
      setEditando(false);
      setForm({
        id: null,
        nombre: '',
        cedula: '',
        telefono: '',
        email: '',
        tipoLicencia: '',
        vencimientoLicencia: ''
      });
    }
    setOpenDialog(true);
  };

  const guardarConductor = async () => {
    if (!form.nombre || !form.cedula || !form.telefono || !form.email || !form.tipoLicencia || !form.vencimientoLicencia) {
      mostrarAlerta('Por favor complete todos los campos obligatorios', 'warning');
      return;
    }

    // Validar cédula (10 dígitos) o RUC (13 dígitos)
    const soloNumeros = /^[0-9]+$/;
    if (!soloNumeros.test(form.cedula) || (form.cedula.length !== 10 && form.cedula.length !== 13)) {
      mostrarAlerta('La cédula debe tener 10 dígitos o el RUC debe tener 13 dígitos', 'error');
      return;
    }

    // Validar teléfono (10 dígitos y debe empezar con 0)
    if (!soloNumeros.test(form.telefono) || form.telefono.length !== 10) {
      mostrarAlerta('El teléfono debe tener exactamente 10 dígitos', 'error');
      return;
    }

    if (!form.telefono.startsWith('0')) {
      mostrarAlerta('El teléfono debe empezar con 0', 'error');
      return;
    }

    if (!editando && !form.password) {
      mostrarAlerta('La contraseÁ±a es obligatoria para nuevos conductores', 'warning');
      return;
    }

    if (!duenoBus || !duenoBus.id) {
      mostrarAlerta('No se ha cargado la información del duenoBus. Por favor, recarga la página.', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editando 
        ? `${API_URL}/api/conductores/${form.id}`
        : `${API_URL}/api/conductores`;
      
      const method = editando ? 'PUT' : 'POST';
      
      const body = editando 
        ? {
            nombre: form.nombre,
            telefono: form.telefono,
            email: form.email,
            tipoLicencia: form.tipoLicencia,
            vencimientoLicencia: form.vencimientoLicencia
          }
        : {
            clienteId: duenoBus.id,
            nombre: form.nombre,
            cedula: form.cedula,
            telefono: form.telefono,
            email: form.email,
            password: form.password,
            tipoLicencia: form.tipoLicencia,
            vencimientoLicencia: form.vencimientoLicencia
          };

      console.log('Enviando conductor:', body);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const responseData = await res.json();

      if (res.ok) {
        mostrarAlerta(editando ? 'Conductor actualizado' : 'Conductor agregado correctamente', 'success');
        setOpenDialog(false);
        await cargarConductores(duenoBus.id);
      } else {
        console.error('Error del servidor:', responseData);
        mostrarAlerta(responseData.message || 'Error al guardar conductor', 'error');
      }
    } catch (error) {
      console.error('Error al guardar conductor:', error);
      mostrarAlerta('Error de conexión al guardar conductor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eliminarConductor = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este conductor?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/conductores/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        mostrarAlerta('Conductor eliminado', 'success');
        await cargarConductores(duenoBus.id);
      } else {
        mostrarAlerta('Error al eliminar conductor', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al eliminar conductor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const alternarEstadoConductor = async (conductor) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const nuevoEstado = conductor.estado === 'activo' ? 'inactivo' : 'activo';
      
      const res = await fetch(`${API_URL}/api/conductores/${conductor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...conductor, estado: nuevoEstado })
      });

      if (res.ok) {
        mostrarAlerta(`Conductor ${nuevoEstado}`, 'success');
        await cargarConductores(duenoBus.id);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al cambiar estado', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de saldo
  const abrirSaldoDialog = (conductor) => {
    setConductorSeleccionado(conductor);
    setFormSaldo({
      conductorId: conductor.id,
      monto: 0,
      tipo: 'recarga',
      metodoPago: 'efectivo',
      descripcion: 'Recarga de saldo'
    });
    setOpenSaldoDialog(true);
    cargarTransacciones(conductor.id);
  };

  const guardarTransaccion = async () => {
    if (!formSaldo.monto || formSaldo.monto <= 0) {
      mostrarAlerta('Ingrese un monto válido', 'warning');
      return;
    }

    // Validar que el duenoBus tenga saldo suficiente
    const saldoDuenoBus = parseFloat(duenoBus?.saldo || 0);
    if (saldoDuenoBus < formSaldo.monto) {
      mostrarAlerta(`Saldo insuficiente. Tu saldo actual es $${saldoDuenoBus.toFixed(2)}. Por favor, compra saldo primero.`, 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/conductores/${formSaldo.conductorId}/saldo`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formSaldo)
      });

      if (res.ok) {
        mostrarAlerta('Saldo actualizado correctamente', 'success');
        setOpenSaldoDialog(false);
        await cargarConductores(duenoBus.id);
        await cargarDatosDuenoBus(); // Recargar datos del duenoBus
      } else {
        mostrarAlerta('Error al actualizar saldo', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al actualizar saldo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para comprar saldo
  const comprarSaldo = async () => {
    if (!formCompraSaldo.monto || formCompraSaldo.monto <= 0) {
      mostrarAlerta('Ingrese un monto válido', 'warning');
      return;
    }

    // Validar comprobante para depósito y transferencia
    if ((formCompraSaldo.metodoPago === 'deposito' || formCompraSaldo.metodoPago === 'transferencia') && !formCompraSaldo.comprobante) {
      mostrarAlerta('Debe subir el comprobante de pago para depósitos y transferencias', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/clientes/${duenoBus.id}/comprar-saldo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formCompraSaldo)
      });

      if (res.ok) {
        mostrarAlerta('Solicitud de compra de saldo enviada. El administrador la aprobará pronto.', 'success');
        setOpenCompraSaldoDialog(false);
        setFormCompraSaldo({ monto: 0, metodoPago: 'transferencia', descripcion: '', comprobante: null, comprobantePreview: null });
        await cargarDatosDuenoBus();
      } else {
        const error = await res.json();
        mostrarAlerta(error.message || 'Error al solicitar compra de saldo', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al solicitar compra de saldo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComprobanteChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        mostrarAlerta('El archivo no debe superar los 5MB', 'warning');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        mostrarAlerta('Solo se permiten imágenes', 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormCompraSaldo(prev => ({
          ...prev,
          comprobante: reader.result,
          comprobantePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Funciones de buses
  const abrirBusDialog = () => {
    setFormBus({ numero: '', placa: '', modelo: '', empresa: '' });
    setOpenBusDialog(true);
  };

  const guardarBus = async () => {
    if (!formBus.numero || !formBus.placa || !formBus.modelo || !formBus.empresa) {
      mostrarAlerta('Complete todos los campos', 'warning');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          numero: formBus.numero,
          placa: formBus.placa,
          modelo: formBus.modelo,
          empresa: formBus.empresa,
          capacidad: formBus.capacidad || 45,
          usuarioId: duenoBus.id
        })
      });

      if (res.ok) {
        mostrarAlerta('Bus agregado correctamente', 'success');
        setOpenBusDialog(false);
        await cargarBuses(duenoBus.id);
      } else {
        const errorData = await res.json();
        mostrarAlerta(errorData.message || 'Error al agregar bus', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al agregar bus', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoBus = async (busId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/buses/${busId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const data = await res.json();

      if (res.ok) {
        mostrarAlerta(`Bus ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, 'success');
        // Recargar los buses desde el servidor para obtener datos actualizados
        if (duenoBus && duenoBus.id) {
          await cargarBuses(duenoBus.id);
        }
      } else {
        // Manejar error específico de bus desactivado por admin
        if (data.codigoError === 'BUS_DESACTIVADO_ADMIN') {
          mostrarAlerta(data.message, 'error');
        } else {
          mostrarAlerta(data.message || 'Error al cambiar estado del bus', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('Error al cambiar estado del bus', 'error');
    }
  };

  // Funciones de frecuencias
  const abrirFrecuenciaDialog = (conductor) => {
    setConductorSeleccionado(conductor);
    setFormFrecuencia({
      conductorId: conductor.id,
      rutaId: '',
      busId: '',
      horaSalida: '',
      horaLlegada: '',
      fechaSalida: (() => {
        const hoy = new Date();
        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      })()
    });
    setOpenFrecuenciaDialog(true);
  };

  const guardarFrecuencia = async () => {
    if (!formFrecuencia.rutaId || !formFrecuencia.busId || !formFrecuencia.horaSalida) {
      mostrarAlerta('Complete todos los campos', 'warning');
      return;
    }

    const rutaSeleccionada = rutasDisponibles.find(r => r.id === parseInt(formFrecuencia.rutaId));
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const datosEnviar = {
        conductorId: parseInt(formFrecuencia.conductorId),
        busId: parseInt(formFrecuencia.busId),
        rutaId: parseInt(formFrecuencia.rutaId),
        horaSalida: formFrecuencia.horaSalida,
        fecha: formFrecuencia.fechaSalida,
        fechaSalida: formFrecuencia.fechaSalida
      };

      console.log('Enviando datos:', datosEnviar);
      
      // Crear la frecuencia
      const resFrecuencia = await fetch(`${API_URL}/api/frecuencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datosEnviar)
      });

      if (resFrecuencia.ok) {
        // Actualizar contador de frecuencias del conductor
        await fetch(`${API_URL}/api/conductores/${formFrecuencia.conductorId}/frecuencia`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ costoFrecuencia: rutaSeleccionada.precio })
        });

        mostrarAlerta('Frecuencia registrada correctamente', 'success');
        setOpenFrecuenciaDialog(false);
        await cargarConductores(duenoBus.id);
        await cargarFrecuencias();
      } else {
        const errorData = await resFrecuencia.json();
        console.error('Error del servidor:', errorData);
        
        // Manejar específicamente el error de límite de rutas
        if (errorData.error === 'LÍMITE DE RUTA ALCANZADO') {
          const mensaje = `⚠️ ${errorData.message}\n\nEste bus ha alcanzado su límite de ${errorData.limiteDiario} viaje(s) en la ruta "${errorData.ruta}" por día. Ya tiene ${errorData.frecuenciasRegistradas} frecuencia(s) registrada(s).`;
          mostrarAlerta(mensaje, 'warning');
        } else if (errorData.error === 'LÍMITE DE FRECUENCIAS ALCANZADO') {
          const mensaje = `⚠️ ${errorData.message}\n\nEste bus ha alcanzado su límite de ${errorData.limiteRutas} frecuencia(s) diarias. Ya tiene ${errorData.frecuenciasRegistradas} frecuencia(s) para esta fecha.`;
          mostrarAlerta(mensaje, 'warning');
        } else {
          mostrarAlerta(errorData.message || errorData.error || 'Error al registrar frecuencia', 'error');
        }
      }
    } catch (error) {
      console.error('Error completo:', error);
      mostrarAlerta('Error al registrar frecuencia', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos
  const calcularTotales = () => {
    const saldoDuenoBus = parseFloat(duenoBus?.saldo || 0);
    const saldoDistribuido = conductores.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0);
    const totalFrecuencias = conductores.reduce((sum, c) => sum + (c.totalFrecuencias || 0), 0);
    const totalIngresos = conductores.reduce((sum, c) => sum + parseFloat(c.ingresosTotales || 0), 0);
    // Gastos totales = saldo actualmente en conductores + lo que los conductores ya cobraron/gastaron
    const totalGastos = saldoDistribuido + totalIngresos;
    
    return { saldoDuenoBus, saldoDistribuido, totalFrecuencias, totalIngresos, totalGastos };
  };

  const totales = calcularTotales();

  if (loading && !duenoBus) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header con rol distintivo */}
      <RoleHeader 
        rol="cliente" 
        titulo="Panel de Cliente"
        subtitulo={duenoBus ? `${duenoBus.nombres} ${duenoBus.apellidos}` : 'Gestión de Conductores y Buses'}
      />
      
      {/* Tarjetas de resumen */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Card sx={{ bgcolor: colors.surface, boxShadow: 2, minHeight: 140, flex: '0 0 calc(18% - 16px)', minWidth: 180, maxWidth: 'calc(18% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                <AccountBalanceWallet />
              </Avatar>
              <Typography variant="h6" sx={{ color: colors.text.secondary }}>
                Mi Saldo Disponible
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
              ${totales.saldoDuenoBus.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Saldo para transferir
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: colors.surface, boxShadow: 2, minHeight: 140, flex: '0 0 calc(18% - 16px)', minWidth: 180, maxWidth: 'calc(18% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                <Person />
              </Avatar>
              <Typography variant="h6" sx={{ color: colors.text.secondary }}>
                Conductores
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: colors.text.primary }}>
              {conductores.length}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Saldo distribuido: ${totales.saldoDistribuido.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: colors.surface, boxShadow: 2, minHeight: 140, flex: '0 0 calc(18% - 16px)', minWidth: 180, maxWidth: 'calc(18% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
                <DirectionsBus />
              </Avatar>
              <Typography variant="h6" sx={{ color: colors.text.secondary }}>
                Buses
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: colors.text.primary }}>
              {buses.length}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: colors.surface, boxShadow: 2, minHeight: 140, flex: '0 0 calc(18% - 16px)', minWidth: 180, maxWidth: 'calc(18% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main, mr: 2 }}>
                <Schedule />
              </Avatar>
              <Typography variant="h6" sx={{ color: colors.text.secondary }}>
                Frecuencias
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: colors.text.primary }}>
              {totales.totalFrecuencias}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: colors.surface, boxShadow: 2, minHeight: 140, flex: '0 0 calc(18% - 16px)', minWidth: 180, maxWidth: 'calc(18% - 16px)', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar sx={{ bgcolor: theme.palette.error.main, mr: 2 }}>
                <TrendingDown />
              </Avatar>
              <Typography variant="h6" sx={{ color: colors.text.secondary }}>
                Gastos
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: colors.text.primary }}>
              ${totales.totalGastos.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Historial de compras de saldo de conductores - OCULTO, ver en Mis Compras */}
      {/* {solicitudesConductores.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: colors.surface, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <History sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                  Historial de Compras de Saldo - Conductores
                </Typography>
                <Chip 
                  label={solicitudesConductores.length} 
                  size="small" 
                  sx={{ ml: 2, bgcolor: theme.palette.info.main, color: 'white' }}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={() => cargarSolicitudesConductores(duenoBus?.id)}
                disabled={loading}
              >
                Actualizar
              </Button>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: colors.text.secondary }}>
              Registro completo de todas las compras de saldo realizadas por tus conductores
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.accent }}>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Conductor</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Método</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {solicitudesConductores.map((sol) => {
                    const conductor = conductores.find(c => c.id === sol.conductorId);
                    const estadoColor = sol.estado === 'aprobada' 
                      ? theme.palette.success.main
                      : sol.estado === 'rechazada'
                      ? theme.palette.error.main
                      : theme.palette.warning.main;
                    
                    return (
                      <TableRow key={sol.id} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(sol.createdAt + 'Z').toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {conductor ? conductor.nombre : 'Desconocido'}
                            </Typography>
                            {conductor && (
                              <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                Lic: {conductor.licencia}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
                            ${parseFloat(sol.monto).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sol.metodoPago} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sol.estado.toUpperCase()}
                            size="small"
                            sx={{ 
                              bgcolor: estadoColor,
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            {sol.descripcion || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )} */}

      {/* Botones de acción */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AccountBalanceWallet />}
          onClick={() => setOpenCompraSaldoDialog(true)}
          sx={{ bgcolor: theme.palette.success.main }}
        >
          Comprar Saldo
        </Button>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => abrirDialog()}
          sx={{ bgcolor: colors.primary }}
        >
          Agregar Conductor
        </Button>
        <Button
          variant="outlined"
          startIcon={<DirectionsBus />}
          onClick={abrirBusDialog}
        >
          Agregar Bus
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => cargarConductores(duenoBus?.id)}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Tabla de conductores */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Conductores Registrados
          </Typography>
          
          {conductores.length === 0 ? (
            <Alert severity="info">No hay conductores registrados</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Cédula</strong></TableCell>
                    <TableCell><strong>Teléfono</strong></TableCell>
                    <TableCell><strong>Licencia</strong></TableCell>
                    <TableCell><strong>Saldo</strong></TableCell>
                    <TableCell><strong>Frecuencias</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conductores.map((conductor) => (
                    <TableRow key={conductor.id}>
                      <TableCell>{conductor.nombre}</TableCell>
                      <TableCell>{conductor.cedula}</TableCell>
                      <TableCell>{conductor.telefono}</TableCell>
                      <TableCell>
                        <Tooltip title={`Vence: ${conductor.vencimientoLicencia}`}>
                          <Chip 
                            label={conductor.tipoLicencia} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`$${parseFloat(conductor.saldo || 0).toFixed(2)}`}
                          color={conductor.saldo > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{conductor.totalFrecuencias || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={conductor.estado}
                          color={conductor.estado === 'activo' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Gestionar Saldo">
                            <IconButton 
                              size="small" 
                              onClick={() => abrirSaldoDialog(conductor)}
                              color="primary"
                            >
                              <Payment />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Registrar Frecuencia">
                            <IconButton 
                              size="small" 
                              onClick={() => abrirFrecuenciaDialog(conductor)}
                              color="info"
                            >
                              <Schedule />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              onClick={() => abrirDialog(conductor)}
                              color="warning"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={conductor.estado === 'activo' ? 'Desactivar' : 'Activar'}>
                            <IconButton 
                              size="small" 
                              onClick={() => alternarEstadoConductor(conductor)}
                            >
                              {conductor.estado === 'activo' ? <ToggleOn /> : <ToggleOff />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              onClick={() => eliminarConductor(conductor.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla de buses */}
      <Card sx={{ boxShadow: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Buses Registrados
          </Typography>
          
          {buses.length === 0 ? (
            <Alert severity="info">No hay buses registrados</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Placa</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Cooperativa</TableCell>
                    <TableCell>Capacidad</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {buses.map((bus) => (
                    <TableRow key={bus.id} hover>
                      <TableCell>
                        <Chip 
                          icon={<DirectionsBus />} 
                          label={bus.numero} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{bus.placa}</TableCell>
                      <TableCell>{bus.modelo}</TableCell>
                      <TableCell>{bus.empresa || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          icon={<Person />} 
                          label={`${bus.capacidad} pasajeros`} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={bus.estado} 
                          color={bus.estado === 'activo' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={bus.estado === 'activo' ? 'Desactivar Bus' : 'Activar Bus'}>
                          <IconButton
                            size="small"
                            onClick={() => cambiarEstadoBus(bus.id, bus.estado === 'activo' ? 'inactivo' : 'activo')}
                            color={bus.estado === 'activo' ? 'success' : 'default'}
                          >
                            {bus.estado === 'activo' ? <ToggleOn /> : <ToggleOff />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla de frecuencias registradas */}
      <Card sx={{ boxShadow: 3, mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Frecuencias Registradas
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Filtrar por Fecha"
                type="date"
                value={filtroFecha}
                onChange={(e) => {
                  setFiltroFecha(e.target.value);
                  setPaginaFrecuencias(0); // Resetear a la primera página
                }}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Chip 
                label={`${frecuencias.filter(f => f.fecha === filtroFecha).length} del día`} 
                color="warning" 
                icon={<Schedule />}
              />
            </Box>
          </Box>
          
          {frecuencias.filter(f => f.fecha === filtroFecha).length === 0 ? (
            <Alert severity="info">No hay frecuencias registradas para el {filtroFecha.split('-').reverse().join('/')}</Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora Salida</TableCell>
                      <TableCell>Conductor</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell>Bus</TableCell>
                      <TableCell align="center">Registrado Por</TableCell>
                      <TableCell align="center">Ticket</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {frecuencias
                      .filter(f => f.fecha === filtroFecha)
                      .slice(paginaFrecuencias * filasPorPaginaFrecuencias, paginaFrecuencias * filasPorPaginaFrecuencias + filasPorPaginaFrecuencias)
                      .map((frec, index) => (
                    <TableRow key={frec.id} hover>
                      <TableCell>
                        <Chip 
                          label={`#${paginaFrecuencias * filasPorPaginaFrecuencias + index + 1}`} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Schedule fontSize="small" color="action" />
                          {frec.fecha}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {convertirHoraAMPM(frec.horaSalida)}
                      </TableCell>
                      <TableCell>
                        {frec.Conductor ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person fontSize="small" color="primary" />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {frec.Conductor.nombre}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {frec.Conductor.cedula}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {frec.Ruta ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {frec.Ruta.origen} → {frec.Ruta.destino}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ${frec.Ruta.precio} • {frec.Ruta.distancia} km
                            </Typography>
                          </Box>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {frec.Bus ? (
                          <Chip 
                            icon={<DirectionsBus />}
                            label={`Bus ${frec.Bus.numero} - ${frec.Bus.placa}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={frec.registradoPor === "conductor" ? "Conductor" : "Dueño"}
                          size="small"
                          color={frec.registradoPor === "conductor" ? "info" : "secondary"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {frec.qrCode && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<QrCode2 />}
                            onClick={() => {
                              setSelectedFrecuencia(frec);
                              setOpenQRDialog(true);
                            }}
                            sx={{
                              bgcolor: frec.estadoVerificacion === 'usado' 
                                ? theme.palette.success.main
                                : theme.palette.warning.main,
                              color: '#fff',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: frec.estadoVerificacion === 'usado'
                                  ? theme.palette.success.dark
                                  : theme.palette.warning.dark
                              }
                            }}
                          >
                            {frec.estadoVerificacion === 'usado' ? 'Verificado' : 'Ver QR'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Controles de paginación */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, gap: 2 }}>
              <IconButton
                onClick={() => setPaginaFrecuencias(prev => Math.max(0, prev - 1))}
                disabled={paginaFrecuencias === 0}
                size="small"
              >
                <ChevronLeft />
              </IconButton>
              <Typography variant="body2">
                Página {paginaFrecuencias + 1} de {Math.ceil(frecuencias.filter(f => f.fecha === filtroFecha).length / filasPorPaginaFrecuencias) || 1}
              </Typography>
              <IconButton
                onClick={() => setPaginaFrecuencias(prev => prev + 1)}
                disabled={paginaFrecuencias >= Math.floor(frecuencias.filter(f => f.fecha === filtroFecha).length / filasPorPaginaFrecuencias)}
                size="small"
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Agregar/Editar Conductor */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editando ? 'Editar Conductor' : 'Agregar Conductor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nombre Completo"
              value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Cédula"
              value={form.cedula}
              onChange={(e) => setForm(prev => ({ ...prev, cedula: e.target.value }))}
              fullWidth
              required
              disabled={editando}
            />
            <TextField
              label="Teléfono"
              value={form.telefono}
              onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Contraseña"
              type={mostrarPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              required={!editando}
              placeholder="Mínimo 6 caracteres"
              helperText="La contraseña permitirá al conductor iniciar sesión en el sistema"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      edge="end"
                    >
                      {mostrarPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth required>
              <InputLabel shrink>Tipo de Licencia</InputLabel>
              <Select
                value={form.tipoLicencia}
                onChange={(e) => setForm(prev => ({ ...prev, tipoLicencia: e.target.value }))}
                label="Tipo de Licencia"
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>Seleccione tipo de licencia</em>
                </MenuItem>
                <MenuItem value="Tipo A">Tipo A</MenuItem>
                <MenuItem value="Tipo B">Tipo B</MenuItem>
                <MenuItem value="Tipo C">Tipo C</MenuItem>
                <MenuItem value="Tipo D">Tipo D</MenuItem>
                <MenuItem value="Tipo E">Tipo E</MenuItem>
                <MenuItem value="Tipo F">Tipo F</MenuItem>
                <MenuItem value="Tipo G">Tipo G</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Vencimiento de Licencia"
              type="date"
              value={form.vencimientoLicencia}
              onChange={(e) => setForm(prev => ({ ...prev, vencimientoLicencia: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={guardarConductor}
            disabled={loading}
          >
            {editando ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Comprar Saldo */}
      <Dialog open={openCompraSaldoDialog} onClose={() => setOpenCompraSaldoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceWallet color="primary" />
            <Typography variant="h6">Comprar Saldo</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
            Tu saldo actual: <strong>${Number(duenoBus?.saldo || 0).toFixed(2)}</strong>
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Monto a Comprar"
              type="number"
              value={formCompraSaldo.monto}
              onChange={(e) => setFormCompraSaldo(prev => ({ ...prev, monto: parseFloat(e.target.value) }))}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              helperText="Ingrese el monto que desea agregar a su saldo"
            />
            <FormControl fullWidth required>
              <InputLabel shrink>Método de Pago</InputLabel>
              <Select
                value={formCompraSaldo.metodoPago}
                onChange={(e) => setFormCompraSaldo(prev => ({ ...prev, metodoPago: e.target.value, comprobante: null, comprobantePreview: null }))}
                label="Método de Pago"
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>Seleccione método de pago</em>
                </MenuItem>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia Bancaria</MenuItem>
                <MenuItem value="deposito">Depósito</MenuItem>
              </Select>
            </FormControl>

            {/* Mostrar selector de comprobante solo para depósito y transferencia */}
            {(formCompraSaldo.metodoPago === 'deposito' || formCompraSaldo.metodoPago === 'transferencia') && (
              <>
                <Alert severity="warning">
                  Debe subir una foto del comprobante de pago
                </Alert>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<AttachMoney />}
                >
                  {formCompraSaldo.comprobantePreview ? 'Cambiar Comprobante' : 'Subir Comprobante'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleComprobanteChange}
                  />
                </Button>
                {formCompraSaldo.comprobantePreview && (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={formCompraSaldo.comprobantePreview}
                      alt="Comprobante"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                    />
                  </Box>
                )}
              </>
            )}

            <TextField
              label="Descripción (Opcional)"
              value={formCompraSaldo.descripcion}
              onChange={(e) => setFormCompraSaldo(prev => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              multiline
              rows={3}
              helperText="Número de comprobante o descripción del pago"
            />
            <Alert severity="warning">
              <Typography variant="body2">
                La solicitud será enviada al administrador para su aprobación. El saldo estará disponible una vez aprobado.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompraSaldoDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={comprarSaldo}
            disabled={loading}
            startIcon={<Payment />}
          >
            Solicitar Compra
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Gestionar Saldo */}
      <Dialog open={openSaldoDialog} onClose={() => setOpenSaldoDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Gestionar Saldo - {conductorSeleccionado?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Alert severity="success" icon={<AccountBalanceWallet />}>
              <strong>Tu saldo disponible: ${Number(duenoBus?.saldo || 0).toFixed(2)}</strong>
            </Alert>
            <Alert severity="info">
              Saldo actual del conductor: ${parseFloat(conductorSeleccionado?.saldo || 0).toFixed(2)}
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel shrink>Tipo de Transacción</InputLabel>
              <Select
                value={formSaldo.tipo}
                onChange={(e) => setFormSaldo(prev => ({ ...prev, tipo: e.target.value }))}
                label="Tipo de Transacción"
                displayEmpty
              >
                <MenuItem value="recarga">Recarga</MenuItem>
                <MenuItem value="cobro">Cobro</MenuItem>
                <MenuItem value="ajuste">Ajuste</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Monto"
              type="number"
              value={formSaldo.monto}
              onChange={(e) => setFormSaldo(prev => ({ ...prev, monto: parseFloat(e.target.value) }))}
              fullWidth
              required
              inputProps={{ step: 0.01, min: 0 }}
            />

            <FormControl fullWidth>
              <InputLabel shrink>Método de Pago</InputLabel>
              <Select
                value={formSaldo.metodoPago}
                onChange={(e) => setFormSaldo(prev => ({ ...prev, metodoPago: e.target.value }))}
                label="Método de Pago"
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>Seleccione método de pago</em>
                </MenuItem>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
                <MenuItem value="tarjeta">Tarjeta</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Descripción"
              value={formSaldo.descripcion}
              onChange={(e) => setFormSaldo(prev => ({ ...prev, descripcion: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Historial de Transacciones
            </Typography>

            {transacciones.length === 0 ? (
              <Alert severity="info">No hay transacciones registradas</Alert>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Monto</strong></TableCell>
                      <TableCell><strong>Saldo</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transacciones.map((trans) => (
                      <TableRow key={trans.id}>
                        <TableCell>{new Date(trans.fecha).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={trans.tipo} 
                            size="small"
                            color={trans.tipo === 'recarga' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>${parseFloat(trans.monto).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(trans.saldoNuevo).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaldoDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={guardarTransaccion}
            disabled={loading}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Agregar Bus */}
      <Dialog open={openBusDialog} onClose={() => setOpenBusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Bus</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Número de Bus"
              type="number"
              value={formBus.numero}
              onChange={(e) => setFormBus(prev => ({ ...prev, numero: e.target.value }))}
              fullWidth
              required
              inputProps={{ min: 1, max: 9999 }}
              helperText="Número de identificación del bus (1-9999)"
            />
            <TextField
              label="Placa"
              value={formBus.placa}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setFormBus(prev => ({ ...prev, placa: value }));
              }}
              fullWidth
              required
              inputProps={{ maxLength: 8 }}
              helperText="Placa del vehículo (máx. 8 caracteres). Ej: ABC1234"
            />
            <TextField
              label="Modelo"
              value={formBus.modelo}
              onChange={(e) => setFormBus(prev => ({ ...prev, modelo: e.target.value }))}
              fullWidth
              required
              inputProps={{ maxLength: 50 }}
              helperText="Marca y modelo del bus (máx. 50 caracteres)"
            />
            <TextField
              select
              label="Cooperativa"
              value={formBus.empresa}
              onChange={(e) => setFormBus(prev => ({ ...prev, empresa: e.target.value }))}
              fullWidth
              required
            >
              {cooperativas.filter(c => c.estado === 'activo').map((coop) => (
                <MenuItem key={coop.id} value={coop.nombre}>
                  {coop.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Capacidad"
              type="number"
              value={formBus.capacidad}
              onChange={(e) => setFormBus(prev => ({ ...prev, capacidad: e.target.value }))}
              fullWidth
              required
              inputProps={{ min: 1, max: 100 }}
              helperText="Capacidad de pasajeros (1-100)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBusDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={guardarBus}
            disabled={loading}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Registrar Frecuencia */}
      <Dialog open={openFrecuenciaDialog} onClose={() => setOpenFrecuenciaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Registrar Frecuencia - {conductorSeleccionado?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel shrink>Ruta</InputLabel>
              <Select
                value={formFrecuencia.rutaId}
                onChange={(e) => setFormFrecuencia(prev => ({ ...prev, rutaId: e.target.value }))}
                label="Ruta"
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>Seleccione una ruta</em>
                </MenuItem>
                {rutasDisponibles.map((ruta) => (
                  <MenuItem key={ruta.id} value={ruta.id}>
                    {ruta.origen} → {ruta.destino} - ${ruta.precio} ({ruta.distancia} km)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel shrink>Bus</InputLabel>
              <Select
                value={formFrecuencia.busId}
                onChange={(e) => setFormFrecuencia(prev => ({ ...prev, busId: e.target.value }))}
                label="Bus"
                displayEmpty
              >
                <MenuItem value="" disabled>
                  <em>Seleccione un bus</em>
                </MenuItem>
                {buses.filter(bus => bus.estado === 'activo').map((bus) => (
                  <MenuItem key={bus.id} value={bus.id}>
                    Bus {bus.numero} - {bus.placa}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha"
              type="date"
              value={formFrecuencia.fechaSalida}
              onChange={(e) => setFormFrecuencia(prev => ({ ...prev, fechaSalida: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Hora de Salida"
              type="time"
              value={formFrecuencia.horaSalida}
              onChange={(e) => setFormFrecuencia(prev => ({ ...prev, horaSalida: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFrecuenciaDialog(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={guardarFrecuencia}
            disabled={loading}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de QR Code */}
      <QRTicketDialog
        open={openQRDialog}
        onClose={() => setOpenQRDialog(false)}
        frecuencia={selectedFrecuencia}
      />

      {/* Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        handleClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Container>
  );
};

export default DuenoBusPage;

