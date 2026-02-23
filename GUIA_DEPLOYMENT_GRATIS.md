# 🚀 Guía Completa de Deployment - Sistema de Gestión de Rutas

## 📋 Resumen del Deployment

Esta guía te ayudará a desplegar tu sistema **GRATIS** y con capacidad para más de **10,000 datos** sin que se detenga.

### 🎯 Servicios Utilizados

| Componente | Servicio | Plan | Capacidad | Hibernación |
|------------|----------|------|-----------|-------------|
| **Backend** | Render.com | Free | Ilimitado | Sí (15 min inactividad) |
| **Base de Datos** | Render PostgreSQL | Free | 1 GB (~10,000+ registros) | No |
| **Frontend** | Vercel | Free | Ilimitado | No |
| **Keep-Alive** | Cron-job.org | Free | Ilimitado | No |

---

## 🔧 Parte 1: Preparación del Código

### 1.1 Verificar archivos creados ✅

Los siguientes archivos ya están creados:
- ✅ `render.yaml` - Configuración de Render
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `backend/build.sh` - Script de build
- ✅ `backend/config/database.js` - Soporte para DATABASE_URL
- ✅ Health check endpoint agregado

### 1.2 Actualizar .gitignore

Verifica que tu `.gitignore` incluya:
```
# Dependencias
node_modules/
package-lock.json

# Variables de entorno
.env
.env.local
.env.production

# Build
build/
dist/

# Logs
npm-debug.log*
```

### 1.3 Crear repositorio en GitHub

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar todos los archivos
git add .

# Commit inicial
git commit -m "Preparación para deployment"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/TU_USUARIO/gestion-rutas.git
git branch -M main
git push -u origin main
```

---

## 🗄️ Parte 2: Desplegar Backend y Base de Datos en Render

### 2.1 Crear cuenta en Render

1. Ve a [https://render.com](https://render.com)
2. Clic en **"Get Started for Free"**
3. Regístrate con GitHub (recomendado)

### 2.2 Crear Base de Datos PostgreSQL

1. En el Dashboard de Render, clic en **"New +"** → **"PostgreSQL"**
2. Configuración:
   - **Name**: `gestion-rutas-db`
   - **Database**: `gestion_rutas`
   - **User**: `gestion_rutas_user`
   - **Region**: Selecciona el más cercano a tu ubicación
   - **PostgreSQL Version**: 16 (o la más reciente)
   - **Plan**: **Free**
3. Clic en **"Create Database"**
4. ⏳ Espera 2-3 minutos a que se cree
5. ✅ Guarda la **Internal Database URL** (la usaremos después)

### 2.3 Desplegar Backend

1. En el Dashboard, clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio `gestion-rutas`
4. Configuración:
   - **Name**: `gestion-rutas-backend`
   - **Region**: Mismo que la base de datos
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

5. **Variables de Entorno** (clic en "Advanced" → "Add Environment Variable"):
   
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[Pegar la Internal Database URL de tu DB]
   JWT_SECRET=[Generar una clave secreta larga y aleatoria]
   ```

   💡 Para generar JWT_SECRET seguro, usa:
   ```bash
   # En PowerShell (Windows)
   [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
   
   # O en tu navegador (Consola F12):
   Array.from(crypto.getRandomValues(new Uint8Array(64))).map(b=>b.toString(16).padStart(2,'0')).join('')
   ```

6. **Health Check Path**: `/api/verificacion/health`

7. Clic en **"Create Web Service"**

8. ⏳ Espera 5-10 minutos al primer deploy

9. ✅ Una vez deployado, guarda la URL (ej: `https://gestion-rutas-backend.onrender.com`)

### 2.4 Inicializar Base de Datos

1. En Render, ve a tu base de datos
2. Clic en **"Connect"** → Copia el comando PSQL
3. En tu terminal local con PostgreSQL instalado:
   ```bash
   # Conectar a la DB de Render
   psql [PEGAR_COMANDO_AQUI]
   ```

4. O usa el **Shell** directo en Render:
   - Ve a tu Web Service → Tab "Shell"
   - Ejecuta:
   ```bash
   cd backend
   node crear-admin.js
   ```

---

## 🌐 Parte 3: Desplegar Frontend en Vercel

### 3.1 Crear cuenta en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Clic en **"Sign Up"**
3. Regístrate con GitHub

### 3.2 Actualizar configuración del Frontend

Antes de desplegar, actualiza el archivo `.env.example` del frontend:

```bash
cd gestion-rutas
```

Crea/Edita `.env.production`:
```env
REACT_APP_API_URL=https://TU-BACKEND.onrender.com
```

⚠️ **IMPORTANTE**: Reemplaza `TU-BACKEND` con la URL real de tu backend en Render.

Actualiza también `package.json` si es necesario (ya está correcto).

### 3.3 Desplegar en Vercel

#### Opción A: Desde la Web (Recomendado)

1. En el Dashboard de Vercel, clic en **"Add New..."** → **"Project"**
2. Importa tu repositorio de GitHub
3. Configuración:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `gestion-rutas`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

4. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://TU-BACKEND.onrender.com
   ```

5. Clic en **"Deploy"**

6. ⏳ Espera 2-5 minutos

7. ✅ Tu frontend estará en: `https://tu-proyecto.vercel.app`

#### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta raíz del proyecto
cd c:\Users\erwin\OneDrive\Desktop\TESIS

# Deploy
vercel

# Sigue las instrucciones:
# - Link to existing project? No
# - Project name: gestion-rutas
# - Directory: ./gestion-rutas
# - Override settings? No

# Para producción
vercel --prod
```

---

## ⚡ Parte 4: Evitar Hibernación del Backend

Render Free hiberna tu backend después de 15 minutos de inactividad. Para evitarlo:

### 4.1 Usar Cron-job.org (Recomendado - Gratis)

1. Ve a [https://cron-job.org](https://cron-job.org)
2. Crea una cuenta gratuita
3. Clic en **"Create Cron Job"**
4. Configuración:
   - **Title**: `Keep Alive - Gestión Rutas`
   - **URL**: `https://TU-BACKEND.onrender.com/api/verificacion/health`
   - **Schedule**: Every 10 minutes
   ```
   */10 * * * *
   ```
   - **Request Method**: GET

5. Activa el Cron Job

✅ Ahora tu backend se mantendrá activo 24/7

### 4.2 Alternativas

#### UptimeRobot (Gratis)
1. [https://uptimerobot.com](https://uptimerobot.com)
2. Crear monitor HTTP(s)
3. URL: `https://TU-BACKEND.onrender.com/api/verificacion/health`
4. Intervalo: 5 minutos

#### Better Uptime (Gratis con más features)
1. [https://betteruptime.com](https://betteruptime.com)
2. Similar a UptimeRobot pero con mejores notificaciones

---

## 🔒 Parte 5: Configurar CORS en el Backend

Antes de que funcione correctamente, actualiza CORS en `backend/server.js`:

```javascript
// Reemplaza esta línea:
app.use(cors());

// Por esta configuración:
app.use(cors({
  origin: [
    'https://tu-proyecto.vercel.app',
    'http://localhost:3000', // Para desarrollo
    'http://localhost:3001'  // Para desarrollo
  ],
  credentials: true
}));
```

Luego haz commit y push:
```bash
git add backend/server.js
git commit -m "Configurar CORS para producción"
git push
```

Render automáticamente re-desplegará tu backend.

---

## ✅ Parte 6: Verificación Final

### 6.1 Checklist

- [ ] Backend desplegado en Render
- [ ] Base de datos PostgreSQL creada
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] Cron job configurado (keep-alive)
- [ ] Usuario admin creado en la DB
- [ ] Health check funcionando: `https://TU-BACKEND.onrender.com/api/verificacion/health`

### 6.2 Probar el Sistema

1. **Abrir el frontend**: `https://tu-proyecto.vercel.app`
2. **Login** con el usuario admin creado
3. **Crear datos de prueba**:
   - Cooperativa
   - Ruta
   - Bus
   - Frecuencia
4. **Verificar QR**
5. **Hacer cierre de caja**

---

## 📊 Capacidades del Sistema Gratuito

| Recurso | Límite | Suficiente para |
|---------|--------|-----------------|
| **Storage DB** | 1 GB | ~10,000 - 50,000 registros |
| **Conexiones DB** | 100 | ~50 usuarios concurrentes |
| **Bandwidth** | 100 GB/mes | ~100,000 visitas/mes |
| **Build Minutes** | Ilimitado | ∞ |
| **Deployments** | Ilimitado | ∞ |

---

## 🔄 Parte 7: Actualizaciones Futuras

### Para actualizar tu sistema:

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción de cambios"
git push

# Render y Vercel detectarán automáticamente y redespliegan
```

---

## ⚠️ Solución de Problemas

### Backend no inicia
```bash
# Ver logs en Render:
# Dashboard → Tu servicio → Logs
```

Problemas comunes:
- DATABASE_URL mal configurado → Copiar de nuevo desde Render DB
- JWT_SECRET faltante → Agregar en Environment Variables
- Puerto incorrecto → Debe ser 5000 o usar process.env.PORT

### Frontend no se conecta al Backend
- Verificar REACT_APP_API_URL en Vercel
- Verificar CORS en backend
- Verificar que backend esté activo (health check)

### Base de datos vacía
```bash
# Conectar a Render Shell
# Ejecutar:
cd backend
node crear-admin.js

# O ejecutar migraciones:
node scripts/migrations/[NOMBRE_MIGRACION].js
```

---

## 🎉 ¡Listo!

Tu sistema ahora está:
- ✅ **Deployado** en la nube
- ✅ **Gratis** para siempre
- ✅ **Escalable** hasta 1 GB de datos
- ✅ **Activo** 24/7 sin hibernación
- ✅ **Accesible** desde cualquier dispositivo

### URLs Finales:
- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend API**: `https://tu-backend.onrender.com`
- **Health Check**: `https://tu-backend.onrender.com/api/verificacion/health`

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render/Vercel
2. Verifica las variables de entorno
3. Revisa la sección de troubleshooting
4. Consulta la documentación oficial de [Render](https://render.com/docs) y [Vercel](https://vercel.com/docs)

---

**Creado el**: 22 de febrero de 2026  
**Última actualización**: 22 de febrero de 2026
