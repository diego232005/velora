-- ============================================================
-- Velora - Casa de apuestas Liga BetPlay DIMAYOR
-- Motor: MySQL 8 / MariaDB
-- Curso: Bases de datos II
-- Solo CREATE TABLE + INSERT. Sin triggers, vistas ni procedimientos.
-- ============================================================

DROP DATABASE IF EXISTS velora_betplay;
CREATE DATABASE velora_betplay
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE velora_betplay;

-- ------------------------------------------------------------
-- 1. Geografia y catalogos de usuario
-- ------------------------------------------------------------

CREATE TABLE pais (
  id_pais INT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  codigo_iso CHAR(2) NOT NULL,
  prefijo_tel VARCHAR(6) NOT NULL
);

CREATE TABLE departamento (
  id_departamento INT PRIMARY KEY,
  id_pais INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  codigo_dane VARCHAR(10),
  FOREIGN KEY (id_pais) REFERENCES pais (id_pais)
);

CREATE TABLE ciudad (
  id_ciudad INT PRIMARY KEY,
  id_departamento INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  codigo_dane VARCHAR(10),
  FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)
);

CREATE TABLE tipo_documento (
  id_tipo_documento INT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  codigo VARCHAR(10) NOT NULL
);

CREATE TABLE rol (
  id_rol INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(120)
);

CREATE TABLE estado_usuario (
  id_estado_usuario INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(120)
);

CREATE TABLE empresa (
  id_empresa INT PRIMARY KEY,
  razon_social VARCHAR(120) NOT NULL,
  nit VARCHAR(20) NOT NULL,
  correo_contacto VARCHAR(120) NOT NULL,
  activa TINYINT NOT NULL
);

CREATE TABLE sucursal (
  id_sucursal INT PRIMARY KEY,
  id_empresa INT NOT NULL,
  id_ciudad INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  direccion VARCHAR(150) NOT NULL,
  activa TINYINT NOT NULL,
  FOREIGN KEY (id_empresa) REFERENCES empresa (id_empresa),
  FOREIGN KEY (id_ciudad) REFERENCES ciudad (id_ciudad)
);

CREATE TABLE usuario (
  id_usuario INT PRIMARY KEY,
  id_empresa INT NOT NULL,
  id_rol INT NOT NULL,
  id_estado_usuario INT NOT NULL,
  correo VARCHAR(120) NOT NULL,
  hash_contrasena VARCHAR(120) NOT NULL,
  fecha_registro DATETIME NOT NULL,
  ultimo_acceso DATETIME,
  FOREIGN KEY (id_empresa) REFERENCES empresa (id_empresa),
  FOREIGN KEY (id_rol) REFERENCES rol (id_rol),
  FOREIGN KEY (id_estado_usuario) REFERENCES estado_usuario (id_estado_usuario)
);

CREATE TABLE perfil_cliente (
  id_perfil INT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_ciudad INT NOT NULL,
  id_tipo_documento INT NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  numero_documento VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  FOREIGN KEY (id_ciudad) REFERENCES ciudad (id_ciudad),
  FOREIGN KEY (id_tipo_documento) REFERENCES tipo_documento (id_tipo_documento)
);

CREATE TABLE cuenta (
  id_cuenta INT PRIMARY KEY,
  id_usuario INT NOT NULL,
  saldo DECIMAL(12,2) NOT NULL,
  moneda CHAR(3) NOT NULL,
  bloqueada TINYINT NOT NULL,
  fecha_apertura DATETIME NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

CREATE TABLE sesion (
  id_sesion INT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token VARCHAR(80) NOT NULL,
  ip VARCHAR(40) NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME,
  activa TINYINT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

CREATE TABLE log_acceso (
  id_log_acceso INT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha DATETIME NOT NULL,
  ip VARCHAR(40) NOT NULL,
  dispositivo VARCHAR(80) NOT NULL,
  exito TINYINT NOT NULL,
  motivo_fallo VARCHAR(80),
  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ------------------------------------------------------------
-- 2. Competencia: DIMAYOR y Liga BetPlay
-- ------------------------------------------------------------

CREATE TABLE organizador (
  id_organizador INT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  nit VARCHAR(20) NOT NULL,
  sigla VARCHAR(20) NOT NULL
);

CREATE TABLE deporte (
  id_deporte INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(150)
);

CREATE TABLE reglamento (
  id_reglamento INT PRIMARY KEY,
  id_deporte INT NOT NULL,
  minutos_reglamentarios INT NOT NULL,
  tiempos INT NOT NULL,
  jugadores_por_equipo INT NOT NULL,
  descripcion VARCHAR(180),
  FOREIGN KEY (id_deporte) REFERENCES deporte (id_deporte)
);

CREATE TABLE liga (
  id_liga INT PRIMARY KEY,
  id_organizador INT NOT NULL,
  id_deporte INT NOT NULL,
  id_pais INT NOT NULL,
  nombre_oficial VARCHAR(80) NOT NULL,
  nombre_comercial VARCHAR(80) NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  cupos_equipos INT NOT NULL,
  FOREIGN KEY (id_organizador) REFERENCES organizador (id_organizador),
  FOREIGN KEY (id_deporte) REFERENCES deporte (id_deporte),
  FOREIGN KEY (id_pais) REFERENCES pais (id_pais)
);

CREATE TABLE temporada (
  id_temporada INT PRIMARY KEY,
  id_liga INT NOT NULL,
  anio INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activa TINYINT NOT NULL,
  FOREIGN KEY (id_liga) REFERENCES liga (id_liga)
);

CREATE TABLE torneo (
  id_torneo INT PRIMARY KEY,
  id_temporada INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  FOREIGN KEY (id_temporada) REFERENCES temporada (id_temporada)
);

CREATE TABLE fase_torneo (
  id_fase INT PRIMARY KEY,
  id_torneo INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  orden INT NOT NULL,
  FOREIGN KEY (id_torneo) REFERENCES torneo (id_torneo)
);

CREATE TABLE jornada (
  id_jornada INT PRIMARY KEY,
  id_torneo INT NOT NULL,
  id_fase INT NOT NULL,
  numero INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  FOREIGN KEY (id_torneo) REFERENCES torneo (id_torneo),
  FOREIGN KEY (id_fase) REFERENCES fase_torneo (id_fase)
);

CREATE TABLE estadio (
  id_estadio INT PRIMARY KEY,
  id_ciudad INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  capacidad INT NOT NULL,
  superficie VARCHAR(40) NOT NULL,
  FOREIGN KEY (id_ciudad) REFERENCES ciudad (id_ciudad)
);

CREATE TABLE equipo (
  id_equipo INT PRIMARY KEY,
  id_liga INT NOT NULL,
  id_ciudad INT NOT NULL,
  id_estadio_local INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  sigla VARCHAR(10) NOT NULL,
  fundacion DATE,
  activo_primera TINYINT NOT NULL,
  FOREIGN KEY (id_liga) REFERENCES liga (id_liga),
  FOREIGN KEY (id_ciudad) REFERENCES ciudad (id_ciudad),
  FOREIGN KEY (id_estadio_local) REFERENCES estadio (id_estadio)
);

CREATE TABLE posicion_jugador (
  id_posicion INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  abreviatura VARCHAR(5) NOT NULL
);

CREATE TABLE jugador (
  id_jugador INT PRIMARY KEY,
  id_posicion INT NOT NULL,
  id_pais INT NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  dorsal INT NOT NULL,
  FOREIGN KEY (id_posicion) REFERENCES posicion_jugador (id_posicion),
  FOREIGN KEY (id_pais) REFERENCES pais (id_pais)
);

CREATE TABLE plantilla (
  id_plantilla INT PRIMARY KEY,
  id_equipo INT NOT NULL,
  id_jugador INT NOT NULL,
  id_temporada INT NOT NULL,
  fecha_alta DATE NOT NULL,
  fecha_baja DATE,
  FOREIGN KEY (id_equipo) REFERENCES equipo (id_equipo),
  FOREIGN KEY (id_jugador) REFERENCES jugador (id_jugador),
  FOREIGN KEY (id_temporada) REFERENCES temporada (id_temporada)
);

CREATE TABLE historico_jugador (
  id_historico INT PRIMARY KEY,
  id_jugador INT NOT NULL,
  id_temporada INT NOT NULL,
  partidos INT NOT NULL,
  goles INT NOT NULL,
  asistencias INT NOT NULL,
  tarjetas INT NOT NULL,
  FOREIGN KEY (id_jugador) REFERENCES jugador (id_jugador),
  FOREIGN KEY (id_temporada) REFERENCES temporada (id_temporada)
);

CREATE TABLE estado_partido (
  id_estado_partido INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(120)
);

CREATE TABLE partido (
  id_partido INT PRIMARY KEY,
  id_jornada INT NOT NULL,
  id_estadio INT NOT NULL,
  id_equipo_local INT NOT NULL,
  id_equipo_visitante INT NOT NULL,
  id_estado_partido INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  goles_local INT,
  goles_visitante INT,
  minuto_actual INT,
  FOREIGN KEY (id_jornada) REFERENCES jornada (id_jornada),
  FOREIGN KEY (id_estadio) REFERENCES estadio (id_estadio),
  FOREIGN KEY (id_equipo_local) REFERENCES equipo (id_equipo),
  FOREIGN KEY (id_equipo_visitante) REFERENCES equipo (id_equipo),
  FOREIGN KEY (id_estado_partido) REFERENCES estado_partido (id_estado_partido)
);

-- ------------------------------------------------------------
-- 3. Mercados y apuestas
-- ------------------------------------------------------------

CREATE TABLE tipo_mercado (
  id_tipo_mercado INT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  admite_empate TINYINT NOT NULL
);

CREATE TABLE mercado (
  id_mercado INT PRIMARY KEY,
  id_partido INT NOT NULL,
  id_tipo_mercado INT NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  activo TINYINT NOT NULL,
  cierra_en DATETIME NOT NULL,
  FOREIGN KEY (id_partido) REFERENCES partido (id_partido),
  FOREIGN KEY (id_tipo_mercado) REFERENCES tipo_mercado (id_tipo_mercado)
);

CREATE TABLE seleccion (
  id_seleccion INT PRIMARY KEY,
  id_mercado INT NOT NULL,
  etiqueta VARCHAR(40) NOT NULL,
  cuota DECIMAL(6,2) NOT NULL,
  ganadora TINYINT,
  FOREIGN KEY (id_mercado) REFERENCES mercado (id_mercado)
);

CREATE TABLE tipo_apuesta (
  id_tipo_apuesta INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(120)
);

CREATE TABLE estado_apuesta (
  id_estado_apuesta INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(120)
);

CREATE TABLE apuesta (
  id_apuesta INT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_cuenta INT NOT NULL,
  id_tipo_apuesta INT NOT NULL,
  id_estado_apuesta INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  cuota_total DECIMAL(8,2) NOT NULL,
  ganancia_potencial DECIMAL(12,2) NOT NULL,
  fecha_hora DATETIME NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  FOREIGN KEY (id_cuenta) REFERENCES cuenta (id_cuenta),
  FOREIGN KEY (id_tipo_apuesta) REFERENCES tipo_apuesta (id_tipo_apuesta),
  FOREIGN KEY (id_estado_apuesta) REFERENCES estado_apuesta (id_estado_apuesta)
);

CREATE TABLE detalle_apuesta (
  id_detalle INT PRIMARY KEY,
  id_apuesta INT NOT NULL,
  id_seleccion INT NOT NULL,
  cuota_momento DECIMAL(6,2) NOT NULL,
  FOREIGN KEY (id_apuesta) REFERENCES apuesta (id_apuesta),
  FOREIGN KEY (id_seleccion) REFERENCES seleccion (id_seleccion)
);

-- ------------------------------------------------------------
-- 4. Pagos y movimientos
-- ------------------------------------------------------------

CREATE TABLE tipo_movimiento (
  id_tipo_movimiento INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  signo CHAR(1) NOT NULL,
  descripcion VARCHAR(120)
);

CREATE TABLE movimiento_cuenta (
  id_movimiento INT PRIMARY KEY,
  id_cuenta INT NOT NULL,
  id_tipo_movimiento INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  saldo_resultante DECIMAL(12,2) NOT NULL,
  fecha_hora DATETIME NOT NULL,
  referencia VARCHAR(60),
  FOREIGN KEY (id_cuenta) REFERENCES cuenta (id_cuenta),
  FOREIGN KEY (id_tipo_movimiento) REFERENCES tipo_movimiento (id_tipo_movimiento)
);

CREATE TABLE metodo_pago (
  id_metodo_pago INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  descripcion VARCHAR(120),
  activo TINYINT NOT NULL
);

CREATE TABLE pasarela_pago (
  id_pasarela INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL,
  proveedor VARCHAR(80) NOT NULL,
  activa TINYINT NOT NULL
);

CREATE TABLE transaccion_pago (
  id_transaccion INT PRIMARY KEY,
  id_cuenta INT NOT NULL,
  id_metodo_pago INT NOT NULL,
  id_pasarela INT NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  referencia_externa VARCHAR(60),
  fecha_hora DATETIME NOT NULL,
  FOREIGN KEY (id_cuenta) REFERENCES cuenta (id_cuenta),
  FOREIGN KEY (id_metodo_pago) REFERENCES metodo_pago (id_metodo_pago),
  FOREIGN KEY (id_pasarela) REFERENCES pasarela_pago (id_pasarela)
);

CREATE TABLE log_pago (
  id_log_pago INT PRIMARY KEY,
  id_transaccion INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  evento VARCHAR(40) NOT NULL,
  payload VARCHAR(180),
  codigo_respuesta VARCHAR(20),
  FOREIGN KEY (id_transaccion) REFERENCES transaccion_pago (id_transaccion)
);

-- ============================================================
-- DATOS DE DEMOSTRACION
-- ============================================================

INSERT INTO pais (id_pais, nombre, codigo_iso, prefijo_tel) VALUES
(1, 'Colombia', 'CO', '+57');

INSERT INTO departamento (id_departamento, id_pais, nombre, codigo_dane) VALUES
(1, 1, 'Antioquia', '05'),
(2, 1, 'Atlantico', '08'),
(3, 1, 'Bogota D.C.', '11'),
(4, 1, 'Boyaca', '15'),
(5, 1, 'Caldas', '17'),
(6, 1, 'Cesar', '20'),
(7, 1, 'Cordoba', '23'),
(8, 1, 'Meta', '50'),
(9, 1, 'Narino', '52'),
(10, 1, 'Norte de Santander', '54'),
(11, 1, 'Risaralda', '66'),
(12, 1, 'Santander', '68'),
(13, 1, 'Tolima', '73'),
(14, 1, 'Valle del Cauca', '76');

INSERT INTO ciudad (id_ciudad, id_departamento, nombre, codigo_dane) VALUES
(1, 1, 'Medellin', '05001'),
(2, 1, 'Rionegro', '05615'),
(3, 2, 'Barranquilla', '08001'),
(4, 3, 'Bogota', '11001'),
(5, 4, 'Tunja', '15001'),
(6, 5, 'Manizales', '17001'),
(7, 6, 'Valledupar', '20001'),
(8, 7, 'Monteria', '23001'),
(9, 8, 'Villavicencio', '50001'),
(10, 9, 'Pasto', '52001'),
(11, 10, 'Cucuta', '54001'),
(12, 11, 'Pereira', '66001'),
(13, 12, 'Bucaramanga', '68001'),
(14, 13, 'Ibague', '73001'),
(15, 14, 'Cali', '76001'),
(16, 14, 'Palmira', '76520');

INSERT INTO tipo_documento (id_tipo_documento, nombre, codigo) VALUES
(1, 'Cedula de ciudadania', 'CC'),
(2, 'Cedula de extranjeria', 'CE'),
(3, 'Pasaporte', 'PA'),
(4, 'NIT', 'NIT');

INSERT INTO rol (id_rol, nombre, descripcion) VALUES
(1, 'Administrador', 'Gestion interna de la plataforma'),
(2, 'Operador', 'Carga partidos y cuotas'),
(3, 'Cliente', 'Usuario que apuesta');

INSERT INTO estado_usuario (id_estado_usuario, nombre, descripcion) VALUES
(1, 'Activo', 'Puede ingresar y operar'),
(2, 'Suspendido', 'Acceso temporalmente restringido'),
(3, 'Bloqueado', 'Acceso cerrado');

INSERT INTO empresa (id_empresa, razon_social, nit, correo_contacto, activa) VALUES
(1, 'Velora Apuestas S.A.S.', '901456789-1', 'soporte@velora.example', 1);

INSERT INTO sucursal (id_sucursal, id_empresa, id_ciudad, nombre, direccion, activa) VALUES
(1, 1, 4, 'Velora Bogota', 'Cra 7 # 32-16', 1),
(2, 1, 1, 'Velora Medellin', 'Cll 10 # 43-20', 1);

-- La columna hash_contrasena guarda un texto de clase, no un cifrado real.
INSERT INTO usuario (id_usuario, id_empresa, id_rol, id_estado_usuario, correo, hash_contrasena, fecha_registro, ultimo_acceso) VALUES
(1, 1, 1, 1, 'admin@velora.example', 'clave_demo_admin', '2026-01-10 08:00:00', '2026-09-01 09:15:00'),
(2, 1, 2, 1, 'operador@velora.example', 'clave_demo_operador', '2026-01-12 09:00:00', '2026-09-01 18:40:00'),
(3, 1, 3, 1, 'laura.gomez@correo.com', 'clave_demo_123', '2026-02-03 14:20:00', '2026-09-02 11:05:00'),
(4, 1, 3, 1, 'andres.perez@correo.com', 'clave_demo_123', '2026-02-18 10:10:00', '2026-08-30 21:12:00'),
(5, 1, 3, 1, 'sofia.ramos@correo.com', 'clave_demo_123', '2026-03-05 16:45:00', '2026-09-02 08:22:00'),
(6, 1, 3, 1, 'camilo.torres@correo.com', 'clave_demo_123', '2026-04-11 11:30:00', '2026-08-28 19:50:00'),
(7, 1, 3, 2, 'valentina.diaz@correo.com', 'clave_demo_123', '2026-05-02 13:00:00', '2026-07-15 17:00:00');

INSERT INTO perfil_cliente (id_perfil, id_usuario, id_ciudad, id_tipo_documento, nombres, apellidos, telefono, numero_documento, fecha_nacimiento) VALUES
(1, 1, 4, 1, 'Marta', 'Suarez', '3105550101', '1010101010', '1988-04-12'),
(2, 2, 1, 1, 'Julian', 'Cano', '3105550102', '2020202020', '1990-09-21'),
(3, 3, 4, 1, 'Laura', 'Gomez', '3105550103', '3030303030', '1998-06-14'),
(4, 4, 15, 1, 'Andres', 'Perez', '3105550104', '4040404040', '1995-01-30'),
(5, 5, 1, 1, 'Sofia', 'Ramos', '3105550105', '5050505050', '2000-11-08'),
(6, 6, 3, 1, 'Camilo', 'Torres', '3105550106', '6060606060', '1997-03-19'),
(7, 7, 13, 1, 'Valentina', 'Diaz', '3105550107', '7070707070', '1999-07-25');

INSERT INTO cuenta (id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura) VALUES
(1, 3, 555000.00, 'COP', 0, '2026-02-03 14:25:00'),
(2, 4, 180000.00, 'COP', 0, '2026-02-18 10:15:00'),
(3, 5, 520000.00, 'COP', 0, '2026-03-05 16:50:00'),
(4, 6, 90000.00, 'COP', 0, '2026-04-11 11:35:00'),
(5, 7, 0.00, 'COP', 1, '2026-05-02 13:05:00');

INSERT INTO sesion (id_sesion, id_usuario, token, ip, fecha_inicio, fecha_fin, activa) VALUES
(1, 3, 'ses_laura_001', '181.49.10.21', '2026-09-02 10:50:00', NULL, 1),
(2, 5, 'ses_sofia_002', '186.80.22.14', '2026-09-02 08:10:00', NULL, 1),
(3, 4, 'ses_andres_003', '191.95.30.8', '2026-08-30 20:00:00', '2026-08-30 21:20:00', 0);

INSERT INTO log_acceso (id_log_acceso, id_usuario, fecha, ip, dispositivo, exito, motivo_fallo) VALUES
(1, 3, '2026-09-02 10:50:00', '181.49.10.21', 'Chrome Windows', 1, NULL),
(2, 5, '2026-09-02 08:10:00', '186.80.22.14', 'Safari iPhone', 1, NULL),
(3, 4, '2026-08-30 19:58:00', '191.95.30.8', 'Chrome Android', 0, 'Contraseña incorrecta'),
(4, 4, '2026-08-30 20:00:00', '191.95.30.8', 'Chrome Android', 1, NULL);

INSERT INTO organizador (id_organizador, nombre, nit, sigla) VALUES
(1, 'Division Mayor del Futbol Colombiano', '860012345-8', 'DIMAYOR');

INSERT INTO deporte (id_deporte, nombre, descripcion) VALUES
(1, 'Futbol', 'Unico deporte operado por Velora en esta etapa');

INSERT INTO reglamento (id_reglamento, id_deporte, minutos_reglamentarios, tiempos, jugadores_por_equipo, descripcion) VALUES
(1, 1, 90, 2, 11, 'Dos tiempos de 45 minutos. Plantel de 11 jugadores.');

INSERT INTO liga (id_liga, id_organizador, id_deporte, id_pais, nombre_oficial, nombre_comercial, categoria, cupos_equipos) VALUES
(1, 1, 1, 1, 'Categoria Primera A', 'Liga BetPlay DIMAYOR', 'Primera division', 20);

INSERT INTO temporada (id_temporada, id_liga, anio, fecha_inicio, fecha_fin, activa) VALUES
(1, 1, 2026, '2026-01-16', '2026-12-22', 1);

INSERT INTO torneo (id_torneo, id_temporada, nombre, codigo, fecha_inicio, fecha_fin) VALUES
(1, 1, 'Liga BetPlay DIMAYOR I 2026', '2026-I', '2026-01-16', '2026-06-08'),
(2, 1, 'Liga BetPlay DIMAYOR II 2026', '2026-II', '2026-07-10', '2026-12-22');

INSERT INTO fase_torneo (id_fase, id_torneo, nombre, orden) VALUES
(1, 1, 'Todos contra todos', 1),
(2, 1, 'Eliminacion directa', 2),
(3, 2, 'Todos contra todos', 1),
(4, 2, 'Cuadrangulares', 2),
(5, 2, 'Final', 3);

INSERT INTO jornada (id_jornada, id_torneo, id_fase, numero, fecha_inicio, fecha_fin) VALUES
(1, 2, 3, 1, '2026-07-18', '2026-07-21'),
(2, 2, 3, 2, '2026-07-25', '2026-07-28'),
(3, 2, 3, 8, '2026-08-29', '2026-09-01'),
(4, 2, 3, 9, '2026-09-05', '2026-09-08');

INSERT INTO estadio (id_estadio, id_ciudad, nombre, capacidad, superficie) VALUES
(1, 2, 'Alberto Grisales', 14000, 'Cesped'),
(2, 7, 'Armando Maestre Pavajeau', 11000, 'Cesped'),
(3, 15, 'Olimpico Pascual Guerrero', 35405, 'Cesped'),
(4, 13, 'Americo Montanini', 28000, 'Cesped'),
(5, 1, 'Atanasio Girardot', 44863, 'Cesped'),
(6, 5, 'La Independencia', 20630, 'Cesped'),
(7, 11, 'General Santander', 32163, 'Cesped'),
(8, 14, 'Manuel Murillo Toro', 28100, 'Cesped'),
(9, 16, 'Estadio Deportivo Cali', 42000, 'Cesped'),
(10, 10, 'Departamental Libertad', 20665, 'Cesped'),
(11, 12, 'Hernan Ramirez Villegas', 30297, 'Cesped'),
(12, 4, 'Metropolitano de Techo', 10000, 'Cesped'),
(13, 8, 'Jaraguay', 12000, 'Cesped'),
(14, 3, 'Metropolitano Roberto Melendez', 46692, 'Cesped'),
(15, 9, 'Bello Horizonte', 15000, 'Cesped'),
(16, 4, 'Nemesio Camacho El Campin', 39512, 'Cesped'),
(17, 6, 'Palogrande', 28678, 'Cesped');

INSERT INTO equipo (id_equipo, id_liga, id_ciudad, id_estadio_local, nombre, sigla, fundacion, activo_primera) VALUES
(1, 1, 2, 1, 'Aguilas Doradas', 'AGU', '2008-07-16', 1),
(2, 1, 7, 2, 'Alianza', 'ALI', '1991-01-16', 1),
(3, 1, 15, 3, 'America de Cali', 'AME', '1927-02-13', 1),
(4, 1, 13, 4, 'Atletico Bucaramanga', 'BUC', '1949-05-11', 1),
(5, 1, 1, 5, 'Atletico Nacional', 'NAC', '1947-03-07', 1),
(6, 1, 5, 6, 'Boyaca Chico', 'BOY', '2002-03-26', 1),
(7, 1, 11, 7, 'Cucuta Deportivo', 'CUC', '1949-09-10', 1),
(8, 1, 14, 8, 'Deportes Tolima', 'TOL', '1954-12-18', 1),
(9, 1, 16, 9, 'Deportivo Cali', 'CAL', '1912-11-23', 1),
(10, 1, 10, 10, 'Deportivo Pasto', 'PAS', '1949-10-12', 1),
(11, 1, 12, 11, 'Deportivo Pereira', 'PER', '1944-02-12', 1),
(12, 1, 4, 12, 'Fortaleza', 'FOR', '2010-11-01', 1),
(13, 1, 1, 5, 'Independiente Medellin', 'DIM', '1913-11-14', 1),
(14, 1, 4, 12, 'Internacional de Bogota', 'IDB', '1982-12-01', 1),
(15, 1, 8, 13, 'Jaguares', 'JAG', '2012-12-05', 1),
(16, 1, 3, 14, 'Junior', 'JUN', '1924-08-07', 1),
(17, 1, 9, 15, 'Llaneros', 'LLA', '2012-04-20', 1),
(18, 1, 4, 16, 'Millonarios', 'MIL', '1946-06-18', 1),
(19, 1, 6, 17, 'Once Caldas', 'ONC', '1961-01-16', 1),
(20, 1, 4, 16, 'Independiente Santa Fe', 'SFE', '1941-02-28', 1);

INSERT INTO posicion_jugador (id_posicion, nombre, abreviatura) VALUES
(1, 'Portero', 'POR'),
(2, 'Defensa', 'DEF'),
(3, 'Mediocampista', 'MED'),
(4, 'Delantero', 'DEL');

INSERT INTO jugador (id_jugador, id_posicion, id_pais, nombres, apellidos, fecha_nacimiento, dorsal) VALUES
(1, 1, 1, 'David', 'Ospina Rios', '1996-03-12', 1),
(2, 4, 1, 'Mateo', 'Rincon Villa', '1999-08-04', 9),
(3, 1, 1, 'Camilo', 'Arias Leon', '1995-01-22', 1),
(4, 3, 1, 'Kevin', 'Mena Cruz', '2001-05-17', 8),
(5, 4, 1, 'Luis', 'Ramos Palacio', '1997-10-09', 19),
(6, 2, 1, 'Andres', 'Hoyos Cardenas', '1994-12-01', 4),
(7, 1, 1, 'Nicolas', 'Pineda Soto', '1998-07-28', 12),
(8, 4, 1, 'Jhon', 'Castaño Gil', '2000-02-14', 11),
(9, 2, 1, 'Juan', 'Zapata Mejia', '1993-06-20', 3),
(10, 4, 1, 'Alfredo', 'Morelos Demo', '1996-06-21', 9),
(11, 1, 1, 'Oscar', 'Ruiz Pena', '1992-09-03', 1),
(12, 3, 1, 'Diego', 'Salamanca', '2002-04-11', 10),
(13, 2, 1, 'Hector', 'Peñaranda', '1995-11-16', 5),
(14, 4, 1, 'Yilmar', 'Gomez Luna', '1998-08-30', 7),
(15, 3, 1, 'Yeison', 'Guzman Demo', '1997-03-22', 10),
(16, 4, 1, 'Brayan', 'Gil Perea', '2001-01-05', 17),
(17, 1, 1, 'Guillermo', 'De Amores Demo', '1994-10-19', 1),
(18, 3, 1, 'Fabian', 'Vargas Nieto', '1999-12-08', 6),
(19, 4, 1, 'Andrey', 'Estupinan Demo', '1994-07-02', 11),
(20, 2, 1, 'Jose', 'Garcia Burbano', '1996-05-25', 2),
(21, 1, 1, 'Harlen', 'Castillo Demo', '1993-08-17', 1),
(22, 4, 1, 'Angelo', 'Rodriguez Demo', '1989-04-04', 9),
(23, 2, 1, 'Daniel', 'Paez Ortiz', '2000-09-13', 15),
(24, 3, 1, 'Sebastian', 'Navarro', '2001-06-07', 8),
(25, 1, 1, 'Andres', 'Mosquera Marmolejo', '1992-02-09', 1),
(26, 4, 1, 'Luciano', 'Pons Demo', '1990-04-18', 9),
(27, 3, 1, 'David', 'Silva Rios', '1998-01-27', 14),
(28, 4, 1, 'Duvan', 'Vergara Demo', '1996-09-09', 11),
(29, 1, 1, 'Pablo', 'Mina Lopez', '1997-03-03', 1),
(30, 4, 1, 'Pablo', 'Rojas Cano', '1991-12-23', 9),
(31, 4, 1, 'Luis', 'Muriel Demo', '1991-04-16', 9),
(32, 3, 1, 'Yimmi', 'Chara Demo', '1991-04-02', 8),
(33, 1, 1, 'Kevin', 'Lopez Duarte', '2002-08-21', 1),
(34, 4, 1, 'Michael', 'Rangel Demo', '1991-03-08', 9),
(35, 1, 1, 'Alvaro', 'Montero Demo', '1995-03-29', 1),
(36, 4, 1, 'Leonardo', 'Castro Demo', '1992-05-14', 10),
(37, 3, 1, 'Alejandro', 'Garcia Orozco', '2001-02-02', 20),
(38, 4, 1, 'Dayro', 'Moreno Demo', '1985-09-16', 17),
(39, 1, 1, 'Andres', 'Mosquera Marm', '1991-09-10', 1),
(40, 4, 1, 'Hugo', 'Rodallega Demo', '1985-06-25', 11);

INSERT INTO plantilla (id_plantilla, id_equipo, id_jugador, id_temporada, fecha_alta, fecha_baja) VALUES
(1, 1, 1, 1, '2026-01-10', NULL),
(2, 1, 2, 1, '2026-01-10', NULL),
(3, 2, 3, 1, '2026-01-10', NULL),
(4, 2, 4, 1, '2026-01-10', NULL),
(5, 3, 5, 1, '2026-01-10', NULL),
(6, 3, 6, 1, '2026-01-10', NULL),
(7, 4, 7, 1, '2026-01-10', NULL),
(8, 4, 8, 1, '2026-01-10', NULL),
(9, 5, 9, 1, '2026-01-10', NULL),
(10, 5, 10, 1, '2026-01-10', NULL),
(11, 6, 11, 1, '2026-01-10', NULL),
(12, 6, 12, 1, '2026-01-10', NULL),
(13, 7, 13, 1, '2026-01-10', NULL),
(14, 7, 14, 1, '2026-01-10', NULL),
(15, 8, 15, 1, '2026-01-10', NULL),
(16, 8, 16, 1, '2026-01-10', NULL),
(17, 9, 17, 1, '2026-01-10', NULL),
(18, 9, 18, 1, '2026-01-10', NULL),
(19, 10, 19, 1, '2026-01-10', NULL),
(20, 10, 20, 1, '2026-01-10', NULL),
(21, 11, 21, 1, '2026-01-10', NULL),
(22, 11, 22, 1, '2026-01-10', NULL),
(23, 12, 23, 1, '2026-01-10', NULL),
(24, 12, 24, 1, '2026-01-10', NULL),
(25, 13, 25, 1, '2026-01-10', NULL),
(26, 13, 26, 1, '2026-01-10', NULL),
(27, 14, 27, 1, '2026-01-10', NULL),
(28, 14, 28, 1, '2026-01-10', NULL),
(29, 15, 29, 1, '2026-01-10', NULL),
(30, 15, 30, 1, '2026-01-10', NULL),
(31, 16, 31, 1, '2026-01-10', NULL),
(32, 16, 32, 1, '2026-01-10', NULL),
(33, 17, 33, 1, '2026-01-10', NULL),
(34, 17, 34, 1, '2026-01-10', NULL),
(35, 18, 35, 1, '2026-01-10', NULL),
(36, 18, 36, 1, '2026-01-10', NULL),
(37, 19, 37, 1, '2026-01-10', NULL),
(38, 19, 38, 1, '2026-01-10', NULL),
(39, 20, 39, 1, '2026-01-10', NULL),
(40, 20, 40, 1, '2026-01-10', NULL);

INSERT INTO historico_jugador (id_historico, id_jugador, id_temporada, partidos, goles, asistencias, tarjetas) VALUES
(1, 10, 1, 24, 12, 3, 4),
(2, 31, 1, 23, 13, 5, 2),
(3, 15, 1, 22, 9, 6, 3),
(4, 36, 1, 21, 8, 4, 5),
(5, 19, 1, 25, 13, 4, 1),
(6, 5, 1, 20, 7, 2, 2);

INSERT INTO estado_partido (id_estado_partido, nombre, descripcion) VALUES
(1, 'Programado', 'Aun no inicia'),
(2, 'En vivo', 'Se esta jugando'),
(3, 'Finalizado', 'Ya tiene marcador oficial'),
(4, 'Aplazado', 'Se reprograma');

INSERT INTO partido (id_partido, id_jornada, id_estadio, id_equipo_local, id_equipo_visitante, id_estado_partido, fecha_hora, goles_local, goles_visitante, minuto_actual) VALUES
(1, 3, 5, 5, 16, 3, '2026-08-29 20:00:00', 1, 2, 90),
(2, 3, 16, 18, 3, 3, '2026-08-30 18:00:00', 2, 2, 90),
(3, 3, 8, 8, 19, 3, '2026-08-30 20:10:00', 1, 0, 90),
(4, 3, 9, 9, 13, 3, '2026-08-31 16:00:00', 0, 1, 90),
(5, 4, 16, 20, 14, 2, '2026-09-02 18:30:00', 1, 0, 67),
(6, 4, 5, 13, 1, 2, '2026-09-02 20:00:00', 0, 0, 34),
(7, 4, 14, 16, 18, 1, '2026-09-06 20:00:00', NULL, NULL, NULL),
(8, 4, 3, 3, 5, 1, '2026-09-07 18:00:00', NULL, NULL, NULL),
(9, 4, 17, 19, 10, 1, '2026-09-07 16:00:00', NULL, NULL, NULL),
(10, 4, 7, 7, 15, 1, '2026-09-08 15:00:00', NULL, NULL, NULL);

INSERT INTO tipo_mercado (id_tipo_mercado, nombre, codigo, admite_empate) VALUES
(1, 'Resultado final 1X2', '1X2', 1),
(2, 'Ambos marcan', 'BTTS', 0);

INSERT INTO mercado (id_mercado, id_partido, id_tipo_mercado, nombre, activo, cierra_en) VALUES
(1, 1, 1, 'Nacional vs Junior 1X2', 0, '2026-08-29 20:00:00'),
(2, 5, 1, 'Santa Fe vs Internacional 1X2', 1, '2026-09-02 18:30:00'),
(3, 6, 1, 'Medellin vs Aguilas 1X2', 1, '2026-09-02 20:00:00'),
(4, 7, 1, 'Junior vs Millonarios 1X2', 1, '2026-09-06 20:00:00'),
(5, 8, 1, 'America vs Nacional 1X2', 1, '2026-09-07 18:00:00'),
(6, 7, 2, 'Junior vs Millonarios ambos marcan', 1, '2026-09-06 20:00:00');

INSERT INTO seleccion (id_seleccion, id_mercado, etiqueta, cuota, ganadora) VALUES
(1, 1, '1', 1.85, 0),
(2, 1, 'X', 3.40, 0),
(3, 1, '2', 4.10, 1),
(4, 2, '1', 2.10, NULL),
(5, 2, 'X', 3.20, NULL),
(6, 2, '2', 3.50, NULL),
(7, 3, '1', 1.70, NULL),
(8, 3, 'X', 3.60, NULL),
(9, 3, '2', 5.00, NULL),
(10, 4, '1', 2.25, NULL),
(11, 4, 'X', 3.15, NULL),
(12, 4, '2', 3.20, NULL),
(13, 5, '1', 2.80, NULL),
(14, 5, 'X', 3.10, NULL),
(15, 5, '2', 2.45, NULL),
(16, 6, 'Si', 1.90, NULL),
(17, 6, 'No', 1.85, NULL);

INSERT INTO tipo_apuesta (id_tipo_apuesta, nombre, descripcion) VALUES
(1, 'Simple', 'Una sola seleccion'),
(2, 'Combinada', 'Varias selecciones en el mismo cupon');

INSERT INTO estado_apuesta (id_estado_apuesta, nombre, descripcion) VALUES
(1, 'Pendiente', 'El partido no termina'),
(2, 'Ganada', 'La seleccion acerto'),
(3, 'Perdida', 'La seleccion no acerto'),
(4, 'Anulada', 'Se cancelo el cupon');

INSERT INTO apuesta (id_apuesta, id_usuario, id_cuenta, id_tipo_apuesta, id_estado_apuesta, monto, cuota_total, ganancia_potencial, fecha_hora) VALUES
(1, 3, 1, 1, 2, 50000.00, 4.10, 205000.00, '2026-08-29 18:10:00'),
(2, 5, 3, 1, 1, 40000.00, 2.10, 84000.00, '2026-09-02 17:40:00'),
(3, 4, 2, 2, 1, 25000.00, 4.28, 107000.00, '2026-09-02 12:15:00');

INSERT INTO detalle_apuesta (id_detalle, id_apuesta, id_seleccion, cuota_momento) VALUES
(1, 1, 3, 4.10),
(2, 2, 4, 2.10),
(3, 3, 10, 2.25),
(4, 3, 16, 1.90);

INSERT INTO tipo_movimiento (id_tipo_movimiento, nombre, signo, descripcion) VALUES
(1, 'Deposito', '+', 'Ingreso de dinero a la cuenta'),
(2, 'Retiro', '-', 'Salida de dinero'),
(3, 'Apuesta', '-', 'Descuento al crear un cupon'),
(4, 'Premio', '+', 'Pago de una apuesta ganada');

INSERT INTO movimiento_cuenta (id_movimiento, id_cuenta, id_tipo_movimiento, monto, saldo_resultante, fecha_hora, referencia) VALUES
(1, 1, 1, 400000.00, 400000.00, '2026-02-03 14:30:00', 'DEP-0001'),
(2, 1, 3, 50000.00, 350000.00, '2026-08-29 18:10:00', 'APT-0001'),
(3, 1, 4, 205000.00, 555000.00, '2026-08-29 22:05:00', 'PRE-0001'),
(4, 3, 1, 560000.00, 560000.00, '2026-03-05 17:00:00', 'DEP-0002'),
(5, 3, 3, 40000.00, 520000.00, '2026-09-02 17:40:00', 'APT-0002'),
(6, 2, 1, 205000.00, 205000.00, '2026-02-18 10:20:00', 'DEP-0003'),
(7, 2, 3, 25000.00, 180000.00, '2026-09-02 12:15:00', 'APT-0003');

INSERT INTO metodo_pago (id_metodo_pago, nombre, descripcion, activo) VALUES
(1, 'PSE', 'Debito bancario colombiano', 1),
(2, 'Transferencia', 'Transferencia a cuenta de la empresa', 1);

INSERT INTO pasarela_pago (id_pasarela, nombre, proveedor, activa) VALUES
(1, 'PSE', 'ACH Colombia', 1);

INSERT INTO transaccion_pago (id_transaccion, id_cuenta, id_metodo_pago, id_pasarela, monto, estado, referencia_externa, fecha_hora) VALUES
(1, 1, 1, 1, 400000.00, 'Aprobada', 'PSE-10001', '2026-02-03 14:30:00'),
(2, 3, 1, 1, 560000.00, 'Aprobada', 'PSE-10002', '2026-03-05 17:00:00'),
(3, 2, 1, 1, 205000.00, 'Aprobada', 'PSE-10003', '2026-02-18 10:20:00'),
(4, 4, 1, 1, 90000.00, 'Aprobada', 'PSE-10004', '2026-04-11 11:40:00');

INSERT INTO log_pago (id_log_pago, id_transaccion, fecha_hora, evento, payload, codigo_respuesta) VALUES
(1, 1, '2026-02-03 14:30:01', 'CREADA', 'Inicio debito PSE cuenta 1', '200'),
(2, 1, '2026-02-03 14:30:08', 'APROBADA', 'Banco confirmo el pago', '200'),
(3, 2, '2026-03-05 17:00:02', 'CREADA', 'Inicio debito PSE cuenta 3', '200'),
(4, 2, '2026-03-05 17:00:09', 'APROBADA', 'Banco confirmo el pago', '200'),
(5, 3, '2026-02-18 10:20:03', 'CREADA', 'Inicio debito PSE cuenta 2', '200'),
(6, 3, '2026-02-18 10:20:11', 'APROBADA', 'Banco confirmo el pago', '200'),
(7, 4, '2026-04-11 11:40:02', 'CREADA', 'Inicio debito PSE cuenta 4', '200'),
(8, 4, '2026-04-11 11:40:10', 'APROBADA', 'Banco confirmo el pago', '200');
