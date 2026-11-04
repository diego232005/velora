# Arquitectura del sistema Velora

## Componentes

- **frontend/** — React 18 + Vite 6, consume REST y (opcional) WebSocket.
- **backend/** — Express (Node ≥18), capa multi-BD, Swagger UI, WS en `/ws`.
- **database/** — Scripts MySQL (seed BetPlay), PostgreSQL, SQL Server, Mongo, notas Firebase.
- **docker-compose.yml** — Orquestación local de servicios.

## Flujos principales

1. **Auth local:** POST `/api/auth/login` → token Bearer + user.
2. **Parrilla:** GET `/api/sports/matches` desde MySQL.
3. **Sync motor:** MySQL → PostgreSQL (`seleccion_ops` con `cuota_millis`).
4. **Apuesta:** POST `/api/bets/place` (auth) → débito atómico PG + espejo MySQL.
5. **Depósito prueba:** Wompi sandbox o adaptador `simulation-adapter` etiquetado.
6. **Tiempo real:** broadcast WS canales `odds`, `matches`, `notifications`.

## Límites universitarios

Simulación. Sin dinero real. Solo fútbol colombiano del alcance. Identidad visual propia.
