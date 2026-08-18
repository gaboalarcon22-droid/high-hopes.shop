@echo off
title High Hopes Store
echo.
echo  ========================================
echo    High Hopes Store
echo  ========================================
echo.

:: Matar procesos Node anteriores
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo  Iniciando servidor...
echo.
echo  Tienda:  http://localhost:3001/tienda
echo  Admin:   http://localhost:3001/admin
echo.
echo  Cuentas:
echo    Admin:    admin@highhopes.store / HighHopes2026!
echo    Operador: operador@highhopes.store / Operador2026!
echo.

:: Abrir Chrome
start "" "chrome" "http://localhost:3001/tienda"

:: Iniciar servidor
cd /d "%~dp0"
npm run dev
