@echo off
setlocal
cd /d "%~dp0"

set MYSQL="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set USER=root
set PASS=0000
set DB=velora_betplay

echo Ejecutando consultas_velora.sql (mejor por CLI por DELIMITER)...
%MYSQL% -h localhost -P 3306 -u %USER% -p%PASS% --default-character-set=utf8mb4 --comments %DB% < "%~dp0mysql\consultas_velora.sql"
if errorlevel 1 (
  echo ERROR
  pause
  exit /b 1
)
echo OK - vistas, funciones y procedimientos creados
pause
