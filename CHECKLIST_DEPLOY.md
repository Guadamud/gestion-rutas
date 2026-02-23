# ✅ Checklist Pre-Despliegue

## Antes de Subir a Git/Producción

### 📋 Configuración
- [ ] Revisar archivo `.env.example` en backend
- [ ] Revisar archivo `.env.example` en frontend
- [ ] Verificar que `.env` esté en `.gitignore`
- [ ] Configurar variables de entorno en el servidor

### 🔐 Seguridad
- [ ] Cambiar `JWT_SECRET` a valor único y seguro
- [ ] Cambiar credenciales de base de datos
- [ ] Verificar que no haya credenciales hardcodeadas
- [ ] Revisar permisos de archivos en servidor
- [ ] Configurar CORS apropiadamente para dominio de producción

### 🗄️ Base de Datos
- [ ] Crear base de datos en servidor de producción
- [ ] Ejecutar migraciones necesarias
- [ ] Crear usuario administrador inicial
- [ ] Hacer backup de la base de datos
- [ ] Verificar índices de base de datos

### 📦 Dependencias
- [ ] Ejecutar `npm install --production` en backend
- [ ] Ejecutar `npm install` y `npm run build` en frontend
- [ ] Verificar que todas las dependencias estén en `package.json`
- [ ] Eliminar dependencias no utilizadas

### 🚀 Build y Deploy
- [ ] Probar build de producción localmente
- [ ] Verificar que no haya errores en consola
- [ ] Probar todas las funcionalidades críticas
- [ ] Configurar servidor web (Nginx/Apache)
- [ ] Configurar PM2 o similar para mantener el backend activo
- [ ] Configurar logs de errores

### 🔍 Testing
- [ ] Probar login con todos los roles
- [ ] Probar creación de frecuencias
- [ ] Probar verificación QR
- [ ] Probar cierre de caja
- [ ] Probar exportación Excel/PDF
- [ ] Probar en diferentes navegadores

### 📝 Documentación
- [x] README.md completo
- [x] .gitignore configurado
- [x] LICENSE incluido
- [ ] Documentar APIs adicionales si hay cambios
- [ ] Actualizar manual de usuario si es necesario

### 🧹 Limpieza
- [x] Eliminar archivos temporales
- [x] Eliminar scripts de desarrollo
- [x] Eliminar comentarios de debug
- [x] Eliminar console.log innecesarios (opcional)
- [x] Eliminar carpeta node_modules antes de subir

### 🌐 Configuración de Servidor

#### Backend (Node.js)
```bash
# Instalar Node.js v16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Iniciar backend
cd backend
npm install --production
pm2 start server.js --name "gestion-rutas-api"
pm2 startup
pm2 save
```

#### Frontend (React)
```bash
# Build
cd gestion-rutas
npm install
npm run build

# Servir con Nginx
sudo apt-get install nginx
# Configurar /etc/nginx/sites-available/default
# para servir la carpeta build/
sudo systemctl restart nginx
```

#### PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres psql
CREATE DATABASE gestion_rutas;
CREATE USER gestion_user WITH ENCRYPTED PASSWORD 'password_segura';
GRANT ALL PRIVILEGES ON DATABASE gestion_rutas TO gestion_user;
\q
```

### 🔧 Variables de Entorno (Producción)

**Backend (.env)**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gestion_rutas
DB_USER=gestion_user
DB_PASSWORD=password_muy_segura_cambiar
JWT_SECRET=clave_jwt_super_segura_minimo_32_caracteres_cambiar
NODE_ENV=production
```

**Frontend (.env)**
```env
REACT_APP_API_URL=https://tudominio.com/api
```

### 📊 Monitoreo Post-Despliegue
- [ ] Configurar monitoreo de logs
- [ ] Verificar uso de memoria y CPU
- [ ] Configurar alertas de errores
- [ ] Verificar backups automáticos
- [ ] Monitorear tráfico de red

### 🔄 Mantenimiento
- [ ] Programar backups automáticos diarios
- [ ] Configurar limpieza automática de logs
- [ ] Programar actualizaciones de seguridad
- [ ] Documentar procedimientos de recuperación

## 🎯 Comandos Útiles Git

```bash
# Inicializar repositorio
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit: Sistema de Gestión de Rutas v1.0"

# Agregar remoto (GitHub/GitLab/Bitbucket)
git remote add origin https://github.com/usuario/proyecto.git

# Subir a repositorio
git push -u origin main
```

## ⚠️ IMPORTANTE

1. **NUNCA** subir archivos `.env` a Git
2. **SIEMPRE** usar variables de entorno para credenciales
3. **VERIFICAR** que `.gitignore` esté funcionando correctamente
4. **PROBAR** en ambiente de staging antes de producción
5. **HACER BACKUP** antes de cualquier cambio importante

---

**Fecha de preparación**: Febrero 2026  
**Equipo**: Desarrollo de Tesis
