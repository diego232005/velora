# Backend Velora

API de Node.js para el login contra MySQL.

## Conexión configurada

- Host: `localhost`
- Puerto: `3306`
- Usuario: `root`
- Contraseña: `0000`
- Base de datos: `velora_betplay`

Esos valores están en `backend/.env`.

## 1. Crear la base en DBeaver

Ejecuta `database/mysql/init.sql`. Eso crea las 42 tablas y los usuarios de demostración.

## 2. Instalar y encender

```bash
cd backend
npm install
npm run seed:users
npm run dev
```

`seed:users` vuelve a dejar en MySQL las mismas cuentas que antes estaban en `users.js`.

La API queda en `http://localhost:4000`.

## Rutas

- `GET /api/health` — prueba la conexión a MySQL
- `GET /api/catalog/ciudades` — ciudades de Colombia
- `GET /api/catalog/tipos-documento` — CC, CE, pasaporte
- `POST /api/auth/login` — inicia sesión
- `POST /api/auth/register` — crea usuario, perfil y cuenta
- `POST /api/auth/recover` — comprueba si el correo existe
- `POST /api/auth/reset-password` — cambia la clave con correo + documento
- `GET /api/bulk/clients/template` — plantilla Excel vacía
- `GET /api/bulk/clients/sample` — Excel con 20 clientes aleatorios
- `POST /api/bulk/clients` — importa el Excel a MySQL

Ejemplo:

```json
{
  "identifier": "laura.gomez@correo.com",
  "password": "clave_demo_123"
}
```

No usa tokens. El frontend guarda la sesión en `sessionStorage` o `localStorage`.
