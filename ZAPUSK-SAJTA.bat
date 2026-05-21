@echo off
chcp 65001 >nul
title BESS MOTORS — запуск сайта
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Node.js не установлен.
  echo  Скачайте и установите: https://nodejs.org  ^(LTS^)
  echo.
  pause
  exit /b 1
)

echo.
echo  Останавливаем старый сервер на порту 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)

if exist ".next\" (
  echo  Очищаем кэш .next...
  rmdir /s /q ".next" 2>nul
)

if not exist "node_modules\" (
  echo.
  echo  Устанавливаем зависимости ^(первый запуск, 1-3 мин^)...
  echo.
  call npm install
  if errorlevel 1 (
    echo  Ошибка npm install. Проверьте интернет и повторите.
    pause
    exit /b 1
  )
)

echo.
echo  BESS MOTORS запускается: http://localhost:3000
echo  Не запускайте "npm run build" пока это окно открыто!
echo  Остановка: Ctrl+C в этом окне
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"
call npm run dev

pause
