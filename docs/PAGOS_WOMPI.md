# Wompi — entorno de pruebas (Sandbox)

## Estado

Modo **Sandbox** = correcto para el proyecto universitario. **No desactives** el modo de pruebas.

Llaves en `backend/.env` (prefijos `pub_test_` / `prv_test_` / `test_events_` / `test_integrity_`).

## URL de eventos (webhook) en el panel Wompi

Ruta de la API:

```text
/api/payments/wompi/webhook
```

| Entorno | URL a pegar en “URL de Eventos” |
|---------|----------------------------------|
| Local sin túnel | **No funciona** (`localhost` no es alcanzable por Wompi) |
| Local con ngrok | `https://TU-SUBDOMINIO.ngrok-free.app/api/payments/wompi/webhook` |
| Servidor público | `https://tu-dominio.com/api/payments/wompi/webhook` |

Para la demo local puedes **dejar la URL vacía** y usar la billetera + simulación (`ALLOW_WOMPI_SIMULATION=true`).

## Widget & Web Checkout (integrado en `/billetera`)

Flujo según [docs Wompi](https://docs.wompi.co/docs/colombia/widget-checkout-web/):

1. Backend `POST /api/payments/wompi/checkout-session` genera referencia + firma `SHA256(reference + amountInCents + COP + integrity_secret)`.
2. Frontend monta `https://checkout.wompi.co/widget.js` o abre Web Checkout `https://checkout.wompi.co/p/`.
3. Tras pagar, redirect a `/billetera?id=<transaction_id>`; el crédito definitivo llega por webhook.

## URLs para probar en el navegador

1. Login: http://localhost:5173/login  
2. Billetera / Widget: http://localhost:5173/billetera  
3. Estado Wompi: http://localhost:4000/api/payments/wompi/status  
4. Webhook (POST): `http://localhost:4000/api/payments/wompi/webhook`

## Endpoints

- `GET /api/payments/wompi/status`
- `POST /api/payments/wompi/deposits` (auth Bearer)
- `POST /api/payments/wompi/simulate-approval` (auth; solo si `ALLOW_WOMPI_SIMULATION=true`)
- `POST /api/payments/wompi/webhook` (eventos Wompi; valida `WOMPI_EVENTS_SECRET` si viene checksum)

## Separación

Wompi acredita saldo de prueba. El motor de apuestas valida por su cuenta en PostgreSQL.
