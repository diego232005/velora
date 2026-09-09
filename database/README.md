# Base de datos Velora BetPlay

Script de MySQL/MariaDB para el modelo de la casa de apuestas **Velora**, limitada a la **Liga BetPlay DIMAYOR** (20 clubes de Primera A, solo Colombia).

El archivo `velora_betplay.sql` crea las **42 tablas** y deja **registros de demostración**.

No incluye triggers, procedimientos, funciones, vistas ni eventos. Solo:

- `CREATE DATABASE`
- `CREATE TABLE`
- claves primarias y foráneas
- `INSERT`

## Requisitos

- MySQL 8 o MariaDB 10.4 (o superior)
- DBeaver
- El controlador MySQL de DBeaver (se descarga la primera vez)

## Paso a paso en DBeaver

### 1. Tener MySQL encendido

En Windows, abre **Servicios** y confirma que `MySQL` o `MySQL80` esté en ejecución.  
Si usas XAMPP o WAMP, inicia **MySQL** desde ese panel.

Anota:

- host: `localhost`
- puerto: `3306` (el más común)
- usuario: `root`
- contraseña: la que configuraste al instalar

### 2. Crear la conexión

1. Abre DBeaver.
2. Clic en el enchufe **Nueva conexión** (o `Archivo > Nueva > Conexión a base de datos`).
3. Elige **MySQL** y pulsa **Siguiente**.
4. Completa:
   - Servidor: `localhost`
   - Puerto: `3306`
   - Usuario: `root`
   - Contraseña: tu clave
5. En **Autenticación**, marca guardar la contraseña si estás en tu computador.
6. Pulsa **Probar conexión**.
7. Si pide descargar el driver, acepta.
8. Si la prueba es correcta, pulsa **Finalizar**.

Aún no elijas una base de datos: el script la crea.

### 3. Ejecutar el script

1. En el panel izquierdo, clic derecho sobre la conexión MySQL.
2. `SQL Editor > Abrir script SQL`.
3. Abre el archivo `database/velora_betplay.sql`.
4. Pulsa **Ejecutar script SQL** (el icono de play con la barra, o `Alt + X`).
5. No uses solo `Ctrl + Enter` sobre una línea: eso ejecuta una sentencia. Hay que ejecutar **todo el archivo**.

Si DBeaver pregunta por el esquema, deja la conexión al servidor y deja que el `CREATE DATABASE` y el `USE` hagan el trabajo.

### 4. Ver las tablas y los datos

1. Clic derecho en la conexión > **Actualizar**.
2. Expande `velora_betplay > Tablas`.
3. Deben aparecer **42 tablas**.
4. Clic derecho en una tabla, por ejemplo `equipo` > **Ver datos**.
5. Debes ver los 20 clubes de la Liga BetPlay.

Consultas rápidas para comprobar:

```sql
USE velora_betplay;

SHOW TABLES;

SELECT COUNT(*) AS total_equipos
FROM equipo;

SELECT e.nombre, c.nombre AS ciudad, es.nombre AS estadio
FROM equipo e
JOIN ciudad c ON c.id_ciudad = e.id_ciudad
JOIN estadio es ON es.id_estadio = e.id_estadio_local
ORDER BY e.nombre;

SELECT p.fecha_hora, loc.nombre AS local, vis.nombre AS visitante,
       ep.nombre AS estado, p.goles_local, p.goles_visitante
FROM partido p
JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido;
```

### 5. Si quieres volver a cargarlo

El script empieza con `DROP DATABASE IF EXISTS`. Vuelve a ejecutarlo completo y se recrea desde cero.

## Si la conexión falla

- MySQL no está iniciado.
- Puerto distinto a `3306`.
- Usuario o contraseña incorrectos.
- El firewall bloquea el puerto.
- Elegiste PostgreSQL o SQL Server por error: este script es de **MySQL**.

## Contenido cargado

- Colombia, departamentos y ciudades de los clubes
- Empresa Velora, roles, usuarios de demostración y cuentas en COP
- DIMAYOR, fútbol, Liga BetPlay y temporada 2026
- Los 20 equipos de Primera A, estadios y plantillas de ejemplo
- Jornadas, partidos, cuotas, cupones y pagos por PSE

El login ya no lee un array local. El backend consulta las tablas
`usuario`, `perfil_cliente` y `cuenta`. Las mismas cuentas se pueden
volver a cargar con `npm run seed:users` desde la carpeta `backend`.
