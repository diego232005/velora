# WebSockets

## Endpoint

`ws://localhost:4000/ws` (mismo puerto HTTP del backend).

## Protocolo

Cliente puede enviar:

```json
{ "type": "subscribe", "channels": ["odds", "matches", "notifications"] }
{ "type": "ping" }
```

Servidor emite `hello`, `subscribed`, `pong` y broadcasts `{ channel, type, ... }`.

## Uso previsto

Actualizaciones de cuotas, estado de partidos, notificaciones. **No sustituye** validaciones REST ni persistencia.

## Firebase vs WS

- WS: push a clientes conectados ahora.
- Firebase: persistencia/notificaciones cuando el cliente no está en WS (stub sin credenciales).
