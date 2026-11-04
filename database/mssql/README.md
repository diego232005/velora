# SQL Server — `velora_identity`

Carpeta del motor de identidad (no se llama `sqlserver`; el estándar es **`mssql`**).

## Contenido

| Archivo | Uso |
|---------|-----|
| `init.sql` | Schema + seed de roles/permisos |
| `README.md` | Esta guía |

## Tablas

- `rol`, `permiso`, `rol_permiso`
- `usuario_identidad` (espejo canónico de MySQL `usuario`)
- `identidad_externa` (Google / Microsoft OAuth)
- `sesion_app` (hash de tokens Bearer)

## Arranque

```bash
docker compose up -d mssql
```

El API (`ensureMssqlSchema`) crea la BD `velora_identity` y las tablas al primer healthcheck.

Manual con sqlcmd dentro del contenedor:

```bash
docker exec -i velora-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Velora_Sql_2026!" -C -i /mssql-init/init.sql
```

Variables en `backend/.env`: `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`.
