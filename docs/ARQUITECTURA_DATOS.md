# Arquitectura de datos — cinco motores obligatorios

## Función de cada base

| Motor | Responsabilidad (fuente de verdad) | Operaciones |
|-------|--------------------------------------|-------------|
| **MySQL** `velora_betplay` | Catálogo deportivo colombiano: clubes, jugadores, competiciones, temporadas, estadios, partidos seed | Lectura dominante; escritura de catálogo / import |
| **SQL Server** `velora_identity` | Identidad app: roles, permisos, usuarios canónicos, identidades OAuth, sesiones | Lectura/escritura auth |
| **PostgreSQL** `velora_bets` | Motor de apuestas: mercados operativos, cuotas (milésimas), cupones, liquidaciones, libro, Wompi refs, billetera sim | Escritura financiera atómica |
| **MongoDB** `velora_audit` | Eventos de dominio, change log, corridas de importación | Append-only |
| **Firebase** Firestore | Notificaciones por usuario y ticks públicos de partido | Escritura notificaciones; stub si no hay credenciales |

**No se duplica el saldo oficial:** el libro y `billetera_sim` viven en PostgreSQL; MySQL `cuenta.saldo` se espeja tras operaciones para compatibilidad con el frontend legado.

## Diagrama

```text
[Frontend React]
      |  REST + WS
[Backend Express]
   |--------|--------|--------|--------|
 MySQL   PostgreSQL  MSSQL   Mongo   Firebase
 (sport)  (bets/$)  (id)   (audit)  (notify)
```

## Sincronización

1. `POST /api/sports/sync` o arranque del server: MySQL partidos/mercados/selecciones → PostgreSQL `*_ops`.
2. Login: MySQL usuario; token en memoria + intento de sesión en SQL Server.
3. Apuesta: valida selecciones en PostgreSQL; debita `billetera_sim`; escribe `libro_movimiento`; espeja saldo MySQL; evento Mongo; notificación Firebase/stub.

## Inicialización

```bash
# Con Docker (requiere Docker Desktop instalado)
docker compose up -d mysql postgres mssql mongo
# MySQL carga database/mysql/init.sql
# Postgres carga database/postgres/init.sql
# Mongo carga database/mongo/init.js
# SQL Server: ejecutar database/mssql/init.sql (o ensureMssqlSchema al arrancar API)

cd backend && npm install && npm run dev
```

Sin Docker: instalar cada motor localmente y copiar variables de `backend/.env.example`.

## Respaldo

| Motor | Procedimiento sugerido |
|-------|------------------------|
| MySQL | `mysqldump velora_betplay` |
| PostgreSQL | `pg_dump velora_bets` |
| SQL Server | Backup nativo SSMS / `BACKUP DATABASE` |
| MongoDB | `mongodump --db velora_audit` |
| Firebase | Export Admin SDK / consola |

## Pruebas de uso real

- Unitarias dinero: `npm test` en backend (`tests/money.test.js`).
- Integración multi-BD: `GET /api/health?all=1` (requiere motores levantados).
- Sync: `npm run sync:sports`.

**Estado en host de desarrollo (2026-10-19):** Docker CLI no instalado; MySQL/PG/MSSQL/Mongo no verificados en runtime en esta sesión. El código y schemas están listos; la evidencia de conectividad queda pendiente de infraestructura local.
