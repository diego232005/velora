# Docker

## Archivos

- `docker-compose.yml` — mysql, postgres, mssql, mongo, backend, frontend; profile `firebase` opcional
- `backend/Dockerfile`, `frontend/Dockerfile`
- `backend/.env.docker`

## Arranque

```bash
docker compose up -d --build
```

Swagger: `http://localhost:4000/api/docs`  
UI: `http://localhost:5173`

## Verificación de persistencia

```bash
docker compose restart backend
curl http://localhost:4000/api/health?all=1
```

## Bloqueo actual en este host

**Docker no está instalado** (`docker` no reconocido en PowerShell, 2026-10-19). Los archivos están listos; la prueba de compose **no se ejecutó** aquí.

Instalar Docker Desktop para Windows y repetir los comandos anteriores.
