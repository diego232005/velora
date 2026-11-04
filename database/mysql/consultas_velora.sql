-- ============================================================
-- Velora BetPlay - Script de consultas (Bases de datos II)
-- Requisitos:
--   80 SELECT  (cada uno con tecnica distinta; no se repite)
--   20 INSERT
--   20 UPDATE
--   20 DELETE  (tablas principales)
--   20 JOIN
--    5 procedimientos almacenados
--    5 vistas
--   10 funciones
-- Ejecutar despues de llenar_tablas.sql (datos IDs 1..10)
-- DML de practica usa IDs 11+ (no pisa el llenado)
-- Procedimientos/funciones: mejor mysql CLI o Set delimiter $$
-- ============================================================

USE velora_betplay;

-- ############################################################
-- 1. SELECT (80) - una tecnica unica por consulta
-- ############################################################

-- S01 tecnica: SELECT *
SELECT * FROM pais;

-- S02 tecnica: proyeccion de columnas
SELECT nombre, codigo_iso FROM pais;

-- S03 tecnica: alias de columna (AS)
SELECT nombre AS nombre_pais, codigo_iso AS iso FROM pais;

-- S04 tecnica: DISTINCT
SELECT DISTINCT moneda FROM cuenta;

-- S05 tecnica: expresion aritmetica
SELECT id_cuenta, saldo, saldo * 1.19 AS saldo_con_iva FROM cuenta;

-- S06 tecnica: CONCAT
SELECT CONCAT(nombres, ' ', apellidos) AS nombre_completo FROM perfil_cliente;

-- S07 tecnica: UPPER
SELECT UPPER(nombre) AS equipo_mayus FROM equipo;

-- S08 tecnica: LOWER
SELECT LOWER(correo) AS correo_minus FROM usuario;

-- S09 tecnica: LENGTH
SELECT nombre, LENGTH(nombre) AS largo FROM ciudad;

-- S10 tecnica: SUBSTRING
SELECT SUBSTRING(numero_documento, 1, 4) AS prefijo_doc FROM perfil_cliente;

-- S11 tecnica: TRIM
SELECT TRIM(direccion) AS direccion_limpia FROM sucursal;

-- S12 tecnica: REPLACE
SELECT REPLACE(correo, '@correo.com', '@velora.test') AS correo_demo FROM usuario;

-- S13 tecnica: LEFT
SELECT LEFT(nombre, 3) AS abrev FROM equipo;

-- S14 tecnica: RIGHT
SELECT RIGHT(token, 4) AS fin_token FROM sesion;

-- S15 tecnica: ROUND
SELECT id_seleccion, ROUND(cuota, 1) AS cuota_1dec FROM seleccion;

-- S16 tecnica: CEIL
SELECT id_cuenta, CEIL(saldo) AS saldo_ceil FROM cuenta;

-- S17 tecnica: FLOOR
SELECT id_apuesta, FLOOR(ganancia_potencial) AS ganancia_piso FROM apuesta;

-- S18 tecnica: ABS
SELECT id_partido, ABS(COALESCE(goles_local, 0) - COALESCE(goles_visitante, 0)) AS diff_goles FROM partido;

-- S19 tecnica: MOD
SELECT id_jugador, dorsal, MOD(dorsal, 2) AS dorsal_paridad FROM jugador;

-- S20 tecnica: COALESCE
SELECT id_partido, COALESCE(minuto_actual, 0) AS minuto FROM partido;

-- S21 tecnica: IFNULL
SELECT id_seleccion, IFNULL(ganadora, -1) AS flag_ganadora FROM seleccion;

-- S22 tecnica: NULLIF
SELECT id_cuenta, NULLIF(saldo, 0) AS saldo_sin_cero FROM cuenta;

-- S23 tecnica: CASE WHEN
SELECT nombre,
       CASE activo_primera WHEN 1 THEN 'Activo' ELSE 'Inactivo' END AS estado
FROM equipo;

-- S24 tecnica: IF()
SELECT nombre, IF(activa = 1, 'Si', 'No') AS esta_activa FROM sucursal;

-- S25 tecnica: CAST
SELECT id_apuesta, CAST(monto AS CHAR) AS monto_texto FROM apuesta;

-- S26 tecnica: CONVERT
SELECT id_transaccion, CONVERT(monto, CHAR) AS monto_txt FROM transaccion_pago;

-- S27 tecnica: DATE_FORMAT
SELECT id_partido, DATE_FORMAT(fecha_hora, '%d/%m/%Y %H:%i') AS fecha_fmt FROM partido;

-- S28 tecnica: YEAR
SELECT id_jugador, YEAR(fecha_nacimiento) AS anio_nac FROM jugador;

-- S29 tecnica: MONTH
SELECT id_perfil, MONTH(fecha_nacimiento) AS mes_nac FROM perfil_cliente;

-- S30 tecnica: DAY
SELECT id_temporada, DAY(fecha_inicio) AS dia_inicio FROM temporada;

-- S31 tecnica: HOUR
SELECT id_sesion, HOUR(fecha_inicio) AS hora_inicio FROM sesion;

-- S32 tecnica: DATEDIFF
SELECT id_torneo, DATEDIFF(fecha_fin, fecha_inicio) AS dias_torneo FROM torneo;

-- S33 tecnica: TIMESTAMPDIFF
SELECT id_usuario, TIMESTAMPDIFF(YEAR, '2020-01-01', fecha_registro) AS anios_desde_2020 FROM usuario;

-- S34 tecnica: CURDATE en proyeccion
SELECT id_jornada, numero, CURDATE() AS hoy FROM jornada;

-- S35 tecnica: NOW en proyeccion
SELECT id_log_acceso, NOW() AS consultado_en FROM log_acceso;

-- S36 tecnica: ORDER BY ASC
SELECT nombre FROM equipo ORDER BY nombre ASC;

-- S37 tecnica: ORDER BY DESC
SELECT capacidad, nombre FROM estadio ORDER BY capacidad DESC;

-- S38 tecnica: ORDER BY multiples columnas
SELECT apellidos, nombres FROM jugador ORDER BY apellidos ASC, nombres ASC;

-- S39 tecnica: LIMIT
SELECT nombre FROM ciudad LIMIT 5;

-- S40 tecnica: LIMIT con OFFSET
SELECT nombre FROM equipo ORDER BY nombre LIMIT 5 OFFSET 5;

-- S41 tecnica: GROUP BY
SELECT id_posicion, COUNT(*) AS total FROM jugador GROUP BY id_posicion;

-- S42 tecnica: HAVING
SELECT id_cuenta, SUM(monto) AS total_mov
FROM movimiento_cuenta
GROUP BY id_cuenta
HAVING SUM(monto) > 100000;

-- S43 tecnica: COUNT(*)
SELECT COUNT(*) AS total_usuarios FROM usuario;

-- S44 tecnica: COUNT(columna)
SELECT COUNT(fecha_fin) AS sesiones_cerradas FROM sesion;

-- S45 tecnica: SUM
SELECT SUM(saldo) AS saldo_total FROM cuenta;

-- S46 tecnica: AVG
SELECT AVG(cuota) AS cuota_promedio FROM seleccion;

-- S47 tecnica: MIN
SELECT MIN(capacidad) AS capacidad_min FROM estadio;

-- S48 tecnica: MAX
SELECT MAX(monto) AS apuesta_max FROM apuesta;

-- S49 tecnica: GROUP_CONCAT
SELECT id_equipo, GROUP_CONCAT(id_jugador ORDER BY id_jugador) AS jugadores
FROM plantilla
GROUP BY id_equipo;

-- S50 tecnica: UNION
SELECT nombre AS catalogo FROM rol
UNION
SELECT nombre FROM estado_usuario;

-- S51 tecnica: UNION ALL
SELECT nombre FROM metodo_pago
UNION ALL
SELECT nombre FROM pasarela_pago;

-- S52 tecnica: subquery escalar en SELECT
SELECT e.nombre,
       (SELECT COUNT(*) FROM plantilla p WHERE p.id_equipo = e.id_equipo) AS n_plantilla
FROM equipo e;

-- S53 tecnica: subquery en FROM (tabla derivada)
SELECT d.ciudad, d.total
FROM (
  SELECT id_ciudad AS ciudad, COUNT(*) AS total
  FROM perfil_cliente
  GROUP BY id_ciudad
) AS d;

-- S54 tecnica: EXISTS
SELECT u.correo
FROM usuario u
WHERE EXISTS (
  SELECT 1 FROM cuenta c WHERE c.id_usuario = u.id_usuario
);

-- S55 tecnica: NOT EXISTS
SELECT e.nombre
FROM equipo e
WHERE NOT EXISTS (
  SELECT 1 FROM partido p
  WHERE p.id_equipo_local = e.id_equipo OR p.id_equipo_visitante = e.id_equipo
);

-- S56 tecnica: IN con subquery
SELECT nombres, apellidos
FROM jugador
WHERE id_jugador IN (SELECT id_jugador FROM historico_jugador);

-- S57 tecnica: NOT IN con subquery
SELECT nombre
FROM equipo
WHERE id_equipo NOT IN (
  SELECT id_equipo_local FROM partido WHERE id_equipo_local IS NOT NULL
);

-- S58 tecnica: ANY
SELECT etiqueta, cuota
FROM seleccion
WHERE cuota > ANY (SELECT AVG(cuota) FROM seleccion);

-- S59 tecnica: ALL
SELECT etiqueta, cuota
FROM seleccion
WHERE cuota >= ALL (SELECT cuota FROM seleccion WHERE id_mercado = 1);

-- S60 tecnica: WHERE igualdad (=)
SELECT * FROM rol WHERE id_rol = 3;

-- S61 tecnica: WHERE desigualdad (<>)
SELECT nombre FROM estado_partido WHERE id_estado_partido <> 1;

-- S62 tecnica: WHERE mayor que (>)
SELECT id_cuenta, saldo FROM cuenta WHERE saldo > 200000;

-- S63 tecnica: WHERE menor que (<)
SELECT id_apuesta, monto FROM apuesta WHERE monto < 30000;

-- S64 tecnica: WHERE mayor o igual (>=)
SELECT nombre, capacidad FROM estadio WHERE capacidad >= 30000;

-- S65 tecnica: WHERE menor o igual (<=)
SELECT dorsal, nombres FROM jugador WHERE dorsal <= 5;

-- S66 tecnica: WHERE BETWEEN
SELECT id_partido, fecha_hora FROM partido
WHERE fecha_hora BETWEEN '2026-08-29' AND '2026-09-03';

-- S67 tecnica: WHERE NOT BETWEEN
SELECT id_seleccion, cuota FROM seleccion
WHERE cuota NOT BETWEEN 2.00 AND 3.50;

-- S68 tecnica: WHERE LIKE comodín %
SELECT correo FROM usuario WHERE correo LIKE '%@velora.example';

-- S69 tecnica: WHERE LIKE comodín _
SELECT nombre FROM equipo WHERE nombre LIKE 'J_____';

-- S70 tecnica: WHERE IN lista literal
SELECT nombre FROM ciudad WHERE id_ciudad IN (1, 4, 7);

-- S71 tecnica: WHERE NOT IN lista literal
SELECT nombre FROM tipo_documento WHERE id_tipo_documento NOT IN (3, 4);

-- S72 tecnica: WHERE IS NULL
SELECT id_partido, fecha_hora FROM partido WHERE goles_local IS NULL;

-- S73 tecnica: WHERE IS NOT NULL
SELECT id_sesion, id_usuario FROM sesion WHERE fecha_fin IS NOT NULL;

-- S74 tecnica: WHERE con AND
SELECT id_usuario, correo FROM usuario
WHERE id_rol = 3 AND id_estado_usuario = 1;

-- S75 tecnica: WHERE con OR
SELECT nombre FROM equipo
WHERE id_ciudad = 1 OR id_ciudad = 4;

-- S76 tecnica: WHERE con NOT
SELECT nombre FROM sucursal WHERE NOT activa = 0;

-- S77 tecnica: WHERE REGEXP
SELECT nombre FROM equipo WHERE nombre REGEXP '^(Atletico|Independiente)';

-- S78 tecnica: WITH ROLLUP
SELECT id_tipo_movimiento, SUM(monto) AS total
FROM movimiento_cuenta
GROUP BY id_tipo_movimiento WITH ROLLUP;

-- S79 tecnica: funcion ventana ROW_NUMBER
SELECT nombre, capacidad,
       ROW_NUMBER() OVER (ORDER BY capacidad DESC) AS puesto
FROM estadio;

-- S80 tecnica: CTE (WITH)
WITH top_cuotas AS (
  SELECT id_seleccion, etiqueta, cuota
  FROM seleccion
  ORDER BY cuota DESC
  LIMIT 3
)
SELECT * FROM top_cuotas;

-- ############################################################
-- 2. JOIN (20) - cada tipo/patron distinto
-- ############################################################

-- J01 INNER JOIN
SELECT e.nombre AS equipo, c.nombre AS ciudad
FROM equipo e
INNER JOIN ciudad c ON c.id_ciudad = e.id_ciudad;

-- J02 LEFT JOIN
SELECT u.correo, c.saldo
FROM usuario u
LEFT JOIN cuenta c ON c.id_usuario = u.id_usuario;

-- J03 RIGHT JOIN
SELECT p.nombres, u.correo
FROM usuario u
RIGHT JOIN perfil_cliente p ON p.id_usuario = u.id_usuario;

-- J04 CROSS JOIN
SELECT r.nombre AS rol, eu.nombre AS estado
FROM rol r
CROSS JOIN estado_usuario eu;

-- J05 SELF JOIN
SELECT a.nombre AS equipo_a, b.nombre AS equipo_b
FROM equipo a
INNER JOIN equipo b ON a.id_ciudad = b.id_ciudad AND a.id_equipo < b.id_equipo;

-- J06 JOIN USING
SELECT s.nombre AS sucursal, c.nombre AS ciudad
FROM sucursal s
INNER JOIN ciudad c USING (id_ciudad);

-- J07 JOIN multiples (3 tablas)
SELECT p.fecha_hora, el.nombre AS local, ev.nombre AS visitante
FROM partido p
INNER JOIN equipo el ON el.id_equipo = p.id_equipo_local
INNER JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante;

-- J08 JOIN 4 tablas
SELECT a.id_apuesta, u.correo, ea.nombre AS estado, ta.nombre AS tipo
FROM apuesta a
INNER JOIN usuario u ON u.id_usuario = a.id_usuario
INNER JOIN estado_apuesta ea ON ea.id_estado_apuesta = a.id_estado_apuesta
INNER JOIN tipo_apuesta ta ON ta.id_tipo_apuesta = a.id_tipo_apuesta;

-- J09 JOIN con agregacion
SELECT e.nombre, COUNT(pl.id_plantilla) AS jugadores
FROM equipo e
INNER JOIN plantilla pl ON pl.id_equipo = e.id_equipo
GROUP BY e.id_equipo, e.nombre;

-- J10 JOIN + ORDER BY
SELECT j.nombres, pos.nombre AS posicion
FROM jugador j
INNER JOIN posicion_jugador pos ON pos.id_posicion = j.id_posicion
ORDER BY pos.nombre, j.apellidos;

-- J11 JOIN + filtro en ON
SELECT m.nombre, s.etiqueta, s.cuota
FROM mercado m
INNER JOIN seleccion s ON s.id_mercado = m.id_mercado AND s.cuota >= 3.00;

-- J12 JOIN partido-estadio-ciudad
SELECT p.id_partido, es.nombre AS estadio, ci.nombre AS ciudad
FROM partido p
INNER JOIN estadio es ON es.id_estadio = p.id_estadio
INNER JOIN ciudad ci ON ci.id_ciudad = es.id_ciudad;

-- J13 JOIN apuesta-detalle-seleccion
SELECT a.id_apuesta, s.etiqueta, d.cuota_momento
FROM apuesta a
INNER JOIN detalle_apuesta d ON d.id_apuesta = a.id_apuesta
INNER JOIN seleccion s ON s.id_seleccion = d.id_seleccion;

-- J14 JOIN cuenta-movimiento-tipo
SELECT c.id_cuenta, tm.nombre AS tipo, mc.monto
FROM cuenta c
INNER JOIN movimiento_cuenta mc ON mc.id_cuenta = c.id_cuenta
INNER JOIN tipo_movimiento tm ON tm.id_tipo_movimiento = mc.id_tipo_movimiento;

-- J15 JOIN transaccion-metodo-pasarela
SELECT t.id_transaccion, mp.nombre AS metodo, pp.nombre AS pasarela, t.estado
FROM transaccion_pago t
INNER JOIN metodo_pago mp ON mp.id_metodo_pago = t.id_metodo_pago
INNER JOIN pasarela_pago pp ON pp.id_pasarela = t.id_pasarela;

-- J16 JOIN liga-temporada-torneo
SELECT l.nombre_comercial, te.anio, to_.nombre AS torneo
FROM liga l
INNER JOIN temporada te ON te.id_liga = l.id_liga
INNER JOIN torneo to_ ON to_.id_temporada = te.id_temporada;

-- J17 JOIN jornada-fase-torneo
SELECT j.numero, f.nombre AS fase, t.codigo
FROM jornada j
INNER JOIN fase_torneo f ON f.id_fase = j.id_fase
INNER JOIN torneo t ON t.id_torneo = j.id_torneo;

-- J18 JOIN jugador-historico-temporada
SELECT j.nombres, h.goles, te.anio
FROM jugador j
INNER JOIN historico_jugador h ON h.id_jugador = j.id_jugador
INNER JOIN temporada te ON te.id_temporada = h.id_temporada;

-- J19 JOIN usuario-perfil-ciudad-departamento
SELECT p.nombres, ci.nombre AS ciudad, d.nombre AS departamento
FROM perfil_cliente p
INNER JOIN ciudad ci ON ci.id_ciudad = p.id_ciudad
INNER JOIN departamento d ON d.id_departamento = ci.id_departamento;

-- J20 JOIN mercado-partido-estado
SELECT m.nombre AS mercado, p.fecha_hora, ep.nombre AS estado_partido
FROM mercado m
INNER JOIN partido p ON p.id_partido = m.id_partido
INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido;

-- ############################################################
-- 3. INSERT (20)
-- IDs 11+ para no chocar con llenar_tablas (1..10)
-- ############################################################

-- I01
INSERT INTO pais (id_pais, nombre, codigo_iso, prefijo_tel)
VALUES (11, 'Panama', 'PA', '+507');

-- I02
INSERT INTO departamento (id_departamento, id_pais, nombre, codigo_dane)
VALUES (11, 1, 'Meta Demo', '50');

-- I03
INSERT INTO ciudad (id_ciudad, id_departamento, nombre, codigo_dane)
VALUES (11, 11, 'Villavicencio Demo', '50001');

-- I04
INSERT INTO rol (id_rol, nombre, descripcion)
VALUES (11, 'Auditor', 'Revision de operaciones');

-- I05
INSERT INTO estado_usuario (id_estado_usuario, nombre, descripcion)
VALUES (11, 'En revision', 'Pendiente de validacion KYC');

-- I06
INSERT INTO usuario (id_usuario, id_empresa, id_rol, id_estado_usuario, correo, hash_contrasena, fecha_registro, ultimo_acceso)
VALUES (11, 1, 3, 1, 'demo.insert@correo.com', 'clave_demo_insert', '2026-09-21 10:00:00', NULL);

-- I07
INSERT INTO perfil_cliente (id_perfil, id_usuario, id_ciudad, id_tipo_documento, nombres, apellidos, telefono, numero_documento, fecha_nacimiento)
VALUES (11, 11, 4, 1, 'Pedro', 'Insertado', '3105550999', '9191919191', '1996-05-05');

-- I08
INSERT INTO cuenta (id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura)
VALUES (11, 11, 150000.00, 'COP', 0, '2026-09-21 10:05:00');

-- I09
INSERT INTO sesion (id_sesion, id_usuario, token, ip, fecha_inicio, fecha_fin, activa)
VALUES (11, 11, 'ses_insert_011', '10.0.0.11', '2026-09-21 10:10:00', NULL, 1);

-- I10
INSERT INTO log_acceso (id_log_acceso, id_usuario, fecha, ip, dispositivo, exito, motivo_fallo)
VALUES (11, 11, '2026-09-21 10:10:00', '10.0.0.11', 'Firefox Windows', 1, NULL);

-- I11
INSERT INTO jugador (id_jugador, id_posicion, id_pais, nombres, apellidos, fecha_nacimiento, dorsal)
VALUES (11, 4, 1, 'Carlos', 'Prueba Gol', '2000-01-01', 99);

-- I12
INSERT INTO plantilla (id_plantilla, id_equipo, id_jugador, id_temporada, fecha_alta, fecha_baja)
VALUES (11, 5, 11, 1, '2026-09-21', NULL);

-- I13
INSERT INTO historico_jugador (id_historico, id_jugador, id_temporada, partidos, goles, asistencias, tarjetas)
VALUES (11, 11, 1, 1, 0, 0, 0);

-- I14
INSERT INTO mercado (id_mercado, id_partido, id_tipo_mercado, nombre, activo, cierra_en)
VALUES (11, 9, 1, 'Bucaramanga vs Tolima DEMO', 1, '2026-09-13 16:00:00');

-- I15
INSERT INTO seleccion (id_seleccion, id_mercado, etiqueta, cuota, ganadora)
VALUES (11, 11, '1', 2.05, NULL);

-- I16
INSERT INTO apuesta (id_apuesta, id_usuario, id_cuenta, id_tipo_apuesta, id_estado_apuesta, monto, cuota_total, ganancia_potencial, fecha_hora)
VALUES (11, 11, 11, 1, 1, 10000.00, 2.05, 20500.00, '2026-09-21 11:00:00');

-- I17
INSERT INTO detalle_apuesta (id_detalle, id_apuesta, id_seleccion, cuota_momento)
VALUES (11, 11, 11, 2.05);

-- I18
INSERT INTO movimiento_cuenta (id_movimiento, id_cuenta, id_tipo_movimiento, monto, saldo_resultante, fecha_hora, referencia)
VALUES (11, 11, 1, 150000.00, 150000.00, '2026-09-21 10:06:00', 'DEP-0011');

-- I19
INSERT INTO transaccion_pago (id_transaccion, id_cuenta, id_metodo_pago, id_pasarela, monto, estado, referencia_externa, fecha_hora)
VALUES (11, 11, 1, 1, 150000.00, 'Aprobada', 'PSE-10011', '2026-09-21 10:06:00');

-- I20 multi-fila
INSERT INTO log_pago (id_log_pago, id_transaccion, fecha_hora, evento, payload, codigo_respuesta) VALUES
(11, 11, '2026-09-21 10:06:01', 'CREADA', 'Inicio demo insert', '200'),
(12, 11, '2026-09-21 10:06:05', 'APROBADA', 'Banco confirmo demo', '200');

-- ############################################################
-- 4. UPDATE (20)
-- ############################################################

-- U01
UPDATE pais SET prefijo_tel = '+5070' WHERE id_pais = 11;

-- U02
UPDATE departamento SET nombre = 'Meta Actualizado' WHERE id_departamento = 11;

-- U03
UPDATE ciudad SET codigo_dane = '50002' WHERE id_ciudad = 11;

-- U04
UPDATE rol SET descripcion = 'Auditoria interna Velora' WHERE id_rol = 11;

-- U05
UPDATE usuario SET ultimo_acceso = '2026-09-21 12:00:00' WHERE id_usuario = 11;

-- U06
UPDATE perfil_cliente SET telefono = '3105550888' WHERE id_perfil = 11;

-- U07
UPDATE cuenta SET saldo = 140000.00 WHERE id_cuenta = 11;

-- U08
UPDATE sesion SET activa = 0, fecha_fin = '2026-09-21 12:30:00' WHERE id_sesion = 11;

-- U09
UPDATE jugador SET dorsal = 98 WHERE id_jugador = 11;

-- U10
UPDATE plantilla SET fecha_baja = '2026-12-31' WHERE id_plantilla = 11;

-- U11
UPDATE historico_jugador SET goles = 1, partidos = 2 WHERE id_historico = 11;

-- U12
UPDATE mercado SET activo = 0 WHERE id_mercado = 11;

-- U13
UPDATE seleccion SET cuota = 2.15 WHERE id_seleccion = 11;

-- U14
UPDATE apuesta SET monto = 12000.00, ganancia_potencial = 25800.00 WHERE id_apuesta = 11;

-- U15
UPDATE detalle_apuesta SET cuota_momento = 2.15 WHERE id_detalle = 11;

-- U16
UPDATE movimiento_cuenta SET referencia = 'DEP-0011-UPD' WHERE id_movimiento = 11;

-- U17
UPDATE transaccion_pago SET estado = 'Revisada' WHERE id_transaccion = 11;

-- U18
UPDATE log_pago SET payload = 'Payload actualizado demo' WHERE id_log_pago = 11;

-- U19
UPDATE equipo SET sigla = 'SFE' WHERE id_equipo = 5;

-- U20
UPDATE partido SET minuto_actual = 70 WHERE id_partido = 5;

-- ############################################################
-- 5. DELETE (20) - tablas principales
-- Borra primero hijos FK de los registros practica 11+
-- ############################################################

-- D01 hijo: log_pago
DELETE FROM log_pago WHERE id_log_pago IN (11, 12);

-- D02 hijo: detalle_apuesta
DELETE FROM detalle_apuesta WHERE id_detalle = 11;

-- D03 principal: apuesta
DELETE FROM apuesta WHERE id_apuesta = 11;

-- D04 principal: seleccion
DELETE FROM seleccion WHERE id_seleccion = 11;

-- D05 principal: mercado
DELETE FROM mercado WHERE id_mercado = 11;

-- D06 principal: movimiento_cuenta
DELETE FROM movimiento_cuenta WHERE id_movimiento = 11;

-- D07 principal: transaccion_pago
DELETE FROM transaccion_pago WHERE id_transaccion = 11;

-- D08 principal: historico_jugador
DELETE FROM historico_jugador WHERE id_historico = 11;

-- D09 principal: plantilla
DELETE FROM plantilla WHERE id_plantilla = 11;

-- D10 principal: jugador
DELETE FROM jugador WHERE id_jugador = 11;

-- D11 principal: log_acceso
DELETE FROM log_acceso WHERE id_log_acceso = 11;

-- D12 principal: sesion
DELETE FROM sesion WHERE id_sesion = 11;

-- D13 principal: cuenta
DELETE FROM cuenta WHERE id_cuenta = 11;

-- D14 principal: perfil_cliente
DELETE FROM perfil_cliente WHERE id_perfil = 11;

-- D15 principal: usuario
DELETE FROM usuario WHERE id_usuario = 11;

-- D16 catalogo auxiliar
DELETE FROM estado_usuario WHERE id_estado_usuario = 11;

-- D17 catalogo auxiliar
DELETE FROM rol WHERE id_rol = 11;

-- D18 principal geografica
DELETE FROM ciudad WHERE id_ciudad = 11;

-- D19 principal geografica
DELETE FROM departamento WHERE id_departamento = 11;

-- D20 principal geografica
DELETE FROM pais WHERE id_pais = 11;

-- ############################################################
-- 6. VISTAS (5)
-- ############################################################

CREATE OR REPLACE VIEW v_equipos_ciudad AS
SELECT e.id_equipo, e.nombre AS equipo, e.sigla, c.nombre AS ciudad, es.nombre AS estadio
FROM equipo e
INNER JOIN ciudad c ON c.id_ciudad = e.id_ciudad
INNER JOIN estadio es ON es.id_estadio = e.id_estadio_local;

CREATE OR REPLACE VIEW v_partidos_marcador AS
SELECT p.id_partido, p.fecha_hora,
       el.nombre AS local, ev.nombre AS visitante,
       p.goles_local, p.goles_visitante, ep.nombre AS estado
FROM partido p
INNER JOIN equipo el ON el.id_equipo = p.id_equipo_local
INNER JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido;

CREATE OR REPLACE VIEW v_cuentas_cliente AS
SELECT u.id_usuario, u.correo, p.nombres, p.apellidos, c.id_cuenta, c.saldo, c.moneda, c.bloqueada
FROM usuario u
INNER JOIN perfil_cliente p ON p.id_usuario = u.id_usuario
INNER JOIN cuenta c ON c.id_usuario = u.id_usuario;

CREATE OR REPLACE VIEW v_apuestas_resumen AS
SELECT a.id_apuesta, u.correo, a.monto, a.cuota_total, a.ganancia_potencial,
       ea.nombre AS estado, ta.nombre AS tipo, a.fecha_hora
FROM apuesta a
INNER JOIN usuario u ON u.id_usuario = a.id_usuario
INNER JOIN estado_apuesta ea ON ea.id_estado_apuesta = a.id_estado_apuesta
INNER JOIN tipo_apuesta ta ON ta.id_tipo_apuesta = a.id_tipo_apuesta;

CREATE OR REPLACE VIEW v_goleadores AS
SELECT j.id_jugador, CONCAT(j.nombres, ' ', j.apellidos) AS jugador,
       h.partidos, h.goles, h.asistencias, te.anio
FROM historico_jugador h
INNER JOIN jugador j ON j.id_jugador = h.id_jugador
INNER JOIN temporada te ON te.id_temporada = h.id_temporada;

-- ############################################################
-- 7. FUNCIONES (10)
-- ############################################################

DROP FUNCTION IF EXISTS fn_edad_jugador;
DROP FUNCTION IF EXISTS fn_nombre_completo;
DROP FUNCTION IF EXISTS fn_saldo_cuenta;
DROP FUNCTION IF EXISTS fn_cuota_potencial;
DROP FUNCTION IF EXISTS fn_es_cuenta_bloqueada;
DROP FUNCTION IF EXISTS fn_total_apuestas_usuario;
DROP FUNCTION IF EXISTS fn_goles_partido;
DROP FUNCTION IF EXISTS fn_sigla_equipo;
DROP FUNCTION IF EXISTS fn_estado_partido_nombre;
DROP FUNCTION IF EXISTS fn_promedio_cuota_mercado;

DELIMITER $$

CREATE FUNCTION fn_edad_jugador(p_id_jugador INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_edad INT;
  SELECT TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) INTO v_edad
  FROM jugador WHERE id_jugador = p_id_jugador;
  RETURN v_edad;
END$$

CREATE FUNCTION fn_nombre_completo(p_id_perfil INT)
RETURNS VARCHAR(161)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_nombre VARCHAR(161);
  SELECT CONCAT(nombres, ' ', apellidos) INTO v_nombre
  FROM perfil_cliente WHERE id_perfil = p_id_perfil;
  RETURN v_nombre;
END$$

CREATE FUNCTION fn_saldo_cuenta(p_id_cuenta INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_saldo DECIMAL(12,2);
  SELECT saldo INTO v_saldo FROM cuenta WHERE id_cuenta = p_id_cuenta;
  RETURN v_saldo;
END$$

CREATE FUNCTION fn_cuota_potencial(p_monto DECIMAL(12,2), p_cuota DECIMAL(8,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
NO SQL
BEGIN
  RETURN ROUND(p_monto * p_cuota, 2);
END$$

CREATE FUNCTION fn_es_cuenta_bloqueada(p_id_cuenta INT)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_flag TINYINT;
  SELECT bloqueada INTO v_flag FROM cuenta WHERE id_cuenta = p_id_cuenta;
  RETURN v_flag;
END$$

CREATE FUNCTION fn_total_apuestas_usuario(p_id_usuario INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_total INT;
  SELECT COUNT(*) INTO v_total FROM apuesta WHERE id_usuario = p_id_usuario;
  RETURN v_total;
END$$

CREATE FUNCTION fn_goles_partido(p_id_partido INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_total INT;
  SELECT COALESCE(goles_local, 0) + COALESCE(goles_visitante, 0) INTO v_total
  FROM partido WHERE id_partido = p_id_partido;
  RETURN v_total;
END$$

CREATE FUNCTION fn_sigla_equipo(p_id_equipo INT)
RETURNS VARCHAR(10)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_sigla VARCHAR(10);
  SELECT sigla INTO v_sigla FROM equipo WHERE id_equipo = p_id_equipo;
  RETURN v_sigla;
END$$

CREATE FUNCTION fn_estado_partido_nombre(p_id_partido INT)
RETURNS VARCHAR(40)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_nombre VARCHAR(40);
  SELECT ep.nombre INTO v_nombre
  FROM partido p
  INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido
  WHERE p.id_partido = p_id_partido;
  RETURN v_nombre;
END$$

CREATE FUNCTION fn_promedio_cuota_mercado(p_id_mercado INT)
RETURNS DECIMAL(8,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_avg DECIMAL(8,2);
  SELECT ROUND(AVG(cuota), 2) INTO v_avg
  FROM seleccion WHERE id_mercado = p_id_mercado;
  RETURN v_avg;
END$$

DELIMITER ;

-- ############################################################
-- 8. PROCEDIMIENTOS ALMACENADOS (5)
-- ############################################################

DROP PROCEDURE IF EXISTS sp_listar_equipos;
DROP PROCEDURE IF EXISTS sp_saldo_usuario;
DROP PROCEDURE IF EXISTS sp_registrar_deposito;
DROP PROCEDURE IF EXISTS sp_partidos_por_estado;
DROP PROCEDURE IF EXISTS sp_top_goleadores;

DELIMITER $$

CREATE PROCEDURE sp_listar_equipos()
BEGIN
  SELECT id_equipo, nombre, sigla, activo_primera
  FROM equipo
  ORDER BY nombre;
END$$

CREATE PROCEDURE sp_saldo_usuario(IN p_id_usuario INT)
BEGIN
  SELECT u.correo, c.id_cuenta, c.saldo, c.moneda, c.bloqueada
  FROM usuario u
  INNER JOIN cuenta c ON c.id_usuario = u.id_usuario
  WHERE u.id_usuario = p_id_usuario;
END$$

CREATE PROCEDURE sp_registrar_deposito(
  IN p_id_cuenta INT,
  IN p_monto DECIMAL(12,2),
  IN p_referencia VARCHAR(60)
)
BEGIN
  DECLARE v_saldo DECIMAL(12,2);
  DECLARE v_nuevo_id INT;

  SELECT saldo INTO v_saldo FROM cuenta WHERE id_cuenta = p_id_cuenta FOR UPDATE;
  SET v_saldo = v_saldo + p_monto;
  UPDATE cuenta SET saldo = v_saldo WHERE id_cuenta = p_id_cuenta;

  SELECT COALESCE(MAX(id_movimiento), 0) + 1 INTO v_nuevo_id FROM movimiento_cuenta;

  INSERT INTO movimiento_cuenta (id_movimiento, id_cuenta, id_tipo_movimiento, monto, saldo_resultante, fecha_hora, referencia)
  VALUES (v_nuevo_id, p_id_cuenta, 1, p_monto, v_saldo, NOW(), p_referencia);

  SELECT v_nuevo_id AS id_movimiento, v_saldo AS saldo_actual;
END$$

CREATE PROCEDURE sp_partidos_por_estado(IN p_id_estado INT)
BEGIN
  SELECT p.id_partido, p.fecha_hora,
         el.nombre AS local, ev.nombre AS visitante,
         p.goles_local, p.goles_visitante
  FROM partido p
  INNER JOIN equipo el ON el.id_equipo = p.id_equipo_local
  INNER JOIN equipo ev ON ev.id_equipo = p.id_equipo_visitante
  WHERE p.id_estado_partido = p_id_estado
  ORDER BY p.fecha_hora;
END$$

CREATE PROCEDURE sp_top_goleadores(IN p_limite INT)
BEGIN
  SELECT j.nombres, j.apellidos, h.goles, h.asistencias, h.partidos
  FROM historico_jugador h
  INNER JOIN jugador j ON j.id_jugador = h.id_jugador
  ORDER BY h.goles DESC, h.asistencias DESC
  LIMIT p_limite;
END$$

DELIMITER ;

-- ============================================================
-- Pruebas rapidas (opcionales)
-- ============================================================
-- SELECT fn_edad_jugador(10);
-- SELECT fn_nombre_completo(3);
-- SELECT fn_cuota_potencial(50000, 4.10);
-- CALL sp_listar_equipos();
-- CALL sp_saldo_usuario(3);
-- CALL sp_partidos_por_estado(3);
-- CALL sp_top_goleadores(5);
-- SELECT * FROM v_goleadores;
-- SELECT * FROM v_partidos_marcador;
