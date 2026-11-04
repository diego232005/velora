import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { mysqlPool } from '../db/mysql.js';
import { settleMatchByAdmin } from '../services/settleMatch.js';
import { resolveCrestUrl } from '../services/teamCrests.js';
import { syncSportsFromMysqlToPostgres } from '../services/syncSports.js';
import {
  assertDistinctTeams,
  assertPrimeraATeam,
  PRIMERA_A_TEAMS,
} from '../constants/primeraA.js';
import { sendError, sendOk } from '../utils/http.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/teams', async (_request, response) => {
  return sendOk(response, { items: PRIMERA_A_TEAMS });
});

adminRouter.get('/matches', async (_request, response) => {
  try {
    const [rows] = await mysqlPool.execute(
      `SELECT p.id_partido AS id, p.fecha_hora AS startsAt,
              ep.nombre AS status, p.goles_local AS homeScore, p.goles_visitante AS awayScore,
              loc.id_equipo AS homeId, loc.nombre AS homeName, loc.sigla AS homeShort,
              vis.id_equipo AS awayId, vis.nombre AS awayName, vis.sigla AS awayShort
       FROM partido p
       INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido
       INNER JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
       INNER JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
       ORDER BY p.fecha_hora DESC
       LIMIT 80`,
    );

    const items = await Promise.all(
      rows.map(async (m) => ({
        id: m.id,
        startsAt: m.startsAt,
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        settled: String(m.status).toLowerCase().includes('final'),
        homeTeam: {
          id: m.homeId,
          name: m.homeName,
          short: m.homeShort,
          crestUrl: await resolveCrestUrl({
            name: m.homeName,
            short: m.homeShort,
          }),
        },
        awayTeam: {
          id: m.awayId,
          name: m.awayName,
          short: m.awayShort,
          crestUrl: await resolveCrestUrl({
            name: m.awayName,
            short: m.awayShort,
          }),
        },
      })),
    );

    return sendOk(response, { items });
  } catch (error) {
    return sendError(response, error);
  }
});

/**
 * Programa un partido Primera A (local ≠ visitante) + mercado 1X2 básico.
 * Body: { homeId, awayId, startsAt, odds?: { home, draw, away } }
 */
adminRouter.post('/matches', async (request, response) => {
  try {
    const { home, away } = assertDistinctTeams(
      request.body?.homeId,
      request.body?.awayId,
    );
    assertPrimeraATeam(home);
    assertPrimeraATeam(away);

    const startsAt = String(request.body?.startsAt || '').trim();
    if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
      const err = new Error('startsAt inválido (usa fecha ISO o MySQL datetime).');
      err.status = 400;
      throw err;
    }

    const odds = {
      home: Number(request.body?.odds?.home ?? 2.1),
      draw: Number(request.body?.odds?.draw ?? 3.2),
      away: Number(request.body?.odds?.away ?? 3.4),
    };
    for (const [k, v] of Object.entries(odds)) {
      if (!Number.isFinite(v) || v <= 1) {
        const err = new Error(`Cuota ${k} inválida.`);
        err.status = 400;
        throw err;
      }
    }

    const [[mx]] = await mysqlPool.query(
      `SELECT
         (SELECT COALESCE(MAX(id_partido),0) FROM partido) AS mp,
         (SELECT COALESCE(MAX(id_mercado),0) FROM mercado) AS mm,
         (SELECT COALESCE(MAX(id_seleccion),0) FROM seleccion) AS ms`,
    );
    const partidoId = Number(mx.mp) + 1;
    const mercadoId = Number(mx.mm) + 1;
    let selId = Number(mx.ms) + 1;
    const estadio = Math.min(home, 17);

    const [homeRows] = await mysqlPool.execute(
      `SELECT sigla FROM equipo WHERE id_equipo=? AND activo_primera=1`,
      [home],
    );
    const [awayRows] = await mysqlPool.execute(
      `SELECT sigla FROM equipo WHERE id_equipo=? AND activo_primera=1`,
      [away],
    );
    if (!homeRows[0] || !awayRows[0]) {
      const err = new Error('Equipo no encontrado o inactivo en Primera A.');
      err.status = 400;
      throw err;
    }

    await mysqlPool.execute(
      `INSERT INTO partido
        (id_partido, id_jornada, id_estadio, id_equipo_local, id_equipo_visitante,
         id_estado_partido, fecha_hora, goles_local, goles_visitante, minuto_actual)
       VALUES (?,?,?,?,?,1,?,NULL,NULL,NULL)`,
      [partidoId, 4, estadio, home, away, startsAt],
    );

    const marketName = `${homeRows[0].sigla} vs ${awayRows[0].sigla} 1X2`;
    await mysqlPool.execute(
      `INSERT INTO mercado (id_mercado, id_partido, id_tipo_mercado, nombre, activo, cierra_en)
       VALUES (?,?,1,?,1,?)`,
      [mercadoId, partidoId, marketName, startsAt],
    );

    const labels = [
      ['1', odds.home],
      ['X', odds.draw],
      ['2', odds.away],
    ];
    for (const [etiqueta, cuota] of labels) {
      await mysqlPool.execute(
        `INSERT INTO seleccion (id_seleccion, id_mercado, etiqueta, cuota, ganadora)
         VALUES (?,?,?,?,NULL)`,
        [selId++, mercadoId, etiqueta, cuota],
      );
    }

    await syncSportsFromMysqlToPostgres();

    return sendOk(
      response,
      {
        matchId: partidoId,
        mercadoId,
        note: 'Partido programado y sincronizado a PostgreSQL.',
      },
      201,
    );
  } catch (error) {
    return sendError(response, error);
  }
});

adminRouter.post('/matches/:id/settle', async (request, response) => {
  try {
    const result = await settleMatchByAdmin({
      matchId: request.params.id,
      homeScore: request.body?.homeScore,
      awayScore: request.body?.awayScore,
      adminUserId: request.userId,
    });
    return sendOk(response, {
      ...result,
      note: 'Ganadores acreditados; perdedores ya tenían el stake descontado al apostar.',
    });
  } catch (error) {
    return sendError(response, error);
  }
});
