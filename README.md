# Velora

Casa de apuestas de **demostración universitaria**, limitada al **fútbol colombiano (Liga BetPlay DIMAYOR)**. No procesa dinero real.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite 6 |
| Backend | Node.js + Express |
| Datos | MySQL + PostgreSQL + SQL Server + MongoDB + Firebase |
| Docs API | Swagger UI `/api/docs` |
| Tiempo real | WebSockets `/ws` |

Detalle de auditoría: [`docs/AUDITORIA_INICIAL.md`](docs/AUDITORIA_INICIAL.md).

## Requisitos

- Node.js 18.18+ (recomendado 20 LTS)
- npm
- Motores de BD (vía Docker Compose **o** instalación local)
- Docker Desktop (recomendado) — ver [`docs/DOCKER.md`](docs/DOCKER.md)

## Arranque con túnel público (Tunnelmole)

```bash
npm install          # una vez, en la raíz del repo
npm run dev:public   # backend + frontend + tmole
```

URLs fijas: configura `TMOLE_API_DOMAIN` / `TMOLE_WEB_DOMAIN` en `.env` (raíz). Ver [`docs/TUNNELMOLE.md`](docs/TUNNELMOLE.md).

## Arranque rápido (sin Docker)

### 1. MySQL

Ejecuta `database/mysql/init.sql` en DBeaver/MySQL.

### 2. Backend

```bash
cd backend
copy .env.example .env   # Windows
npm install
npm run seed:users
npm run dev
```

API: `http://localhost:4000`  
Swagger: `http://localhost:4000/api/docs`  
WS: `ws://localhost:4000/ws`  
Health multi-BD: `http://localhost:4000/api/health?all=1`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173`

### 4. Resto de bases

Levanta PostgreSQL, SQL Server, MongoDB (y opcionalmente emulador Firebase). Copia variables de `.env.example`.  
Schemas: `database/postgres/init.sql`, `database/mssql/init.sql`, `database/mongo/init.js`.

Con Docker:

```bash
docker compose up -d --build
```

## Login demo

Según el seed del archivo SQL del repo:

| Correo | Contraseña |
|--------|------------|
| laura.gomez@correo.com | clave_demo_123 |
| andres.perez@correo.com | clave_demo_123 |

Si tu MySQL local ya estaba cargado con un seed anterior, pueden existir variantes como `laura@correo.com` / `clave_123`. Comprueba con `SELECT correo FROM usuario`.

## Rutas UI

- `/` partidos desde API (BetPlay)
- `/login` `/register` `/forgot-password`
- `/billetera` saldo, depósitos sim/Wompi, historial
- `/carga-masiva` Excel clientes

## Documentación

| Documento | Tema |
|-----------|------|
| [`docs/AUDITORIA_INICIAL.md`](docs/AUDITORIA_INICIAL.md) | Auditoría |
| [`docs/ARQUITECTURA_DATOS.md`](docs/ARQUITECTURA_DATOS.md) | 5 bases |
| [`docs/ARQUITECTURA_SISTEMA.md`](docs/ARQUITECTURA_SISTEMA.md) | Sistema |
| [`docs/IMPORTACION_DATOS_DEPORTIVOS.md`](docs/IMPORTACION_DATOS_DEPORTIVOS.md) | Datos deportivos |
| [`docs/MODELO_DE_NEGOCIO.md`](docs/MODELO_DE_NEGOCIO.md) | Apuestas |
| [`docs/PAGOS_WOMPI.md`](docs/PAGOS_WOMPI.md) | Wompi |
| [`docs/WEBSOCKETS.md`](docs/WEBSOCKETS.md) | WS |
| [`docs/AUTENTICACION.md`](docs/AUTENTICACION.md) | Auth / OAuth |
| [`docs/GOOGLE_DRIVE.md`](docs/GOOGLE_DRIVE.md) | Drive |
| [`docs/DOCKER.md`](docs/DOCKER.md) | Docker |
| [`docs/DESPLIEGUE_CLOUDFLARE.md`](docs/DESPLIEGUE_CLOUDFLARE.md) | Cloudflare |
| [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md) | Seguridad |
| [`docs/PRUEBAS.md`](docs/PRUEBAS.md) | Pruebas |

## Pruebas

```bash
cd backend
npm test
```
