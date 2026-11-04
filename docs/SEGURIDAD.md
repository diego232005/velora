# Seguridad y juego responsable

## Controles implementados / parciales

- Validación de entradas en auth y apuestas.
- Consultas parametrizadas MySQL/PG.
- Token Bearer para apuestas/wallet/pagos.
- Idempotencia depósitos/apuestas.
- Webhook Wompi con checksum opcional.
- UI de juego responsable existente (componentes legales).

## Pendiente crítico

- Hash real de contraseñas (bcrypt/argon2) — hoy texto plano demo.
- Rate limiting login.
- Autorización por rol en bulk upload y sync.
- HTTPS obligatorio en despliegue.

## Alcance legal

El proyecto es **simulación universitaria**. Cubrir fútbol colombiano no otorga licencia para operar apuestas reales.
