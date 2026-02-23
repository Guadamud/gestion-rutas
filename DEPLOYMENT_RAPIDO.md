# 🚀 Deployment Rápido - 3 Pasos

## 📦 Lo que se ha preparado:

✅ Configuración de Render (render.yaml)  
✅ Configuración de Vercel (vercel.json)  
✅ Soporte para DATABASE_URL  
✅ Health check endpoint  
✅ CORS configurado  
✅ Scripts de deployment  

---

## 🎯 Deployment en 3 Pasos

### 1️⃣ Subir a GitHub

```bash
git init
git add .
git commit -m "Preparación para deployment"
git remote add origin https://github.com/TU_USUARIO/gestion-rutas.git
git push -u origin main
```

### 2️⃣ Desplegar Backend en Render

1. Ve a [render.com](https://render.com) y regístrate
2. Crear **PostgreSQL Database**:
   - Name: `gestion-rutas-db`
   - Plan: **Free**
   - Guardar la **Internal Database URL**

3. Crear **Web Service**:
   - Conectar GitHub repo
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Variables de entorno:
     ```
     NODE_ENV=production
     PORT=5000
     DATABASE_URL=[tu database url]
     JWT_SECRET=[generar clave segura]
     FRONTEND_URL=https://tu-proyecto.vercel.app
     ```

### 3️⃣ Desplegar Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) y regístrate
2. Importar proyecto de GitHub
3. Configurar:
   - Root Directory: `gestion-rutas`
   - Framework: Create React App
   - Build Command: `npm run build`
   - Environment Variable:
     ```
     REACT_APP_API_URL=https://tu-backend.onrender.com
     ```

---

## ⚡ Mantener Backend Activo (Opcional)

Usar [cron-job.org](https://cron-job.org):
- URL: `https://tu-backend.onrender.com/api/verificacion/health`
- Cada: 10 minutos

---

## 📖 Guía Completa

Ver [GUIA_DEPLOYMENT_GRATIS.md](./GUIA_DEPLOYMENT_GRATIS.md) para instrucciones detalladas.

---

## ✅ URLs Finales

- **Frontend**: https://tu-proyecto.vercel.app
- **Backend**: https://tu-backend.onrender.com
- **Health Check**: https://tu-backend.onrender.com/api/verificacion/health
