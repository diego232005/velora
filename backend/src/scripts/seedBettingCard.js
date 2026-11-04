/**
 * Completa mercados 1X2 y añade partidos apostables (demo académica).
 * Uso: node src/scripts/seedBettingCard.js
 */
import 'dotenv/config';
import { mysqlPool } from '../db/mysql.js';
import { ensurePostgresSchema } from '../db/postgres.js';
import { syncSportsFromMysqlToPostgres } from '../services/syncSports.js';

function odd(n) {
  return Number(n.toFixed(2));
}

async function nextIds() {
  const [[p]] = await mysqlPool.execute(
    'SELECT COALESCE(MAX(id_partido),0) AS n FROM partido',
  );
  const [[m]] = await mysqlPool.execute(
    'SELECT COALESCE(MAX(id_mercado),0) AS n FROM mercado',
  );
  const [[s]] = await mysqlPool.execute(
    'SELECT COALESCE(MAX(id_seleccion),0) AS n FROM seleccion',
  );
  return {
    partido: Number(p.n) + 1,
    mercado: Number(m.n) + 1,
    seleccion: Number(s.n) + 1,
  };
}

async function ensure1x2(matchId, marketId, labels, startSeleccionId) {
  const [existing] = await mysqlPool.execute(
    `SELECT s.id_seleccion FROM seleccion s
     INNER JOIN mercado m ON m.id_mercado = s.id_mercado
     INNER JOIN tipo_mercado t ON t.id_tipo_mercado = m.id_tipo_mercado
     WHERE m.id_partido = ? AND t.codigo = '1X2'`,
    [matchId],
  );
  if (existing.length >= 3) {
    await mysqlPool.execute(`UPDATE mercado SET activo = 1 WHERE id_mercado = ?`, [
      marketId,
    ]);
    return { created: 0, marketId };
  }

  const [markets] = await mysqlPool.execute(
    `SELECT id_mercado FROM mercado WHERE id_partido = ? AND id_tipo_mercado = 1 LIMIT 1`,
    [matchId],
  );
  let mid = markets[0]?.id_mercado || marketId;
  if (!markets[0]) {
    const [teams] = await mysqlPool.execute(
      `SELECT loc.sigla AS h, vis.sigla AS a
       FROM partido p
       INNER JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
       INNER JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
       WHERE p.id_partido = ?`,
      [matchId],
    );
    const name = `${teams[0]?.h || 'LOC'} vs ${teams[0]?.a || 'VIS'} 1X2`;
    await mysqlPool.execute(
      `INSERT INTO mercado (id_mercado, id_partido, id_tipo_mercado, nombre, activo, cierra_en)
       VALUES (?, ?, 1, ?, 1, DATE_ADD(NOW(), INTERVAL 14 DAY))
       ON DUPLICATE KEY UPDATE activo = 1, nombre = VALUES(nombre)`,
      [mid, matchId, name],
    );
  } else {
    await mysqlPool.execute(`UPDATE mercado SET activo = 1 WHERE id_mercado = ?`, [mid]);
  }

  let sid = startSeleccionId;
  let created = 0;
  for (const item of labels) {
    await mysqlPool.execute(
      `INSERT INTO seleccion (id_seleccion, id_mercado, etiqueta, cuota, ganadora)
       VALUES (?, ?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE cuota = VALUES(cuota), etiqueta = VALUES(etiqueta)`,
      [sid, mid, item.label, item.cuota],
    );
    sid += 1;
    created += 1;
  }
  return { created, marketId: mid, nextSeleccion: sid };
}

async function insertMatch(id, { jornada, estadio, local, visitante, estado, fecha, golesL, golesV, minuto }) {
  await mysqlPool.execute(
    `INSERT INTO partido (
       id_partido, id_jornada, id_estadio, id_equipo_local, id_equipo_visitante,
       id_estado_partido, fecha_hora, goles_local, goles_visitante, minuto_actual
     ) VALUES (?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       id_estado_partido = VALUES(id_estado_partido),
       fecha_hora = VALUES(fecha_hora),
       goles_local = VALUES(goles_local),
       goles_visitante = VALUES(goles_visitante),
       minuto_actual = VALUES(minuto_actual)`,
    [id, jornada, estadio, local, visitante, estado, fecha, golesL, golesV, minuto],
  );
}

async function main() {
  const ids = await nextIds();
  let mercadoId = ids.mercado;
  let seleccionId = ids.seleccion;

  // Completar 1X2 faltantes en partidos ya existentes (live/upcoming).
  const fill = [
    { matchId: 6, odds: [odd(2.4), odd(3.1), odd(2.9)] }, // Medellín vs Nacional (live, sin cuotas)
    { matchId: 8, odds: [odd(2.55), odd(3.2), odd(2.75)] }, // América vs Nacional
    { matchId: 9, odds: [odd(2.35), odd(3.05), odd(3.1)] }, // Bucaramanga vs Tolima
    { matchId: 10, odds: [odd(2.7), odd(3.15), odd(2.6)] }, // Pereira vs Santa Fe
  ];

  for (const row of fill) {
    const labels = [
      { label: '1', cuota: row.odds[0] },
      { label: 'X', cuota: row.odds[1] },
      { label: '2', cuota: row.odds[2] },
    ];
    const result = await ensure1x2(row.matchId, mercadoId, labels, seleccionId);
    mercadoId = Math.max(mercadoId, result.marketId) + 1;
    seleccionId = result.nextSeleccion || seleccionId + 3;
  }

  // Nuevos partidos programados con 1X2 completo.
  const extras = [
    {
      local: 7,
      visitante: 3,
      estadio: 4,
      jornada: 6,
      fecha: '2026-09-20 19:00:00',
      odds: [2.2, 3.25, 3.3],
    },
    {
      local: 4,
      visitante: 5,
      estadio: 3,
      jornada: 6,
      fecha: '2026-09-21 17:30:00',
      odds: [2.05, 3.3, 3.55],
    },
    {
      local: 1,
      visitante: 6,
      estadio: 1,
      jornada: 6,
      fecha: '2026-09-21 20:00:00',
      odds: [1.95, 3.4, 3.8],
    },
    {
      local: 2,
      visitante: 9,
      estadio: 1,
      jornada: 7,
      fecha: '2026-09-27 16:00:00',
      odds: [2.15, 3.2, 3.35],
    },
    {
      local: 8,
      visitante: 10,
      estadio: 5,
      jornada: 7,
      fecha: '2026-09-28 18:00:00',
      odds: [2.45, 3.1, 2.85],
    },
    {
      local: 5,
      visitante: 7,
      estadio: 10,
      jornada: 7,
      fecha: '2026-09-28 20:15:00',
      odds: [2.3, 3.15, 3.05],
    },
  ];

  let partidoId = ids.partido;
  for (const match of extras) {
    await insertMatch(partidoId, {
      jornada: match.jornada,
      estadio: match.estadio,
      local: match.local,
      visitante: match.visitante,
      estado: 1,
      fecha: match.fecha,
      golesL: null,
      golesV: null,
      minuto: null,
    });

    const labels = [
      { label: '1', cuota: odd(match.odds[0]) },
      { label: 'X', cuota: odd(match.odds[1]) },
      { label: '2', cuota: odd(match.odds[2]) },
    ];
    const result = await ensure1x2(partidoId, mercadoId, labels, seleccionId);
    mercadoId = Math.max(mercadoId, result.marketId) + 1;
    seleccionId = result.nextSeleccion || seleccionId + 3;
    partidoId += 1;
  }

  // Reactivar mercado Medellín (id 3) si quedó vacío antes.
  await mysqlPool.execute(`UPDATE mercado SET activo = 1 WHERE id_partido IN (5,6,7,8,9,10)`);

  await ensurePostgresSchema();
  const sync = await syncSportsFromMysqlToPostgres();
  console.log('Seed betting card OK.', { sync, nextPartido: partidoId, nextMercado: mercadoId, nextSeleccion: seleccionId });
  await mysqlPool.end();
  process.exit(0);
}

main().catch(async (error) => {
  console.error(error);
  try {
    await mysqlPool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
