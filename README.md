# 🚌 Sistema de Gestión de Rutas de Transporte

Sistema web profesional para la gestión integral de rutas de transporte, conductores, frecuencias, verificación QR y control financiero.

## 📋 Características Principales

### 🔐 Autenticación y Roles
- Sistema de login con JWT
- 4 roles: Administrador, Cliente, Conductor, Tesorería
- Gestión de perfiles y cambio de contraseña
- Personalización de temas por usuario

### 👥 Gestión de Usuarios
- **Clientes**: Dueños de buses, compra y distribución de saldo
- **Conductores**: Registro de frecuencias, consulta de saldo
- **Administrador**: Control total del sistema, cierres de caja
- **Tesorería**: Gestión de rutas, precios y reportes

### 🚍 Gestión Operativa
- CRUD de buses con estados activo/inactivo
- Asignación de límites por ruta y bus
- Control de rutas con origen, destino y precios
- Registro de frecuencias con código QR único
- Verificación de tickets en tiempo real

### 💰 Control Financiero
- Sistema de compra de saldo (solicitud/aprobación)
- Recarga de saldo a conductores
- Registro de transacciones
- Cierre de caja diario con autorización
- Reportes en Excel y PDF profesionales

### 📊 Reportes y Análisis
- Exportación a Excel con formato profesional
- Generación de PDF con diseño corporativo
- Historial de transacciones y movimientos
- Estadísticas de frecuencias y rutas
- Dashboard administrativo

### 🎨 Personalización
- 8 temas de color predefinidos
- Tema personalizado por usuario
- Temas sugeridos por rol
- Modo claro/oscuro

### 🔧 Mantenimiento Automático
- Limpieza programada de datos antiguos
- Limpieza de claves temporales expiradas
- Sistema de backup automático
- Optimización de cache y rendimiento

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** v16+
- **Express.js** v4.18 - Framework web
- **PostgreSQL** - Base de datos relacional
- **Sequelize** v6.x - ORM
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas
- **ExcelJS** - Generación de reportes Excel
- **QRCode** - Generación de códigos QR
- **PDFKit** - Generación de PDF

### Frontend
- **React** v18.2
- **React Router** v6 - Navegación
- **Axios** - Cliente HTTP
- **React Icons** - Iconografía
- **html5-qrcode** - Escaneo QR
- **CSS3** - Estilos personalizados

## 📂 Estructura del Proyecto

```
TESIS/
├── backend/                    # API Backend
│   ├── config/                # Configuración de BD
│   ├── controllers/           # Lógica de negocio
│   ├── middlewares/           # Autenticación, paginación, etc.
│   ├── models/                # Modelos Sequelize (11 modelos)
│   ├── routes/                # Rutas API (12 módulos)
│   ├── services/              # Servicios automáticos
│   ├── scripts/               # Scripts de utilidades
│   │   ├── migrations/        # Migraciones de BD
│   │   ├── seeds/             # Datos iniciales
│   │   └── utilities/         # Utilidades varias
│   ├── .env.example           # Variables de entorno ejemplo
│   ├── server.js              # Punto de entrada
│   └── package.json           # Dependencias backend
│
├── gestion-rutas/             # Frontend React
│   ├── public/                # Archivos estáticos
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas principales
│   │   ├── services/          # API services
│   │   ├── utils/             # Utilidades
│   │   ├── App.js             # Componente raíz
│   │   └── index.js           # Punto de entrada
│   ├── .env.example           # Variables de entorno ejemplo
│   └── package.json           # Dependencias frontend
│
├── iniciar_sistema.bat        # Script de inicio rápido
├── MANUAL_USUARIO_COMPLETO.md # Manual de usuario
├── ARQUITECTURA_SISTEMA.md    # Documentación técnica
└── README.md                  # Este archivo
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js v16 o superior
- PostgreSQL v12 o superior
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone [URL_DEL_REPOSITORIO]
cd TESIS
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_rutas
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
NODE_ENV=development
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos en PostgreSQL
psql -U postgres
CREATE DATABASE gestion_rutas;
\q

# Las tablas se crean automáticamente al iniciar el servidor
```

### 4. Configurar Frontend

```bash
cd ../gestion-rutas
npm install
```

Crear archivo `.env` basado en `.env.example`:
```env
REACT_APP_API_URL=http://localhost:5000
```

### 5. Crear Usuario Administrador

```bash
cd ../backend
node crear-admin.js
```

Sigue las instrucciones para crear el primer administrador.

## ▶️ Ejecutar el Sistema

### Opción 1: Script Automatizado (Windows)
```bash
# Desde la raíz del proyecto
iniciar_sistema.bat
```

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd gestion-rutas
npm start
```

## 🌐 Acceso al Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Credenciales**: Usuario administrador creado previamente

## 📚 Endpoints Principales de la API

### Autenticación
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión
- `PUT /auth/profile` - Actualizar perfil
- `PUT /auth/change-password` - Cambiar contraseña

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `PATCH /api/clientes/:id/saldo` - Actualizar saldo
- `POST /api/clientes/:id/comprar-saldo` - Solicitar compra

### Conductores
- `GET /api/conductores` - Listar conductores
- `POST /api/conductores` - Crear conductor
- `PATCH /api/conductores/:id/saldo` - Recargar saldo
- `GET /api/conductores/:id/transacciones` - Historial

### Frecuencias
- `GET /api/frecuencias` - Listar frecuencias
- `POST /api/frecuencias` - Crear frecuencia con QR
- `PUT /api/frecuencias/:id` - Actualizar
- `DELETE /api/frecuencias/:id` - Eliminar

### Verificación QR
- `POST /api/verificacion/verificar` - Verificar ticket
- `GET /api/verificacion/ticket/:id` - Consultar ticket
- `GET /api/verificacion/historial` - Historial
- `POST /api/verificacion/regenerar/:id` - Regenerar QR

### Cierre de Caja
- `GET /api/cierre-caja/datos-dia` - Datos del día
- `POST /api/cierre-caja/verificar-clave` - Verificar autorización
- `POST /api/cierre-caja/registrar` - Registrar cierre
- `GET /api/cierre-caja/historial` - Historial de cierres

Ver documentación completa en [backend/README.md](backend/README.md)

## 🔒 Seguridad

- Autenticación JWT con tokens de 24h
- Contraseñas encriptadas con bcrypt
- Validación de roles en cada endpoint
- Middleware de autorización por rol
- Variables de entorno para credenciales
- Validación de datos en frontend y backend
- Protección contra SQL Injection (Sequelize ORM)
- CORS configurado

## 🎯 Casos de Uso Principales

### 1. Cliente (Dueño de Bus)
1. Solicita compra de saldo a tesorería
2. Espera aprobación del administrador
3. Recibe el saldo aprobado
4. Recarga saldo a sus conductores
5. Consulta historial de movimientos

### 2. Conductor
1. Registra frecuencia (genera QR único)
2. Se descuenta saldo según tarifa de la ruta
3. Presenta QR en punto de verificación
4. Ticket marcado como usado
5. Consulta saldo disponible

### 3. Administrador
1. Aprueba/rechaza solicitudes de compra
2. Gestiona buses, rutas y usuarios
3. Establece límites por ruta/bus
4. Realiza cierre de caja diario
5. Genera reportes ejecutivos

### 4. Tesorería
1. Gestiona catálogo de rutas y precios
2. Crea/modifica cooperativas
3. Consulta reportes financieros
4. Exporta datos a Excel/PDF

## 📱 Funcionalidades Destacadas

### Sistema QR
- Código único por frecuencia
- Verificación en tiempo real
- Prevención de duplicados
- Regeneración de QR perdidos
- Historial de verificaciones

### Sistema de Límites
- Límites por ruta y bus
- Validación automática al crear frecuencia
- Alertas de límite alcanzado
- Gestión administrativa

### Cierre de Caja
- Autorización con clave administrativa
- Resumen automático del día
- Inclusión de solicitudes aprobadas
- Exportación profesional (Excel/PDF)
- Archivado automático

### Personalización
- Temas por rol predefinidos
- 8 paletas de colores
- Tema personalizado RGB
- Guardado por usuario
- Aplicación instantánea

## 🧪 Scripts Útiles

### Backend
```bash
# Crear administrador
node crear-admin.js

# Migración específica
node scripts/migrations/[nombre-migracion].js

# Poblar datos iniciales
psql -U postgres -d gestion_rutas -f scripts/seeds/datos-iniciales.sql
```

### Frontend
```bash
# Desarrollo
npm start

# Build para producción
npm run build

# Pruebas
npm test
```

## 📖 Documentación Adicional

- [Manual de Usuario Completo](MANUAL_USUARIO_COMPLETO.md)
- [Manual de Frecuencias](MANUAL_USUARIO_FRECUENCIAS_COMPLETO.md)
- [Arquitectura del Sistema](ARQUITECTURA_SISTEMA.md)
- [Framework Tecnológico](FRAMEWORK_TECNOLOGICO.md)
- [README Backend](backend/README.md)

## 🐛 Solución de Problemas

### Error de conexión a base de datos
1. Verificar que PostgreSQL esté corriendo
2. Confirmar credenciales en `.env`
3. Verificar que la base de datos exista

### Puerto en uso
1. Cambiar `PORT` en `backend/.env`
2. Cambiar `REACT_APP_API_URL` en `gestion-rutas/.env`

### Error al instalar dependencias
```bash
# Limpiar cache de npm
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 👨‍💻 Desarrollo

### Agregar nuevo módulo
1. Crear modelo en `backend/models/`
2. Crear controller en `backend/controllers/`
3. Crear rutas en `backend/routes/`
4. Registrar en `backend/server.js`
5. Crear componente React en `gestion-rutas/src/pages/`

### Buenas prácticas
- Usar ESLint y Prettier
- Comentar código complejo
- Validar en cliente y servidor
- Manejar errores apropiadamente
- Seguir estructura MVC

## 📄 Licencia

Este proyecto es de uso académico para tesis de grado.

## 👥 Autor

Sistema desarrollado como proyecto de tesis para la gestión de rutas de transporte.

## 📞 Soporte

Para problemas o consultas, revisar la documentación adjunta o contactar al desarrollador.

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0.0
