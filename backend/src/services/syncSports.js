import { mysqlPool } from '../db/mysql.js';
import { pgPool } from '../db/postgres.js';
import { writeDomainEvent } from '../db/mongo.js';
import { oddToMillis } from '../utils/money.js';

const ESTADO_MAP = {
  1: 'programado',
  2: 'en_vivo',
  3: 'finalizado',
  4: 'aplazado',
};

/**
 * Sincroniza partidos/mercados/cuotas desde MySQL (catálogo) hacia PostgreSQL (motor).
 * No inventa partidos: solo copia lo existente en MySQL.
 */
export async function syncSportsFromMysqlToPostgres() {
  const [partidos] = await mysqlPool.execute(
    `SELECT p.id_partido, p.id_equipo_local, p.id_equipo_visitante,
            p.id_estado_partido, p.fecha_hora, p.goles_local, p.goles_visitante, p.minuto_actual
     FROM partido p`,
  );

  const [mercados] = await mysqlPool.execute(
    `SELECT m.id_mercado, m.id_partido, m.nombre, m.activo, m.cierra_en, t.codigo AS tipo_codigo
     FROM mercado m
     INNER JOIN tipo_mercado t ON t.id_tipo_mercado = m.id_tipo_mercado`,
  );

  const [selecciones] = await mysqlPool.execute(
    `SELECT id_seleccion, id_mercado, etiqueta, cuota, ganadora FROM seleccion`,
  );

  const client = await pgPool.connect();
  let insertedPartidos = 0;
  let insertedMercados = 0;
  let insertedSelecciones = 0;

  try {
    await client.query('BEGIN');

    for (const p of partidos) {
      await client.query(
        `INSERT INTO partido_ops (
           id_partido, id_equipo_local, id_equipo_visitante, estado, fecha_hora,
           goles_local, goles_visitante, minuto_actual, fuente_mysql, actualizado_en
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE,NOW())
         ON CONFLICT (id_partido) DO UPDATE SET
           id_equipo_local = EXCLUDED.id_equipo_local,
           id_equipo_visitante = EXCLUDED.id_equipo_visitante,
           estado = EXCLUDED.estado,
           fecha_hora = EXCLUDED.fecha_hora,
           goles_local = EXCLUDED.goles_local,
           goles_visitante = EXCLUDED.goles_visitante,
           minuto_actual = EXCLUDED.minuto_actual,
           actualizado_en = NOW()`,
        [
          p.id_partido,
          p.id_equipo_local,
          p.id_equipo_visitante,
          ESTADO_MAP[p.id_estado_partido] || 'programado',
          p.fecha_hora,
          p.goles_local,
          p.goles_visitante,
          p.minuto_actual,
        ],
      );
      insertedPartidos += 1;
    }

    for (const m of mercados) {
      await client.query(
        `INSERT INTO mercado_ops (
           id_mercado, id_partido, tipo_codigo, nombre, estado, cierra_en, actualizado_en
         ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (id_mercado) DO UPDATE SET
           estado = EXCLUDED.estado,
           nombre = EXCLUDED.nombre,
           cierra_en = EXCLUDED.cierra_en,
           actualizado_en = NOW()`,
        [
          m.id_mercado,
          m.id_partido,
          m.tipo_codigo,
          m.nombre,
          Number(m.activo) === 1 ? 'abierto' : 'cerrado',
          m.cierra_en,
        ],
      );
      insertedMercados += 1;
    }

    for (const s of selecciones) {
      const cuotaMillis = oddToMillis(s.cuota);
      await client.query(
        `INSERT INTO seleccion_ops (
           id_seleccion, id_mercado, etiqueta, cuota_millis, estado, ganadora, actualizado_en
         ) VALUES ($1,$2,$3,$4,'abierta',$5,NOW())
         ON CONFLICT (id_seleccion) DO UPDATE SET
           etiqueta = EXCLUDED.etiqueta,
           id_mercado = EXCLUDED.id_mercado,
           cuota_millis = EXCLUDED.cuota_millis,
           ganadora = EXCLUDED.ganadora,
           actualizado_en = NOW()`,
        [s.id_seleccion, s.id_mercado, s.etiqueta, cuotaMillis, s.ganadora],
      );
      await client.query(
        `INSERT INTO historial_cuota (id_seleccion, cuota_millis, origen)
         SELECT $1, $2, 'sync.mysql'
         WHERE NOT EXISTS (
           SELECT 1 FROM historial_cuota h
           WHERE h.id_seleccion = $1 AND h.cuota_millis = $2
           ORDER BY h.id DESC LIMIT 1
         )`,
        [s.id_seleccion, cuotaMillis],
      );
      insertedSelecciones += 1;
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await writeDomainEvent({
    type: 'sports.synced',
    aggregate: 'sync',
    aggregateId: 'mysql-to-postgres',
    payload: { insertedPartidos, insertedMercados, insertedSelecciones },
  });

  return { insertedPartidos, insertedMercados, insertedSelecciones };
}
