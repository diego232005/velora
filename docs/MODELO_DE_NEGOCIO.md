# Modelo de negocio de apuestas (simulación)

## Entidades

Usuarios/roles (SQL Server + MySQL), clubes/jugadores/competiciones (MySQL), partidos/mercados/selecciones/cupones/libro/Wompi (PostgreSQL), auditoría (Mongo), notificaciones (Firebase).

## Mercados habilitados en seed

- Resultado 1X2
- Ambos marcan (BTTS)

Solo se aceptan apuestas si en PostgreSQL `mercado_ops.estado=abierto` y `seleccion_ops.estado=abierta`, y el partido no está finalizado/aplazado/cancelado.

## Dinero

- Unidades: **centavos COP** (enteros) en PostgreSQL.
- Cuotas: **milésimas** (2.50 → 2500).
- Cálculos solo en backend (`utils/money.js`, `services/betting.js`).
- Idempotencia: header `Idempotency-Key` / campo `idempotency_key`.
- Libro append-only con UNIQUE `(referencia, tipo)`.

## Liquidación

Reglas de settlement automático completo: **pendiente de ampliar**; no declarar liquidación masiva como terminada hasta implementar y probar `bets:settle`.
