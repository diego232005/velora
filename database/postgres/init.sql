-- Velora PostgreSQL: motor de apuestas y libro financiero (centavos COP)
CREATE TABLE IF NOT EXISTS partido_ops (
  id_partido INTEGER PRIMARY KEY,
  id_equipo_local INTEGER NOT NULL,
  id_equipo_visitante INTEGER NOT NULL,
  estado VARCHAR(32) NOT NULL,
  fecha_hora TIMESTAMPTZ NOT NULL,
  goles_local INTEGER,
  goles_visitante INTEGER,
  minuto_actual INTEGER,
  fuente_mysql BOOLEAN NOT NULL DEFAULT TRUE,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mercado_ops (
  id_mercado INTEGER PRIMARY KEY,
  id_partido INTEGER NOT NULL REFERENCES partido_ops (id_partido),
  tipo_codigo VARCHAR(16) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  estado VARCHAR(32) NOT NULL DEFAULT 'abierto',
  cierra_en TIMESTAMPTZ,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seleccion_ops (
  id_seleccion INTEGER PRIMARY KEY,
  id_mercado INTEGER NOT NULL REFERENCES mercado_ops (id_mercado),
  etiqueta VARCHAR(40) NOT NULL,
  cuota_millis INTEGER NOT NULL CHECK (cuota_millis > 0),
  estado VARCHAR(32) NOT NULL DEFAULT 'abierta',
  ganadora BOOLEAN,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS historial_cuota (
  id BIGSERIAL PRIMARY KEY,
  id_seleccion INTEGER NOT NULL REFERENCES seleccion_ops (id_seleccion),
  cuota_millis INTEGER NOT NULL,
  origen VARCHAR(64) NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cupon (
  id_cupon BIGSERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL,
  id_cuenta INTEGER NOT NULL,
  tipo VARCHAR(16) NOT NULL,
  estado VARCHAR(32) NOT NULL,
  monto_centavos BIGINT NOT NULL CHECK (monto_centavos > 0),
  cuota_total_millis INTEGER NOT NULL,
  ganancia_potencial_centavos BIGINT NOT NULL,
  idempotency_key VARCHAR(80) UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  liquidado_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cupon_seleccion (
  id BIGSERIAL PRIMARY KEY,
  id_cupon BIGINT NOT NULL REFERENCES cupon (id_cupon),
  id_seleccion INTEGER NOT NULL REFERENCES seleccion_ops (id_seleccion),
  cuota_millis INTEGER NOT NULL,
  UNIQUE (id_cupon, id_seleccion)
);

CREATE TABLE IF NOT EXISTS libro_movimiento (
  id BIGSERIAL PRIMARY KEY,
  id_cuenta INTEGER NOT NULL,
  id_usuario INTEGER NOT NULL,
  tipo VARCHAR(32) NOT NULL,
  monto_centavos BIGINT NOT NULL,
  saldo_despues_centavos BIGINT NOT NULL,
  referencia VARCHAR(80) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referencia, tipo)
);

CREATE TABLE IF NOT EXISTS billetera_sim (
  id_cuenta INTEGER PRIMARY KEY,
  id_usuario INTEGER NOT NULL UNIQUE,
  saldo_centavos BIGINT NOT NULL DEFAULT 0 CHECK (saldo_centavos >= 0),
  moneda CHAR(3) NOT NULL DEFAULT 'COP',
  bloqueada BOOLEAN NOT NULL DEFAULT FALSE,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wompi_transaccion (
  id BIGSERIAL PRIMARY KEY,
  referencia VARCHAR(80) NOT NULL UNIQUE,
  id_usuario INTEGER NOT NULL,
  id_cuenta INTEGER NOT NULL,
  monto_centavos BIGINT NOT NULL,
  estado VARCHAR(32) NOT NULL,
  wompi_id VARCHAR(120),
  raw_evento JSONB,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partido_ops_estado ON partido_ops (estado);
CREATE INDEX IF NOT EXISTS idx_mercado_ops_partido ON mercado_ops (id_partido);
CREATE INDEX IF NOT EXISTS idx_cupon_usuario ON cupon (id_usuario);
CREATE INDEX IF NOT EXISTS idx_libro_cuenta ON libro_movimiento (id_cuenta);
