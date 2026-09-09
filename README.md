# Velora

Casa de apuestas de demostración, limitada a la **Liga BetPlay DIMAYOR**. El proyecto está separado en frontend (React) y backend (Node.js + MySQL).

Velora no es un operador real. No procesa depósitos, retiros ni apuestas reales.

## Estructura

```text
bd/
├── frontend/     React + Vite
├── backend/      Node.js + Express + MySQL
└── database/     Script SQL para DBeaver
```

## Requisitos

- Node.js 18.18 o superior (recomendado: 20 LTS)
- MySQL o MariaDB en el puerto `3306`
- Usuario `root`, contraseña `0000`
- Base de datos `velora_betplay`
- DBeaver, si vas a revisar las tablas

## 1. Crear la base de datos

En DBeaver, ejecuta el script completo:

`database/velora_betplay.sql`

## 2. Encender el backend

```bash
cd backend
npm install
npm run seed:users
npm run dev
```

La API queda en `http://localhost:4000`.

El archivo `backend/.env` ya tiene:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=0000
DB_NAME=velora_betplay
```

## 3. Encender el frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

La interfaz queda en `http://localhost:5173`.

## Login

El login, el registro y la recuperación hablan con MySQL a través de Node. No hay tokens: la sesión se guarda en el navegador.

- Registro: inserta `usuario`, `perfil_cliente` y `cuenta` (saldo 0 COP).
- Recuperación: no envía correo. Pide el documento de la cuenta y actualiza `hash_contrasena`.

Cuentas de prueba:

| Correo | Contraseña |
| --- | --- |
| laura.gomez@correo.com | clave_demo_123 |
| andres.perez@correo.com | clave_demo_123 |
| sofia.ramos@correo.com | clave_demo_123 |
| valentina.diaz@correo.com | clave_demo_123 (suspendida) |

## Rutas del frontend

- `/` página principal
- `/login` inicio de sesión
- `/forgot-password` recuperación visual
- `/register` registro visual

## Dónde están los usuarios

Los mismos datos que antes estaban en `users.js` viven ahora en:

- `database/velora_betplay.sql` — carga inicial
- `backend/src/data/users.js` — semilla del backend
- tablas `usuario`, `perfil_cliente` y `cuenta` en MySQL
