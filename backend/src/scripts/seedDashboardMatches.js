/**
 * Nutre el dashboard con partidos en vivo + próximos (datos quemados Primera A).
 * Uso: node src/scripts/seedDashboardMatches.js
 */
import 'dotenv/config';
import { mysqlPool } from '../db/mysql.js';
import { syncSportsFromMysqlToPostgres } from '../services/syncSports.js';

const LIVE = 2;
const UPCOMING = 1;
const JORNADA = 4;

/** [local, visit, estado, golesL, golesV, minuto, fechaLocal, odds 1/X/2] */
const MATCHES = [
  // En vivo
  [18, 3, LIVE, 1, 1, 55, '2026-10-30 16:00:00', [2.15, 3.2, 3.4]], // MIL vs AME
  [5, 16, LIVE, 2, 0, 71, '2026-10-30 16:10:00', [1.85, 3.5, 4.2]], // NAC vs JUN
  [13, 20, LIVE, 0, 1, 38, '2026-10-30 15:45:00', [2.4, 3.1, 2.9]], // DIM vs SFE
  [8, 9, LIVE, 0, 0, 22, '2026-10-30 17:00:00', [2.05, 3.25, 3.55]], // TOL vs CAL
  [1, 11, LIVE, 1, 2, 64, '2026-10-30 15:30:00', [2.7, 3.15, 2.55]], // AGU vs PER
  // Próximos
  [4, 6, UPCOMING, null, null, null, '2026-10-31 18:00:00', [2.2, 3.2, 3.3]],
  [12, 17, UPCOMING, null, null, null, '2026-10-31 20:00:00', [1.95, 3.4, 3.8]],
  [2, 7, UPCOMING, null, null, null, '2026-11-01 16:00:00', [2.35, 3.1, 3.0]],
  [15, 10, UPCOMING, null, null, null, '2026-11-01 19:30:00', [2.5, 3.2, 2.75]],
  [19, 14, UPCOMING, null, null, null, '2026-11-02 15:00:00', [1.9, 3.35, 4.0]],
  [3, 18, UPCOMING, null, null, null, '2026-11-02 18:00:00', [2.6, 3.2, 2.65]],
  [16, 5, UPCOMING, null, null, null, '2026-11-03 20:00:00', [3.1, 3.25, 2.25]],
  [20, 13, UPCOMING, null, null, null, '2026-11-04 18:30:00', [2.45, 3.15, 2.85]],
  [9, 8, UPCOMING, null, null, null, '2026-11-05 16:00:00', [2.3, 3.2, 3.05]],
];

const conn = await mysqlPool.getConnection();
try {
  await conn.beginTransaction();

  // Reactivar también 2 clásicos del seed como en vivo (si siguen finalizados)
  await conn.execute(
    `UPDATE partido SET id_estado_partido=?, goles_local=1, goles_visitante=0, minuto_actual=67, fecha_hora=?
     WHERE id_partido=5`,
    [LIVE, '2026-10-30 15:00:00'],
  );
  await conn.execute(
    `UPDATE partido SET id_estado_partido=?, goles_local=0, goles_visitante=0, minuto_actual=34, fecha_hora=?
     WHERE id_partido=6`,
    [LIVE, '2026-10-30 15:15:00'],
  );
  await conn.execute(
    `UPDATE partido SET id_estado_partido=?, goles_local=NULL, goles_visitante=NULL, minuto_actual=NULL, fecha_hora=?
     WHERE id_partido=9`,
    [UPCOMING, '2026-10-31 16:00:00'],
  );
  await conn.execute(
    `UPDATE partido SET id_estado_partido=?, goles_local=NULL, goles_visitante=NULL, minuto_actual=NULL, fecha_hora=?
     WHERE id_partido=10`,
    [UPCOMING, '2026-11-01 15:00:00'],
  );
  // Reabrir mercados 2 y 3 (Santa Fe / Medellín en vivo)
  await conn.execute(`UPDATE mercado SET activo=1, cierra_en=? WHERE id_mercado IN (2,3)`, [
    '2026-10-30 18:00:00',
  ]);
  await conn.execute(`UPDATE mercado SET activo=1 WHERE id_mercado IN (4,5,6)`);

  const [[mx]] = await conn.query(
    `SELECT
       (SELECT COALESCE(MAX(id_partido),0) FROM partido) AS mp,
       (SELECT COALESCE(MAX(id_mercado),0) FROM mercado) AS mm,
       (SELECT COALESCE(MAX(id_seleccion),0) FROM seleccion) AS ms`,
  );
  let nextPartido = Number(mx.mp) + 1;
  let nextMercado = Number(mx.mm) + 1;
  let nextSel = Number(mx.ms) + 1;

  const [teams] = await conn.execute(
    `SELECT id_equipo, sigla, nombre FROM equipo WHERE activo_primera=1`,
  );
  const byId = Object.fromEntries(teams.map((t) => [t.id_equipo, t]));

  let inserted = 0;
  for (const row of MATCHES) {
    const [localId, visitId, estado, gl, gv, min, fecha, odds] = row;
    const local = byId[localId];
    const visit = byId[visitId];
    if (!local || !visit) continue;

    // Evitar duplicar mismo par local-visitante programado/vivo
    const [dup] = await conn.execute(
      `SELECT id_partido FROM partido
       WHERE id_equipo_local=? AND id_equipo_visitante=? AND id_estado_partido IN (1,2)
       LIMIT 1`,
      [localId, visitId],
    );
    if (dup.length) continue;

    const estadio = Math.min(Number(localId), 17); // seed solo tiene estadios 1..17
    const partidoId = nextPartido++;
    await conn.execute(
      `INSERT INTO partido
        (id_partido, id_jornada, id_estadio, id_equipo_local, id_equipo_visitante,
         id_estado_partido, fecha_hora, goles_local, goles_visitante, minuto_actual)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [partidoId, JORNADA, estadio, localId, visitId, estado, fecha, gl, gv, min],
    );

    const mercadoId = nextMercado++;
    const marketName = `${local.sigla} vs ${visit.sigla} 1X2`;
    await conn.execute(
      `INSERT INTO mercado (id_mercado, id_partido, id_tipo_mercado, nombre, activo, cierra_en)
       VALUES (?,?,1,?,1,?)`,
      [mercadoId, partidoId, marketName, fecha],
    );

    const labels = ['1', 'X', '2'];
    for (let i = 0; i < 3; i += 1) {
      await conn.execute(
        `INSERT INTO seleccion (id_seleccion, id_mercado, etiqueta, cuota, ganadora)
         VALUES (?,?,?,?,NULL)`,
        [nextSel++, mercadoId, labels[i], odds[i]],
      );
    }
    inserted += 1;
  }

  await conn.commit();
  console.log(`MySQL: +${inserted} partidos nuevos; 5/6 en vivo; 9/10 reprogramados.`);
} catch (error) {
  await conn.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  conn.release();
}

if (!process.exitCode) {
  const sync = await syncSportsFromMysqlToPostgres();
  console.log('Sync PG:', sync);
  const [live] = await mysqlPool.execute(
    `SELECT COUNT(*) AS c FROM partido WHERE id_estado_partido=2`,
  );
  const [up] = await mysqlPool.execute(
    `SELECT COUNT(*) AS c FROM partido WHERE id_estado_partido=1`,
  );
  console.log(`Dashboard → en vivo: ${live[0].c}, programados: ${up[0].c}`);
}

await mysqlPool.end();
process.exit(process.exitCode || 0);
