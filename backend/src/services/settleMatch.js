import { mysqlPool } from '../db/mysql.js';
import { pgPool } from '../db/postgres.js';
import { writeDomainEvent } from '../db/mongo.js';
import { pushUserNotification } from '../db/firebase.js';
import { centavosToPesos } from '../utils/money.js';

function oneXTwoResult(homeScore, awayScore) {
  if (homeScore > awayScore) return '1';
  if (homeScore < awayScore) return '2';
  return 'X';
}

/**
 * Admin liquida un partido: marca resultado, cierra mercados 1X2,
 * acredita cupones ganadores y marca perdedores (el stake ya se descontó al apostar).
 */
export async function settleMatchByAdmin({
  matchId,
  homeScore,
  awayScore,
  adminUserId,
}) {
  const id = Number(matchId);
  const hg = Number(homeScore);
  const ag = Number(awayScore);
  if (!Number.isInteger(id) || id < 1) {
    const err = new Error('id_partido inválido.');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0) {
    const err = new Error('Marcador inválido (enteros ≥ 0).');
    err.status = 400;
    throw err;
  }

  const winnerLabel = oneXTwoResult(hg, ag);

  await mysqlPool.execute(
    `UPDATE partido
     SET goles_local = ?, goles_visitante = ?, id_estado_partido = 3, minuto_actual = 90
     WHERE id_partido = ?`,
    [hg, ag, id],
  );

  const client = await pgPool.connect();
  const paid = [];
  const lost = [];
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE partido_ops
       SET estado = 'finalizado', goles_local = $1, goles_visitante = $2, actualizado_en = NOW()
       WHERE id_partido = $3`,
      [hg, ag, id],
    );

    const markets = await client.query(
      `SELECT id_mercado FROM mercado_ops WHERE id_partido = $1`,
      [id],
    );
    const marketIds = markets.rows.map((r) => r.id_mercado);
    if (marketIds.length) {
      await client.query(
        `UPDATE mercado_ops SET estado = 'cerrado' WHERE id_mercado = ANY($1::int[])`,
        [marketIds],
      );
    }

    const sels = await client.query(
      `SELECT s.id_seleccion, s.etiqueta, s.estado
       FROM seleccion_ops s
       INNER JOIN mercado_ops m ON m.id_mercado = s.id_mercado
       WHERE m.id_partido = $1`,
      [id],
    );

    for (const row of sels.rows) {
      const won =
        String(row.etiqueta).trim().toUpperCase() === winnerLabel.toUpperCase();
      await client.query(
        `UPDATE seleccion_ops SET estado = $1 WHERE id_seleccion = $2`,
        [won ? 'ganadora' : 'perdedora', row.id_seleccion],
      );
    }

    const affected = await client.query(
      `SELECT DISTINCT cs.id_cupon
       FROM cupon_seleccion cs
       INNER JOIN seleccion_ops s ON s.id_seleccion = cs.id_seleccion
       INNER JOIN mercado_ops m ON m.id_mercado = s.id_mercado
       INNER JOIN cupon c ON c.id_cupon = cs.id_cupon
       WHERE m.id_partido = $1 AND c.estado = 'pendiente'`,
      [id],
    );

    for (const { id_cupon: cuponId } of affected.rows) {
      const legs = await client.query(
        `SELECT cs.id_seleccion, s.estado AS sel_estado, m.id_partido
         FROM cupon_seleccion cs
         INNER JOIN seleccion_ops s ON s.id_seleccion = cs.id_seleccion
         INNER JOIN mercado_ops m ON m.id_mercado = s.id_mercado
         WHERE cs.id_cupon = $1`,
        [cuponId],
      );

      const anyLost = legs.rows.some((l) => l.sel_estado === 'perdedora');
      const allWon =
        legs.rows.length > 0 &&
        legs.rows.every((l) => l.sel_estado === 'ganadora');
      const stillOpen = legs.rows.some(
        (l) => l.sel_estado === 'abierta' || !l.sel_estado,
      );

      if (anyLost) {
        await client.query(
          `UPDATE cupon SET estado = 'perdida', liquidado_en = NOW() WHERE id_cupon = $1`,
          [cuponId],
        );
        lost.push(Number(cuponId));
        continue;
      }

      if (stillOpen || !allWon) {
        continue;
      }

      const cupon = await client.query(
        `SELECT id_cupon, id_usuario, id_cuenta, ganancia_potencial_centavos, estado
         FROM cupon WHERE id_cupon = $1 FOR UPDATE`,
        [cuponId],
      );
      const row = cupon.rows[0];
      if (!row || row.estado !== 'pendiente') continue;

      const payout = Number(row.ganancia_potencial_centavos);
      const wallet = await client.query(
        `SELECT saldo_centavos FROM billetera_sim WHERE id_cuenta = $1 FOR UPDATE`,
        [row.id_cuenta],
      );
      const balance = Number(wallet.rows[0]?.saldo_centavos || 0);
      const newBalance = balance + payout;

      await client.query(
        `UPDATE billetera_sim SET saldo_centavos = $1, actualizado_en = NOW() WHERE id_cuenta = $2`,
        [newBalance, row.id_cuenta],
      );
      await client.query(
        `UPDATE cupon SET estado = 'ganada', liquidado_en = NOW() WHERE id_cupon = $1`,
        [cuponId],
      );
      await client.query(
        `INSERT INTO libro_movimiento (
           id_cuenta, id_usuario, tipo, monto_centavos, saldo_despues_centavos, referencia, metadata
         ) VALUES ($1,$2,'premio',$3,$4,$5,$6::jsonb)`,
        [
          row.id_cuenta,
          row.id_usuario,
          payout,
          newBalance,
          `LIQ-${cuponId}`,
          JSON.stringify({ id_cupon: cuponId, matchId: id, winnerLabel }),
        ],
      );

      try {
        await mysqlPool.execute(`UPDATE cuenta SET saldo = ? WHERE id_cuenta = ?`, [
          centavosToPesos(newBalance),
          row.id_cuenta,
        ]);
      } catch {
        /* espejo best-effort */
      }

      paid.push({
        cuponId: Number(cuponId),
        userId: Number(row.id_usuario),
        payoutPesos: centavosToPesos(payout),
      });

      pushUserNotification(row.id_usuario, {
        title: '¡Apuesta ganada!',
        body: `Cupón #${cuponId} liquidado: +${centavosToPesos(payout)} COP`,
        kind: 'bet_win',
      }).catch(() => {});
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  await writeDomainEvent({
    type: 'match.settled',
    aggregate: 'partido',
    aggregateId: id,
    actorId: adminUserId,
    payload: { homeScore: hg, awayScore: ag, winnerLabel, paid, lost },
  });

  return {
    matchId: id,
    homeScore: hg,
    awayScore: ag,
    winnerLabel,
    paidCount: paid.length,
    lostCount: lost.length,
    paid,
    lost,
  };
}
