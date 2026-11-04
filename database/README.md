# Bases de datos Velora

Una carpeta por motor (misma convención):

| Carpeta | Motor | Base |
|---------|-------|------|
| `mysql/` | MySQL 8 | `velora_betplay` — catálogo BetPlay |
| `postgres/` | PostgreSQL | `velora_bets` — apuestas / Wompi / billetera |
| `mssql/` | SQL Server | `velora_identity` — identidad / OAuth / sesiones |
| `mongo/` | MongoDB | `velora_audit` — eventos |
| `firebase/` | Firebase | notificaciones |

MySQL (DBeaver / local): ejecuta `mysql/init.sql` completo (`Alt+X`).  
Con Docker el puerto host es **3307**. Detalle en `mysql/README.md`.
