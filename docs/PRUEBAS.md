# Pruebas

## Ejecutadas en esta sesión

```bash
cd backend
npm install
npm test
```

Prueba unitaria de dinero (`tests/money.test.js`) — ejecutar tras instalar dependencias.

## Pendientes (requieren infra)

| Prueba | Requisito |
|--------|-----------|
| `GET /api/health?all=1` | 5 motores arriba |
| Apuestas concurrentes | PostgreSQL |
| Webhook duplicado | PG + script |
| OAuth real | Credenciales |
| Wompi sandbox | Claves |
| Docker compose | Docker Desktop |
| E2E frontend | Playwright/Cypress por añadir |

No se inventan resultados de pruebas no ejecutadas.
