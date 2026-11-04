import { Router } from 'express';
import { mysqlPool } from '../db/mysql.js';
import { syncSportsFromMysqlToPostgres } from '../services/syncSports.js';
import { millisToOdd } from '../utils/money.js';
import { pgPool } from '../db/postgres.js';
import { resolveCrestUrl } from '../services/teamCrests.js';

export const sportsRouter = Router();

sportsRouter.get('/clubs', async (_request, response) => {
  try {
    const [rows] = await mysqlPool.execute(
      `SELECT e.id_equipo AS id, e.nombre, e.sigla, e.fundacion, e.activo_primera AS activo,
              c.nombre AS ciudad, es.nombre AS estadio
       FROM equipo e
       INNER JOIN ciudad c ON c.id_ciudad = e.id_ciudad
       INNER JOIN estadio es ON es.id_estadio = e.id_estadio_local
       WHERE e.activo_primera = 1
       ORDER BY e.nombre`,
    );
    const items = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        crestUrl: await resolveCrestUrl({
          name: row.nombre,
          short: row.sigla,
          id: row.id,
        }),
      })),
    );
    response.json({ ok: true, source: 'mysql', items });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: 'No se pudieron listar clubes.' });
  }
});

sportsRouter.get('/players', async (request, response) => {
  try {
    const clubId = Number(request.query.clubId) || null;
    const params = [];
    let sql = `
      SELECT j.id_jugador AS id, j.nombres, j.apellidos, j.dorsal, j.fecha_nacimiento,
             p.nombre AS posicion, e.id_equipo AS clubId, e.nombre AS club
      FROM jugador j
      INNER JOIN posicion_jugador p ON p.id_posicion = j.id_posicion
      INNER JOIN plantilla pl ON pl.id_jugador = j.id_jugador AND pl.fecha_fin IS NULL
      INNER JOIN equipo e ON e.id_equipo = pl.id_equipo`;
    if (clubId) {
      sql += ' WHERE e.id_equipo = ?';
      params.push(clubId);
    }
    sql += ' ORDER BY e.nombre, j.apellidos LIMIT 500';
    const [rows] = await mysqlPool.execute(sql, params);
    response.json({ ok: true, source: 'mysql', items: rows });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: 'No se pudieron listar jugadores.' });
  }
});

sportsRouter.get('/competitions', async (_request, response) => {
  try {
    const [rows] = await mysqlPool.execute(
      `SELECT l.id_liga AS id,
              COALESCE(l.nombre_comercial, l.nombre_oficial) AS nombre,
              o.nombre AS organizador, d.nombre AS deporte
       FROM liga l
       INNER JOIN organizador o ON o.id_organizador = l.id_organizador
       INNER JOIN deporte d ON d.id_deporte = l.id_deporte`,
    );
    response.json({ ok: true, source: 'mysql', items: rows });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: 'No se pudieron listar competiciones.' });
  }
});

sportsRouter.get('/matches', async (request, response) => {
  try {
    const status = String(request.query.status || '').toLowerCase();
    let filter = '';
    if (status === 'live' || status === 'en_vivo') filter = ' AND p.id_estado_partido = 2';
    if (status === 'upcoming' || status === 'programado') filter = ' AND p.id_estado_partido = 1';
    if (status === 'finished' || status === 'finalizado') filter = ' AND p.id_estado_partido = 3';

    const [rows] = await mysqlPool.execute(
      `SELECT p.id_partido AS id, p.fecha_hora AS startsAt,
              ep.nombre AS status, p.goles_local AS homeScore, p.goles_visitante AS awayScore,
              p.minuto_actual AS clock,
              loc.id_equipo AS homeId, loc.nombre AS homeName, loc.sigla AS homeShort,
              vis.id_equipo AS awayId, vis.nombre AS awayName, vis.sigla AS awayShort,
              COALESCE(lig.nombre_comercial, lig.nombre_oficial) AS leagueName
       FROM partido p
       INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido
       INNER JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
       INNER JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
       INNER JOIN jornada j ON j.id_jornada = p.id_jornada
       INNER JOIN torneo t ON t.id_torneo = j.id_torneo
       INNER JOIN temporada tem ON tem.id_temporada = t.id_temporada
       INNER JOIN liga lig ON lig.id_liga = tem.id_liga
       WHERE 1=1 ${filter}
       ORDER BY p.fecha_hora`,
    );

    const matchIds = rows.map((r) => r.id);
    let marketsByMatch = {};
    if (matchIds.length) {
      const [sels] = await mysqlPool.execute(
        `SELECT s.id_seleccion AS id, s.etiqueta AS label, s.cuota AS value,
                m.id_mercado AS marketId, m.nombre AS marketName, m.id_partido AS matchId,
                m.activo AS active, tm.codigo AS marketCode
         FROM seleccion s
         INNER JOIN mercado m ON m.id_mercado = s.id_mercado
         INNER JOIN tipo_mercado tm ON tm.id_tipo_mercado = m.id_tipo_mercado
         WHERE m.id_partido IN (${matchIds.map(() => '?').join(',')})`,
        matchIds,
      );
      marketsByMatch = sels.reduce((acc, row) => {
        if (!acc[row.matchId]) acc[row.matchId] = [];
        acc[row.matchId].push(row);
        return acc;
      }, {});
    }

    const items = await Promise.all(
      rows.map(async (match) => {
        const odds = (marketsByMatch[match.id] || []).filter(
          (o) => Number(o.active) === 1,
        );
        const primary = odds.filter((o) => o.marketCode === '1X2');
        const [homeCrest, awayCrest] = await Promise.all([
          resolveCrestUrl({
            name: match.homeName,
            short: match.homeShort,
            id: match.homeId,
          }),
          resolveCrestUrl({
            name: match.awayName,
            short: match.awayShort,
            id: match.awayId,
          }),
        ]);
        return {
          id: match.id,
          sportId: 'football',
          leagueName: match.leagueName,
          startsAt: match.startsAt,
          status: match.status,
          score: { home: match.homeScore, away: match.awayScore },
          clock: match.clock ? `${match.clock}'` : null,
          period:
            match.clock == null
              ? null
              : Number(match.clock) <= 45
                ? '1T'
                : Number(match.clock) <= 90
                  ? '2T'
                  : 'TE',
          homeTeam: {
            id: match.homeId,
            name: match.homeName,
            short: match.homeShort,
            color: '#3d7eff',
            crestUrl: homeCrest,
          },
          awayTeam: {
            id: match.awayId,
            name: match.awayName,
            short: match.awayShort,
            color: '#ff5c3d',
            crestUrl: awayCrest,
          },
          market: 'Resultado final',
          odds: (primary.length ? primary : odds.slice(0, 3)).map((o) => {
            const raw = String(o.label || '').trim().toUpperCase();
            const label =
              raw === '1'
                ? match.homeShort || '1'
                : raw === '2'
                  ? match.awayShort || '2'
                  : raw === 'X'
                    ? 'Empate'
                    : o.label;
            return {
              id: String(o.id),
              label,
              code: raw,
              value: Number(o.value),
              marketId: o.marketId,
            };
          }),
          extraMarkets: odds.length,
        };
      }),
    );

    response.json({ ok: true, source: 'mysql', items });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: 'No se pudieron listar partidos.' });
  }
});

sportsRouter.get('/matches/:id', async (request, response) => {
  try {
    const id = Number(request.params.id);
    const [rows] = await mysqlPool.execute(
      `SELECT p.id_partido AS id, p.fecha_hora AS startsAt, ep.nombre AS status,
              p.goles_local AS homeScore, p.goles_visitante AS awayScore, p.minuto_actual AS clock,
              loc.nombre AS homeName, loc.sigla AS homeShort,
              vis.nombre AS awayName, vis.sigla AS awayShort
       FROM partido p
       INNER JOIN estado_partido ep ON ep.id_estado_partido = p.id_estado_partido
       INNER JOIN equipo loc ON loc.id_equipo = p.id_equipo_local
       INNER JOIN equipo vis ON vis.id_equipo = p.id_equipo_visitante
       WHERE p.id_partido = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) {
      return response.status(404).json({ ok: false, error: 'Partido no encontrado.' });
    }
    const [markets] = await mysqlPool.execute(
      `SELECT m.id_mercado AS id, m.nombre, m.activo, tm.codigo,
              s.id_seleccion AS selectionId, s.etiqueta, s.cuota
       FROM mercado m
       INNER JOIN tipo_mercado tm ON tm.id_tipo_mercado = m.id_tipo_mercado
       INNER JOIN seleccion s ON s.id_mercado = m.id_mercado
       WHERE m.id_partido = ?`,
      [id],
    );
    response.json({ ok: true, match: rows[0], markets });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: 'No se pudo cargar el partido.' });
  }
});

sportsRouter.post('/sync', async (_request, response) => {
  try {
    const result = await syncSportsFromMysqlToPostgres();
    response.json({ ok: true, ...result });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      ok: false,
      error: 'No se pudo sincronizar MySQL → PostgreSQL.',
      detail: error.message,
    });
  }
});

sportsRouter.get('/engine/selections', async (_request, response) => {
  try {
    const { rows } = await pgPool.query(
      `SELECT id_seleccion, id_mercado, etiqueta, cuota_millis, estado FROM seleccion_ops LIMIT 200`,
    );
    response.json({
      ok: true,
      source: 'postgresql',
      items: rows.map((r) => ({ ...r, odd: millisToOdd(r.cuota_millis) })),
    });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
});
