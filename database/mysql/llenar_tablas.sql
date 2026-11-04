-- ============================================================
-- Alimentacion minima: 10 registros por tabla
-- Base vacia (solo CREATE TABLE). IDs 1..10
-- Ejecutar: database\ejecutar_llenar.bat
-- O: mysql -u root -p velora_betplay < llenar_tablas.sql
-- ============================================================

USE velora_betplay;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE log_pago;
TRUNCATE TABLE transaccion_pago;
TRUNCATE TABLE pasarela_pago;
TRUNCATE TABLE metodo_pago;
TRUNCATE TABLE movimiento_cuenta;
TRUNCATE TABLE tipo_movimiento;
TRUNCATE TABLE detalle_apuesta;
TRUNCATE TABLE apuesta;
TRUNCATE TABLE estado_apuesta;
TRUNCATE TABLE tipo_apuesta;
TRUNCATE TABLE seleccion;
TRUNCATE TABLE mercado;
TRUNCATE TABLE tipo_mercado;
TRUNCATE TABLE partido;
TRUNCATE TABLE estado_partido;
TRUNCATE TABLE historico_jugador;
TRUNCATE TABLE plantilla;
TRUNCATE TABLE jugador;
TRUNCATE TABLE posicion_jugador;
TRUNCATE TABLE equipo;
TRUNCATE TABLE estadio;
TRUNCATE TABLE jornada;
TRUNCATE TABLE fase_torneo;
TRUNCATE TABLE torneo;
TRUNCATE TABLE temporada;
TRUNCATE TABLE liga;
TRUNCATE TABLE reglamento;
TRUNCATE TABLE deporte;
TRUNCATE TABLE organizador;
TRUNCATE TABLE log_acceso;
TRUNCATE TABLE sesion;
TRUNCATE TABLE cuenta;
TRUNCATE TABLE perfil_cliente;
TRUNCATE TABLE usuario;
TRUNCATE TABLE sucursal;
TRUNCATE TABLE empresa;
TRUNCATE TABLE estado_usuario;
TRUNCATE TABLE rol;
TRUNCATE TABLE tipo_documento;
TRUNCATE TABLE ciudad;
TRUNCATE TABLE departamento;
TRUNCATE TABLE pais;
SET FOREIGN_KEY_CHECKS = 1;
INSERT INTO pais (id_pais, nombre, codigo_iso, prefijo_tel) VALUES
(1, 'Colombia', 'CO', '+57'),
(2, 'Argentina', 'AR', '+54'),
(3, 'Brasil', 'BR', '+55'),
(4, 'Chile', 'CL', '+56'),
(5, 'Ecuador', 'EC', '+593'),
(6, 'Mexico', 'MX', '+52'),
(7, 'Uruguay', 'UY', '+598'),
(8, 'Paraguay', 'PY', '+595'),
(9, 'Peru', 'PE', '+51'),
(10, 'Venezuela', 'VE', '+58');

INSERT INTO departamento (id_departamento, id_pais, nombre, codigo_dane) VALUES
(1, 1, 'Antioquia', '05'),
(2, 1, 'Atlantico', '08'),
(3, 1, 'Bogota D.C.', '11'),
(4, 1, 'Valle del Cauca', '76'),
(5, 1, 'Santander', '68'),
(6, 1, 'Cundinamarca', '25'),
(7, 1, 'Bolivar', '13'),
(8, 1, 'Narino', '52'),
(9, 1, 'Tolima', '73'),
(10, 1, 'Risaralda', '66');

INSERT INTO ciudad (id_ciudad, id_departamento, nombre, codigo_dane) VALUES
(1, 1, 'Medellin', '05001'),
(2, 2, 'Barranquilla', '08001'),
(3, 3, 'Bogota', '11001'),
(4, 4, 'Cali', '76001'),
(5, 5, 'Bucaramanga', '68001'),
(6, 6, 'Soacha', '25754'),
(7, 7, 'Cartagena', '13001'),
(8, 8, 'Pasto', '52001'),
(9, 9, 'Ibague', '73001'),
(10, 10, 'Pereira', '66001');

INSERT INTO tipo_documento (id_tipo_documento, nombre, codigo) VALUES
(1, 'Cedula ciudadania', 'CC'),
(2, 'Cedula extranjeria', 'CE'),
(3, 'Pasaporte', 'PA'),
(4, 'NIT', 'NIT'),
(5, 'Tarjeta identidad', 'TI'),
(6, 'Registro civil', 'RC'),
(7, 'Permiso especial', 'PEP'),
(8, 'Visa', 'VS'),
(9, 'Licencia', 'LC'),
(10, 'Otro', 'OTR');

INSERT INTO rol (id_rol, nombre, descripcion) VALUES
(1, 'Administrador', 'Gestion interna'),
(2, 'Operador', 'Carga partidos y cuotas'),
(3, 'Cliente', 'Usuario que apuesta'),
(4, 'Soporte', 'Atencion al cliente'),
(5, 'Analista', 'Analisis de riesgo'),
(6, 'Cajero', 'Operacion presencial'),
(7, 'Supervisor', 'Supervision de sucursal'),
(8, 'Marketing', 'Campanas'),
(9, 'Contabilidad', 'Conciliacion'),
(10, 'Invitado', 'Solo lectura');

INSERT INTO estado_usuario (id_estado_usuario, nombre, descripcion) VALUES
(1, 'Activo', 'Puede operar'),
(2, 'Suspendido', 'Acceso restringido'),
(3, 'Bloqueado', 'Acceso cerrado'),
(4, 'Pendiente', 'Registro incompleto'),
(5, 'Verificando', 'Validando identidad'),
(6, 'Inactivo', 'Sin uso reciente'),
(7, 'VIP', 'Cliente preferente'),
(8, 'Observado', 'Monitoreo'),
(9, 'Temporal', 'Acceso limitado'),
(10, 'Archivado', 'Historico');

INSERT INTO empresa (id_empresa, razon_social, nit, correo_contacto, activa) VALUES
(1, 'Velora Apuestas S.A.S.', '901456789-1', 'soporte@velora.example', 1),
(2, 'Velora Norte S.A.S.', '901456701-1', 'norte@velora.example', 1),
(3, 'Velora Sur S.A.S.', '901456702-2', 'sur@velora.example', 1),
(4, 'Velora Costa S.A.S.', '901456703-3', 'costa@velora.example', 1),
(5, 'Velora Andes S.A.S.', '901456704-4', 'andes@velora.example', 1),
(6, 'Velora Digital S.A.S.', '901456705-5', 'digital@velora.example', 1),
(7, 'Velora Retail S.A.S.', '901456706-6', 'retail@velora.example', 1),
(8, 'Velora Pagos S.A.S.', '901456707-7', 'pagos@velora.example', 1),
(9, 'Velora Labs S.A.S.', '901456709-9', 'labs@velora.example', 1),
(10, 'Velora Holdings S.A.S.', '901456710-0', 'holdings@velora.example', 1);

INSERT INTO sucursal (id_sucursal, id_empresa, id_ciudad, nombre, direccion, activa) VALUES
(1, 1, 3, 'Velora Bogota', 'Cra 7 # 32-16', 1),
(2, 1, 1, 'Velora Medellin', 'Cll 10 # 43-20', 1),
(3, 1, 4, 'Velora Cali', 'Av 6N # 28-40', 1),
(4, 2, 2, 'Velora Barranquilla', 'Cra 53 # 75-20', 1),
(5, 3, 5, 'Velora Bucaramanga', 'Cra 33 # 42-15', 1),
(6, 4, 7, 'Velora Cartagena', 'Bocagrande 45', 1),
(7, 5, 9, 'Velora Ibague', 'Cll 14 # 16-30', 1),
(8, 6, 3, 'Velora Digital', 'Calle 100 # 19-50', 1),
(9, 7, 10, 'Velora Pereira', 'Cra 7 # 20-10', 1),
(10, 8, 8, 'Velora Pasto', 'Cll 18 # 25-10', 0);

INSERT INTO usuario (id_usuario, id_empresa, id_rol, id_estado_usuario, correo, hash_contrasena, fecha_registro, ultimo_acceso) VALUES
(1, 1, 1, 1, 'admin@velora.example', 'clave_admin', '2026-01-10 08:00:00', '2026-09-21 09:00:00'),
(2, 1, 2, 1, 'operador@velora.example', 'clave_operador', '2026-01-12 09:00:00', '2026-09-21 10:00:00'),
(3, 1, 3, 1, 'laura@correo.com', 'clave_123', '2026-02-03 14:20:00', '2026-09-20 11:00:00'),
(4, 1, 3, 1, 'andres@correo.com', 'clave_123', '2026-02-18 10:10:00', '2026-09-19 12:00:00'),
(5, 1, 3, 1, 'sofia@correo.com', 'clave_123', '2026-03-05 16:45:00', '2026-09-18 13:00:00'),
(6, 1, 3, 1, 'camilo@correo.com', 'clave_123', '2026-04-11 11:30:00', '2026-09-17 14:00:00'),
(7, 1, 3, 2, 'valentina@correo.com', 'clave_123', '2026-05-02 13:00:00', '2026-08-01 15:00:00'),
(8, 1, 3, 1, 'diego@correo.com', 'clave_123', '2026-06-01 09:00:00', '2026-09-16 16:00:00'),
(9, 1, 4, 1, 'soporte@velora.example', 'clave_soporte', '2026-06-08 09:00:00', '2026-09-15 17:00:00'),
(10, 1, 3, 1, 'maria@correo.com', 'clave_123', '2026-06-10 09:00:00', '2026-09-14 18:00:00');

INSERT INTO perfil_cliente (id_perfil, id_usuario, id_ciudad, id_tipo_documento, nombres, apellidos, telefono, numero_documento, fecha_nacimiento) VALUES
(1, 1, 3, 1, 'Marta', 'Suarez', '3105550101', '1010101010', '1988-04-12'),
(2, 2, 1, 1, 'Julian', 'Cano', '3105550102', '2020202020', '1990-09-21'),
(3, 3, 3, 1, 'Laura', 'Gomez', '3105550103', '3030303030', '1998-06-14'),
(4, 4, 4, 1, 'Andres', 'Perez', '3105550104', '4040404040', '1995-01-30'),
(5, 5, 1, 1, 'Sofia', 'Ramos', '3105550105', '5050505050', '2000-11-08'),
(6, 6, 2, 1, 'Camilo', 'Torres', '3105550106', '6060606060', '1997-03-19'),
(7, 7, 5, 1, 'Valentina', 'Diaz', '3105550107', '7070707070', '1999-07-25'),
(8, 8, 3, 1, 'Diego', 'Ruiz', '3105550108', '8080808080', '1996-05-05'),
(9, 9, 1, 1, 'Hugo', 'Nieto', '3105550109', '9090909090', '1989-08-18'),
(10, 10, 10, 1, 'Maria', 'Lopez', '3105550110', '1010111011', '1994-02-02');

INSERT INTO cuenta (id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura) VALUES
(1, 3, 555000.00, 'COP', 0, '2026-02-03 14:25:00'),
(2, 4, 180000.00, 'COP', 0, '2026-02-18 10:15:00'),
(3, 5, 520000.00, 'COP', 0, '2026-03-05 16:50:00'),
(4, 6, 90000.00, 'COP', 0, '2026-04-11 11:35:00'),
(5, 7, 0.00, 'COP', 1, '2026-05-02 13:05:00'),
(6, 8, 210000.00, 'COP', 0, '2026-06-01 09:10:00'),
(7, 10, 275000.00, 'COP', 0, '2026-06-10 09:10:00'),
(8, 1, 10000.00, 'COP', 0, '2026-01-10 08:10:00'),
(9, 2, 50000.00, 'COP', 0, '2026-01-12 09:10:00'),
(10, 9, 25000.00, 'COP', 0, '2026-06-08 09:10:00');

INSERT INTO sesion (id_sesion, id_usuario, token, ip, fecha_inicio, fecha_fin, activa) VALUES
(1, 3, 'ses_laura_001', '181.49.10.21', '2026-09-20 10:50:00', NULL, 1),
(2, 5, 'ses_sofia_002', '186.80.22.14', '2026-09-20 08:10:00', NULL, 1),
(3, 4, 'ses_andres_003', '191.95.30.8', '2026-08-30 20:00:00', '2026-08-30 21:20:00', 0),
(4, 6, 'ses_camilo_004', '190.1.1.6', '2026-09-16 15:00:00', NULL, 1),
(5, 8, 'ses_diego_005', '190.1.1.8', '2026-09-16 16:00:00', NULL, 1),
(6, 10, 'ses_maria_006', '190.1.1.10', '2026-09-14 18:00:00', '2026-09-14 19:00:00', 0),
(7, 1, 'ses_admin_007', '10.0.0.1', '2026-09-21 09:00:00', NULL, 1),
(8, 2, 'ses_oper_008', '10.0.0.2', '2026-09-21 10:00:00', NULL, 1),
(9, 9, 'ses_sop_009', '10.0.0.9', '2026-09-15 17:00:00', '2026-09-15 18:00:00', 0),
(10, 7, 'ses_vale_010', '190.1.1.7', '2026-08-01 15:00:00', '2026-08-01 15:20:00', 0);

INSERT INTO log_acceso (id_log_acceso, id_usuario, fecha, ip, dispositivo, exito, motivo_fallo) VALUES
(1, 3, '2026-09-20 10:50:00', '181.49.10.21', 'Chrome Windows', 1, NULL),
(2, 5, '2026-09-20 08:10:00', '186.80.22.14', 'Safari iPhone', 1, NULL),
(3, 4, '2026-08-30 19:58:00', '191.95.30.8', 'Chrome Android', 0, 'Contrasena incorrecta'),
(4, 4, '2026-08-30 20:00:00', '191.95.30.8', 'Chrome Android', 1, NULL),
(5, 6, '2026-09-16 15:00:00', '190.1.1.6', 'Opera Windows', 1, NULL),
(6, 8, '2026-09-16 16:00:00', '190.1.1.8', 'Chrome Mac', 1, NULL),
(7, 10, '2026-09-14 18:00:00', '190.1.1.10', 'Edge Windows', 1, NULL),
(8, 1, '2026-09-21 09:00:00', '10.0.0.1', 'Chrome Windows', 1, NULL),
(9, 7, '2026-08-01 15:00:00', '190.1.1.7', 'Chrome Windows', 0, 'Usuario suspendido'),
(10, 2, '2026-09-21 10:00:00', '10.0.0.2', 'Firefox Linux', 1, NULL);

INSERT INTO organizador (id_organizador, nombre, nit, sigla) VALUES
(1, 'DIMAYOR', '860012345-8', 'DIMAYOR'),
(2, 'FCF', '860000001-1', 'FCF'),
(3, 'Conmebol Demo', '860000002-2', 'CONMEBOL'),
(4, 'Liga Femenina Org', '860000003-3', 'LFO'),
(5, 'Ascenso Org', '860000004-4', 'ASC'),
(6, 'Copa Colombia Org', '860000005-5', 'CCO'),
(7, 'Torneo Juvenil Org', '860000006-6', 'TJO'),
(8, 'Futsal Org', '860000007-7', 'FSO'),
(9, 'Regional Org', '860000009-9', 'REG'),
(10, 'Internacional Org', '860000010-0', 'INT');

INSERT INTO deporte (id_deporte, nombre, descripcion) VALUES
(1, 'Futbol', 'Futbol 11'),
(2, 'Futbol sala', '5v5 indoor'),
(3, 'Futbol playa', 'Arena'),
(4, 'Baloncesto', '5v5 canasta'),
(5, 'Voleibol', '6v6'),
(6, 'Tenis', 'Individual'),
(7, 'Beisbol', 'Bate y pelota'),
(8, 'Hockey', 'Stick'),
(9, 'Rugby', '15v15'),
(10, 'Ciclismo', 'Ruta');

INSERT INTO reglamento (id_reglamento, id_deporte, minutos_reglamentarios, tiempos, jugadores_por_equipo, descripcion) VALUES
(1, 1, 90, 2, 11, 'Dos tiempos de 45'),
(2, 2, 40, 2, 5, 'Futsal'),
(3, 3, 36, 3, 5, 'Playa'),
(4, 4, 40, 4, 5, 'Baloncesto'),
(5, 5, 0, 5, 6, 'Voleibol sets'),
(6, 6, 0, 3, 1, 'Tenis'),
(7, 7, 0, 9, 9, 'Beisbol'),
(8, 8, 60, 3, 6, 'Hockey'),
(9, 9, 80, 2, 15, 'Rugby'),
(10, 10, 0, 1, 1, 'Ciclismo');

INSERT INTO liga (id_liga, id_organizador, id_deporte, id_pais, nombre_oficial, nombre_comercial, categoria, cupos_equipos) VALUES
(1, 1, 1, 1, 'Categoria Primera A', 'Liga BetPlay', 'Primera', 20),
(2, 1, 1, 1, 'Categoria Primera B', 'Torneo BetPlay', 'Segunda', 16),
(3, 4, 1, 1, 'Liga Femenina', 'Liga Femenina BetPlay', 'Femenina', 16),
(4, 3, 1, 2, 'Liga Argentina Demo', 'Liga AR', 'Primera', 20),
(5, 3, 1, 3, 'Brasileirao Demo', 'Serie A BR', 'Primera', 20),
(6, 6, 1, 1, 'Copa Colombia', 'Copa BetPlay', 'Copa', 36),
(7, 5, 1, 1, 'Ascenso Final', 'Ascenso Demo', 'Ascenso', 8),
(8, 8, 2, 1, 'Liga Futsal', 'Futsal BetPlay', 'Futsal', 12),
(9, 7, 1, 1, 'Juvenil A', 'Juvenil Demo', 'Juvenil', 20),
(10, 9, 1, 1, 'Regional Centro', 'Regional Demo', 'Regional', 10);

INSERT INTO temporada (id_temporada, id_liga, anio, fecha_inicio, fecha_fin, activa) VALUES
(1, 1, 2026, '2026-01-16', '2026-12-22', 1),
(2, 1, 2025, '2025-01-15', '2025-12-20', 0),
(3, 2, 2026, '2026-02-01', '2026-11-30', 1),
(4, 3, 2026, '2026-02-15', '2026-11-15', 1),
(5, 4, 2026, '2026-01-20', '2026-12-10', 1),
(6, 5, 2026, '2026-01-25', '2026-12-05', 1),
(7, 6, 2026, '2026-03-01', '2026-11-01', 1),
(8, 7, 2026, '2026-04-01', '2026-10-01', 1),
(9, 8, 2026, '2026-05-01', '2026-09-30', 1),
(10, 9, 2026, '2026-06-01', '2026-12-15', 1);

INSERT INTO torneo (id_torneo, id_temporada, nombre, codigo, fecha_inicio, fecha_fin) VALUES
(1, 1, 'Liga BetPlay I 2026', '2026-I', '2026-01-16', '2026-06-08'),
(2, 1, 'Liga BetPlay II 2026', '2026-II', '2026-07-10', '2026-12-22'),
(3, 3, 'Torneo BetPlay Apertura', 'TB-A26', '2026-02-01', '2026-06-30'),
(4, 4, 'Liga Femenina Apertura', 'LF-A26', '2026-02-15', '2026-06-15'),
(5, 5, 'Liga AR Clausura', 'AR-C26', '2026-07-01', '2026-12-10'),
(6, 6, 'Serie A BR 2026', 'BR-26', '2026-01-25', '2026-12-05'),
(7, 7, 'Copa BetPlay 2026', 'CB-26', '2026-03-01', '2026-11-01'),
(8, 8, 'Ascenso Final 2026', 'AF-26', '2026-04-01', '2026-10-01'),
(9, 9, 'Futsal Apertura', 'FS-A26', '2026-05-01', '2026-07-31'),
(10, 10, 'Juvenil Clausura', 'JV-C26', '2026-08-01', '2026-12-15');

INSERT INTO fase_torneo (id_fase, id_torneo, nombre, orden) VALUES
(1, 1, 'Todos contra todos', 1),
(2, 1, 'Eliminacion directa', 2),
(3, 2, 'Todos contra todos', 1),
(4, 2, 'Cuadrangulares', 2),
(5, 2, 'Final', 3),
(6, 3, 'Fase regular', 1),
(7, 4, 'Grupos', 1),
(8, 7, 'Dieciseisavos', 1),
(9, 8, 'Semifinal', 1),
(10, 9, 'Final four', 1);

INSERT INTO jornada (id_jornada, id_torneo, id_fase, numero, fecha_inicio, fecha_fin) VALUES
(1, 2, 3, 1, '2026-07-18', '2026-07-21'),
(2, 2, 3, 2, '2026-07-25', '2026-07-28'),
(3, 2, 3, 8, '2026-08-29', '2026-09-01'),
(4, 2, 3, 9, '2026-09-05', '2026-09-08'),
(5, 2, 3, 10, '2026-09-12', '2026-09-15'),
(6, 3, 6, 1, '2026-02-01', '2026-02-03'),
(7, 3, 6, 2, '2026-02-08', '2026-02-10'),
(8, 4, 7, 1, '2026-02-15', '2026-02-17'),
(9, 7, 8, 1, '2026-03-05', '2026-03-07'),
(10, 8, 9, 1, '2026-04-05', '2026-04-07');

INSERT INTO estadio (id_estadio, id_ciudad, nombre, capacidad, superficie) VALUES
(1, 1, 'Atanasio Girardot', 44863, 'Cesped'),
(2, 2, 'Metropolitano', 46692, 'Cesped'),
(3, 3, 'El Campin', 39512, 'Cesped'),
(4, 4, 'Pascual Guerrero', 35405, 'Cesped'),
(5, 5, 'Americo Montanini', 28000, 'Cesped'),
(6, 7, 'Jaime Moron', 16000, 'Cesped'),
(7, 8, 'Departamental Libertad', 20665, 'Cesped'),
(8, 9, 'Murillo Toro', 28100, 'Cesped'),
(9, 10, 'Hernan Ramirez', 30297, 'Cesped'),
(10, 3, 'Metropolitano de Techo', 10000, 'Cesped');

INSERT INTO equipo (id_equipo, id_liga, id_ciudad, id_estadio_local, nombre, sigla, fundacion, activo_primera) VALUES
(1, 1, 1, 1, 'Atletico Nacional', 'NAC', '1947-03-07', 1),
(2, 1, 1, 1, 'Independiente Medellin', 'DIM', '1913-11-14', 1),
(3, 1, 2, 2, 'Junior', 'JUN', '1924-08-07', 1),
(4, 1, 3, 3, 'Millonarios', 'MIL', '1946-06-18', 1),
(5, 1, 3, 3, 'Santa Fe', 'SFE', '1941-02-28', 1),
(6, 1, 4, 4, 'America de Cali', 'AME', '1927-02-13', 1),
(7, 1, 4, 4, 'Deportivo Cali', 'CAL', '1912-11-23', 1),
(8, 1, 5, 5, 'Atletico Bucaramanga', 'BUC', '1949-05-11', 1),
(9, 1, 9, 8, 'Deportes Tolima', 'TOL', '1954-12-18', 1),
(10, 1, 10, 9, 'Deportivo Pereira', 'PER', '1944-02-12', 1);

INSERT INTO posicion_jugador (id_posicion, nombre, abreviatura) VALUES
(1, 'Portero', 'POR'),
(2, 'Defensa', 'DEF'),
(3, 'Mediocampista', 'MED'),
(4, 'Delantero', 'DEL'),
(5, 'Lateral derecho', 'LD'),
(6, 'Lateral izquierdo', 'LI'),
(7, 'Volante defensivo', 'VOD'),
(8, 'Extremo derecho', 'ED'),
(9, 'Extremo izquierdo', 'EI'),
(10, 'Segundo delantero', 'SD');

INSERT INTO jugador (id_jugador, id_posicion, id_pais, nombres, apellidos, fecha_nacimiento, dorsal) VALUES
(1, 1, 1, 'David', 'Ospina', '1996-03-12', 1),
(2, 4, 1, 'Mateo', 'Rincon', '1999-08-04', 9),
(3, 1, 1, 'Camilo', 'Arias', '1995-01-22', 1),
(4, 3, 1, 'Kevin', 'Mena', '2001-05-17', 8),
(5, 4, 1, 'Luis', 'Ramos', '1997-10-09', 19),
(6, 2, 1, 'Andres', 'Hoyos', '1994-12-01', 4),
(7, 3, 1, 'Yeison', 'Guzman', '1997-03-22', 10),
(8, 4, 1, 'Alfredo', 'Morelos', '1996-06-21', 9),
(9, 2, 2, 'Ivan', 'Perez', '1993-09-09', 3),
(10, 4, 3, 'Joao', 'Silva', '1992-10-10', 11);

INSERT INTO plantilla (id_plantilla, id_equipo, id_jugador, id_temporada, fecha_alta, fecha_baja) VALUES
(1, 1, 1, 1, '2026-01-10', NULL),
(2, 1, 8, 1, '2026-01-10', NULL),
(3, 2, 3, 1, '2026-01-10', NULL),
(4, 2, 4, 1, '2026-01-10', NULL),
(5, 3, 5, 1, '2026-01-10', NULL),
(6, 3, 6, 1, '2026-01-10', NULL),
(7, 4, 7, 1, '2026-01-10', NULL),
(8, 5, 2, 1, '2026-01-10', NULL),
(9, 6, 9, 1, '2026-01-10', NULL),
(10, 7, 10, 1, '2026-01-10', NULL);

INSERT INTO historico_jugador (id_historico, id_jugador, id_temporada, partidos, goles, asistencias, tarjetas) VALUES
(1, 8, 1, 24, 12, 3, 4),
(2, 5, 1, 23, 13, 5, 2),
(3, 7, 1, 22, 9, 6, 3),
(4, 2, 1, 21, 8, 4, 5),
(5, 10, 1, 20, 7, 2, 2),
(6, 4, 1, 19, 3, 8, 1),
(7, 6, 1, 18, 1, 1, 6),
(8, 9, 1, 17, 2, 2, 3),
(9, 1, 1, 25, 0, 0, 1),
(10, 3, 1, 16, 0, 0, 2);

INSERT INTO estado_partido (id_estado_partido, nombre, descripcion) VALUES
(1, 'Programado', 'Aun no inicia'),
(2, 'En vivo', 'Se esta jugando'),
(3, 'Finalizado', 'Marcador oficial'),
(4, 'Aplazado', 'Se reprograma'),
(5, 'Suspendido', 'Detenido'),
(6, 'Cancelado', 'No se jugara'),
(7, 'Descanso', 'Entre tiempos'),
(8, 'Prorroga', 'Tiempo extra'),
(9, 'Penales', 'Definicion'),
(10, 'Walkover', 'Victoria administrativa');

INSERT INTO partido (id_partido, id_jornada, id_estadio, id_equipo_local, id_equipo_visitante, id_estado_partido, fecha_hora, goles_local, goles_visitante, minuto_actual) VALUES
(1, 3, 1, 1, 3, 3, '2026-08-29 20:00:00', 1, 2, 90),
(2, 3, 3, 4, 6, 3, '2026-08-30 18:00:00', 2, 2, 90),
(3, 3, 8, 9, 10, 3, '2026-08-30 20:10:00', 1, 0, 90),
(4, 3, 4, 7, 2, 3, '2026-08-31 16:00:00', 0, 1, 90),
(5, 4, 3, 5, 8, 2, '2026-09-02 18:30:00', 1, 0, 67),
(6, 4, 1, 2, 1, 2, '2026-09-02 20:00:00', 0, 0, 34),
(7, 4, 2, 3, 4, 1, '2026-09-06 20:00:00', NULL, NULL, NULL),
(8, 4, 4, 6, 1, 1, '2026-09-07 18:00:00', NULL, NULL, NULL),
(9, 5, 5, 8, 9, 1, '2026-09-13 16:00:00', NULL, NULL, NULL),
(10, 5, 9, 10, 5, 1, '2026-09-14 15:00:00', NULL, NULL, NULL);

INSERT INTO tipo_mercado (id_tipo_mercado, nombre, codigo, admite_empate) VALUES
(1, 'Resultado final 1X2', '1X2', 1),
(2, 'Ambos marcan', 'BTTS', 0),
(3, 'Doble oportunidad', 'DC', 1),
(4, 'Total goles', 'OU', 0),
(5, 'Resultado exacto', 'CS', 0),
(6, 'Primer tiempo', 'HT', 1),
(7, 'Handicap', 'AH', 0),
(8, 'Corners', 'CRN', 0),
(9, 'Tarjetas', 'CRD', 0),
(10, 'Goleador', 'SCOR', 0);

INSERT INTO mercado (id_mercado, id_partido, id_tipo_mercado, nombre, activo, cierra_en) VALUES
(1, 1, 1, 'Nacional vs Junior 1X2', 0, '2026-08-29 20:00:00'),
(2, 5, 1, 'Santa Fe vs Bucaramanga 1X2', 1, '2026-09-02 18:30:00'),
(3, 6, 1, 'Medellin vs Nacional 1X2', 1, '2026-09-02 20:00:00'),
(4, 7, 1, 'Junior vs Millonarios 1X2', 1, '2026-09-06 20:00:00'),
(5, 8, 1, 'America vs Nacional 1X2', 1, '2026-09-07 18:00:00'),
(6, 7, 2, 'Junior vs Millonarios BTTS', 1, '2026-09-06 20:00:00'),
(7, 9, 4, 'Bucaramanga vs Tolima O/U', 1, '2026-09-13 16:00:00'),
(8, 10, 3, 'Pereira vs Santa Fe DC', 1, '2026-09-14 15:00:00'),
(9, 2, 1, 'Millonarios vs America 1X2', 0, '2026-08-30 18:00:00'),
(10, 3, 1, 'Tolima vs Pereira 1X2', 0, '2026-08-30 20:10:00');

INSERT INTO seleccion (id_seleccion, id_mercado, etiqueta, cuota, ganadora) VALUES
(1, 1, '1', 1.85, 0),
(2, 1, 'X', 3.40, 0),
(3, 1, '2', 4.10, 1),
(4, 2, '1', 2.10, NULL),
(5, 2, 'X', 3.20, NULL),
(6, 2, '2', 3.50, NULL),
(7, 4, '1', 2.25, NULL),
(8, 4, 'X', 3.15, NULL),
(9, 4, '2', 3.20, NULL),
(10, 6, 'Si', 1.90, NULL);

INSERT INTO tipo_apuesta (id_tipo_apuesta, nombre, descripcion) VALUES
(1, 'Simple', 'Una seleccion'),
(2, 'Combinada', 'Varias selecciones'),
(3, 'Sistema', 'Sistema N/K'),
(4, 'Live', 'En vivo'),
(5, 'Freebet', 'Bono'),
(6, 'Cashout', 'Cierre anticipado'),
(7, 'Buildabet', 'Constructor'),
(8, 'Accumulador', 'Muchas piernas'),
(9, 'Trixie', 'Sistema 3'),
(10, 'Yankee', 'Sistema 4');

INSERT INTO estado_apuesta (id_estado_apuesta, nombre, descripcion) VALUES
(1, 'Pendiente', 'Sin resolver'),
(2, 'Ganada', 'Acierto'),
(3, 'Perdida', 'Fallo'),
(4, 'Anulada', 'Cancelada'),
(5, 'Cashout', 'Cerrada anticipada'),
(6, 'Parcial', 'Parcialmente resuelta'),
(7, 'En disputa', 'Reclamacion'),
(8, 'Reembolsada', 'Stake devuelto'),
(9, 'Confirmando', 'Validacion'),
(10, 'Caducada', 'No procesada');

INSERT INTO apuesta (id_apuesta, id_usuario, id_cuenta, id_tipo_apuesta, id_estado_apuesta, monto, cuota_total, ganancia_potencial, fecha_hora) VALUES
(1, 3, 1, 1, 2, 50000.00, 4.10, 205000.00, '2026-08-29 18:10:00'),
(2, 5, 3, 1, 1, 40000.00, 2.10, 84000.00, '2026-09-02 17:40:00'),
(3, 4, 2, 2, 1, 25000.00, 4.28, 107000.00, '2026-09-02 12:15:00'),
(4, 6, 4, 1, 1, 15000.00, 2.25, 33750.00, '2026-09-05 10:00:00'),
(5, 8, 6, 1, 1, 20000.00, 1.90, 38000.00, '2026-09-05 11:00:00'),
(6, 10, 7, 2, 1, 30000.00, 3.50, 105000.00, '2026-09-05 12:00:00'),
(7, 3, 1, 1, 3, 10000.00, 3.40, 34000.00, '2026-08-29 17:00:00'),
(8, 5, 3, 1, 1, 12000.00, 3.20, 38400.00, '2026-09-05 13:00:00'),
(9, 4, 2, 1, 1, 8000.00, 2.10, 16800.00, '2026-09-05 14:00:00'),
(10, 8, 6, 2, 1, 18000.00, 4.05, 72900.00, '2026-09-05 15:00:00');

INSERT INTO detalle_apuesta (id_detalle, id_apuesta, id_seleccion, cuota_momento) VALUES
(1, 1, 3, 4.10),
(2, 2, 4, 2.10),
(3, 3, 7, 2.25),
(4, 3, 10, 1.90),
(5, 4, 7, 2.25),
(6, 5, 10, 1.90),
(7, 6, 8, 3.15),
(8, 7, 2, 3.40),
(9, 8, 5, 3.20),
(10, 9, 4, 2.10);

INSERT INTO tipo_movimiento (id_tipo_movimiento, nombre, signo, descripcion) VALUES
(1, 'Deposito', '+', 'Ingreso'),
(2, 'Retiro', '-', 'Salida'),
(3, 'Apuesta', '-', 'Descuento cupon'),
(4, 'Premio', '+', 'Pago ganada'),
(5, 'Bono', '+', 'Promocion'),
(6, 'Ajuste+', '+', 'Ajuste a favor'),
(7, 'Ajuste-', '-', 'Ajuste en contra'),
(8, 'Comision', '-', 'Comision retiro'),
(9, 'Cashback', '+', 'Devolucion'),
(10, 'Cashout', '+', 'Pago cashout');

INSERT INTO movimiento_cuenta (id_movimiento, id_cuenta, id_tipo_movimiento, monto, saldo_resultante, fecha_hora, referencia) VALUES
(1, 1, 1, 400000.00, 400000.00, '2026-02-03 14:30:00', 'DEP-0001'),
(2, 1, 3, 50000.00, 350000.00, '2026-08-29 18:10:00', 'APT-0001'),
(3, 1, 4, 205000.00, 555000.00, '2026-08-29 22:05:00', 'PRE-0001'),
(4, 3, 1, 560000.00, 560000.00, '2026-03-05 17:00:00', 'DEP-0002'),
(5, 3, 3, 40000.00, 520000.00, '2026-09-02 17:40:00', 'APT-0002'),
(6, 2, 1, 205000.00, 205000.00, '2026-02-18 10:20:00', 'DEP-0003'),
(7, 2, 3, 25000.00, 180000.00, '2026-09-02 12:15:00', 'APT-0003'),
(8, 6, 1, 210000.00, 210000.00, '2026-06-01 09:15:00', 'DEP-0004'),
(9, 7, 1, 275000.00, 275000.00, '2026-06-10 09:15:00', 'DEP-0005'),
(10, 4, 1, 90000.00, 90000.00, '2026-04-11 11:40:00', 'DEP-0006');

INSERT INTO metodo_pago (id_metodo_pago, nombre, descripcion, activo) VALUES
(1, 'PSE', 'Debito bancario', 1),
(2, 'Transferencia', 'Transferencia bancaria', 1),
(3, 'Nequi', 'Billetera Nequi', 1),
(4, 'Daviplata', 'Billetera Daviplata', 1),
(5, 'Tarjeta debito', 'Visa/MC debito', 1),
(6, 'Tarjeta credito', 'Visa/MC credito', 1),
(7, 'Efectivo', 'Sucursal', 1),
(8, 'Bancolombia', 'App Bancolombia', 1),
(9, 'BBVA', 'App BBVA', 1),
(10, 'Dale', 'Billetera Dale', 0);

INSERT INTO pasarela_pago (id_pasarela, nombre, proveedor, activa) VALUES
(1, 'PSE', 'ACH Colombia', 1),
(2, 'PayU', 'PayU Latam', 1),
(3, 'Wompi', 'Bancolombia', 1),
(4, 'PlaceToPay', 'Evertec', 1),
(5, 'MercadoPago', 'Mercado Libre', 1),
(6, 'Bold', 'Bold SAS', 1),
(7, 'ePayco', 'ePayco', 1),
(8, 'OpenPay', 'BBVA', 1),
(9, 'Stripe', 'Stripe', 0),
(10, 'PayPal', 'PayPal', 0);

INSERT INTO transaccion_pago (id_transaccion, id_cuenta, id_metodo_pago, id_pasarela, monto, estado, referencia_externa, fecha_hora) VALUES
(1, 1, 1, 1, 400000.00, 'Aprobada', 'PSE-10001', '2026-02-03 14:30:00'),
(2, 3, 1, 1, 560000.00, 'Aprobada', 'PSE-10002', '2026-03-05 17:00:00'),
(3, 2, 1, 1, 205000.00, 'Aprobada', 'PSE-10003', '2026-02-18 10:20:00'),
(4, 4, 1, 1, 90000.00, 'Aprobada', 'PSE-10004', '2026-04-11 11:40:00'),
(5, 6, 3, 3, 210000.00, 'Aprobada', 'NEQ-10005', '2026-06-01 09:15:00'),
(6, 7, 4, 2, 275000.00, 'Aprobada', 'DAV-10006', '2026-06-10 09:15:00'),
(7, 8, 2, 4, 10000.00, 'Aprobada', 'TRF-10007', '2026-01-10 08:15:00'),
(8, 9, 5, 5, 50000.00, 'Aprobada', 'TJD-10008', '2026-01-12 09:15:00'),
(9, 10, 7, 1, 25000.00, 'Pendiente', 'EFE-10009', '2026-06-08 09:15:00'),
(10, 5, 3, 3, 40000.00, 'Rechazada', 'NEQ-10010', '2026-05-02 13:15:00');

INSERT INTO log_pago (id_log_pago, id_transaccion, fecha_hora, evento, payload, codigo_respuesta) VALUES
(1, 1, '2026-02-03 14:30:01', 'CREADA', 'Inicio PSE cuenta 1', '200'),
(2, 1, '2026-02-03 14:30:08', 'APROBADA', 'Banco confirmo', '200'),
(3, 2, '2026-03-05 17:00:02', 'CREADA', 'Inicio PSE cuenta 3', '200'),
(4, 2, '2026-03-05 17:00:09', 'APROBADA', 'Banco confirmo', '200'),
(5, 3, '2026-02-18 10:20:03', 'CREADA', 'Inicio PSE cuenta 2', '200'),
(6, 5, '2026-06-01 09:15:02', 'CREADA', 'Inicio Nequi cuenta 6', '200'),
(7, 5, '2026-06-01 09:15:09', 'APROBADA', 'Nequi OK', '200'),
(8, 9, '2026-06-08 09:15:02', 'CREADA', 'Inicio efectivo', '200'),
(9, 9, '2026-06-08 09:16:00', 'PENDIENTE', 'Espera caja', '102'),
(10, 10, '2026-05-02 13:15:03', 'RECHAZADA', 'Fondos insuficientes', '402');
