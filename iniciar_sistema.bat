@echo off
echo ========================================
echo  INICIANDO SISTEMA DE GESTION DE RUTAS
echo ========================================
echo.

echo [1/2] Iniciando Backend en puerto 5000...
start "Backend - Puerto 5000" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
echo.

echo [2/2] Iniciando Frontend en puerto 3000...
start "Frontend - Puerto 3000" cmd /k "cd gestion-rutas && npm start"
echo.

echo ========================================
echo  SISTEMA INICIADO
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
echo (Los servidores seguiran corriendo en las otras ventanas)
pause > nul
