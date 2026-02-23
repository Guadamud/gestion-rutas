# Backend de Gestión de Rutas

API backend para el sistema de gestión de rutas de transporte.

## Requisitos

- Node.js 14+
- PostgreSQL 12+
- npm o yarn

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`
   - Configurar las credenciales de PostgreSQL
   - Configurar el JWT_SECRET

4. Crear la base de datos en PostgreSQL:
```sql
CREATE DATABASE gestion_rutas;
```

5. Iniciar el servidor:
```bash
npm start
```

Para desarrollo con hot-reload:
```bash
npm run dev
```

## Estructura del Proyecto

```
backend/
├── config/              # Configuración de base de datos y aplicación
├── controllers/         # Lógica de negocio por módulo
├── middlewares/         # Middlewares de autenticación y validación
├── models/              # Modelos de Sequelize (ORM)
├── routes/              # Definición de rutas API
├── services/            # Servicios de negocio
├── scripts/             # Scripts de mantenimiento y utilidades
│   ├── migrations/      # Scripts de migración de base de datos (27 archivos)
│   ├── seeds/           # Datos iniciales y scripts SQL (2 archivos)
│   ├── tests/           # Scripts de testing y verificación (20 archivos)
│   └── utilities/       # Scripts utilitarios (8 archivos)
├── server.js            # Punto de entrada de la aplicación
├── package.json         # Dependencias y scripts NPM
└── README.md            # Documentación del proyecto
```

### 📁 Detalle de Scripts

#### 🔄 Migrations (27 archivos)
Scripts para modificar y crear estructuras de base de datos:
- `actualizar_*.js` - Actualizaciones de tablas y campos existentes
- `agregar_*.js` - Agregar nuevas columnas y campos
- `crear_*.js` - Crear nuevas tablas
- `eliminar_*.js` - Eliminar columnas o registros
- `migrate_*.js` - Migraciones de datos

#### 🌱 Seeds (2 archivos)
Scripts para poblar datos iniciales:
- `insertar_cooperativas.js` - Insertar cooperativas iniciales
- `init_rutas.sql` - Inicializar rutas básicas

#### ✅ Tests (20 archivos)
Scripts de verificación y testing:
- `verificar_*.js` - Verificación de datos e integridad
- `test_*.js` - Testing de endpoints y funcionalidades
- `check_*.js` - Chequeos de estado y relaciones

#### 🔧 Utilities (8 archivos)
Scripts utilitarios para mantenimiento:
- `sync_*.js` - Sincronización de datos
- `update_*.js` - Actualizaciones específicas
- `delete_*.js` - Eliminación de datos
- `corregir_*.js` - Corrección de datos inconsistentes
- `cambiar_*.js` - Cambios de configuración
- `regenerar_*.js` - Regeneración de datos

## Endpoints Principales

### Autenticación
- POST `/auth/register` - Registrar usuario
- POST `/auth/login` - Iniciar sesión

### Clientes
- GET `/api/clientes` - Listar clientes
- POST `/api/clientes` - Crear cliente
- PUT `/api/clientes/:id` - Actualizar cliente
- DELETE `/api/clientes/:id` - Eliminar cliente

### Conductores
- GET `/api/conductores/cliente/:clienteId` - Listar conductores de un cliente
- POST `/api/conductores` - Crear conductor
- PUT `/api/conductores/:id` - Actualizar conductor
- PATCH `/api/conductores/:id/saldo` - Actualizar saldo
- GET `/api/conductores/:id/transacciones` - Historial de transacciones
- DELETE `/api/conductores/:id` - Eliminar conductor

### Buses
- GET `/api/buses` - Listar buses
- POST `/api/buses` - Crear bus
- PUT `/api/buses/:id` - Actualizar bus
- DELETE `/api/buses/:id` - Eliminar bus

### Rutas
- GET `/api/rutas` - Listar rutas
- POST `/api/rutas` - Crear ruta
- PUT `/api/rutas/:id` - Actualizar ruta
- DELETE `/api/rutas/:id` - Eliminar ruta

### Frecuencias
- GET `/api/frecuencias` - Listar frecuencias
- POST `/api/frecuencias` - Crear frecuencia
- GET `/api/frecuencias/conductor/:conductorId` - Frecuencias por conductor
- DELETE `/api/frecuencias/:id` - Eliminar frecuencia

## Seguridad

- Todas las rutas (excepto auth) requieren token JWT
- Las contraseñas se encriptan con bcrypt
- Validación de datos en todas las operaciones

## Modelos de Base de Datos

### User
- Usuarios del sistema (admin, tesorería, cliente)

### Cliente
- Dueños de buses que contratan conductores

### Conductor
- Conductores que trabajan para un cliente

### Bus
- Buses pertenecientes a un cliente

### Ruta
- Rutas de transporte disponibles

### Frecuencia
- Registro de viajes realizados

### Transaccion
- Historial de movimientos de saldo de conductores
