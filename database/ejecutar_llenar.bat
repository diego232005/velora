@echo off
setlocal
cd /d "%~dp0"

set MYSQL="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set USER=root
set PASS=0000
set DB=velora_betplay

if not exist %MYSQL% (
  echo No se encontro mysql.exe
  pause
  exit /b 1
)

echo Ejecutando llenar_tablas.sql en %DB% ...
%MYSQL% -h localhost -P 3306 -u %USER% -p%PASS% --default-character-set=utf8mb4 --comments < "%~dp0mysql\llenar_tablas.sql"
if errorlevel 1 (
  echo ERROR
  pause
  exit /b 1
)

echo.
echo Conteos (deben ser >= 10):
%MYSQL% -h localhost -P 3306 -u %USER% -p%PASS% %DB% -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='%DB%' ORDER BY table_name;"
echo.
echo OK
pause
