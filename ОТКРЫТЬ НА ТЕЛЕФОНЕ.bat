@echo off
chcp 65001 >nul
title ЛАЗЕР ТАЙМ — Просмотр на телефоне

echo.
echo ============================================
echo   ЛАЗЕР ТАЙМ — Просмотр на телефоне
echo ============================================
echo.
echo Убедитесь, что телефон и компьютер
echo подключены к одной Wi-Fi сети.
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo Откройте в браузере телефона:
echo.
echo    http://%IP%:8080
echo.
echo ============================================
echo Нажмите Ctrl+C чтобы остановить сервер.
echo ============================================
echo.

python -m http.server 8080
