import { mysqlPool } from '../db/mysql.js';
import { pgPool } from '../db/postgres.js';
import { writeDomainEvent } from '../db/mongo.js';
import { pushUserNotification } from '../db/firebase.js';
import {
  centavosToPesos,
  millisToOdd,
  multiplyOddsMillis,
  pesosToCentavos,
  potentialWinCentavos,
} from '../utils/money.js';
import { MATCH_STATES_CLOSED_FOR_BETS } from '../constants/primeraA.js';
import { httpError } from '../utils/http.js';

export function describeDbError(error) {
  if (!error) return 'Error de base de datos desconocido.';
  if (error.message) return error.message;
  if (Array.isArray(error.errors) && error.errors[0]?.message) {
    return error.errors.map((e) => e.message).filter(Boolean).join('; ');
  }
  return String(error);
}

export async function ensureWallet(userId) {
  const [accounts] = await mysqlPool.execute(
    `SELECT id_cuenta, saldo, moneda, bloqueada FROM cuenta WHERE id_usuario = ? LIMIT 1`,
    [userId],
  );
  const account = accounts[0];
  if (!account) {
    const err = new Error('El usuario no tiene cuenta.');
    err.status = 404;
    throw err;
  }

  const mysqlCentavos = pesosToCentavos(account.saldo);
  const currency = account.moneda || 'COP';
  const blocked = Boolean(account.bloqueada);

  try {
    // PostgreSQL es la fuente de verdad del saldo de apuestas.
    // No pisar saldo_centavos si la fila ya existe (evita borrar depósitos/apuestas).
    await pgPool.query(
      `INSERT INTO billetera_sim (id_cuenta, id_usuario, saldo_centavos, moneda, bloqueada, actualizado_en)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (id_cuenta) DO UPDATE SET
         bloqueada = EXCLUDED.bloqueada,
         moneda = EXCLUDED.moneda,
         actualizado_en = NOW()`,
      [account.id_cuenta, userId, mysqlCentavos, currency, blocked],
    );

    const { rows } = await pgPool.query(
      `SELECT saldo_centavos, moneda, bloqueada FROM billetera_sim WHERE id_cuenta = $1`,
      [account.id_cuenta],
    );
    const balanceCentavos = Number(rows[0].saldo_centavos);

    // Espejo a MySQL para el header/login (best-effort).
    try {
      await mysqlPool.execute(`UPDATE cuenta SET saldo = ? WHERE id_cuenta = ?`, [
        centavosToPesos(balanceCentavos),
        account.id_cuenta,
      ]);
    } catch {
      /* ignore */
    }

    return {
      accountId: account.id_cuenta,
      balanceCentavos,
      currency: rows[0].moneda || currency,
      blocked: Boolean(rows[0].bloqueada),
      source: 'postgresql',
    };
  } catch (error) {
    return {
      accountId: account.id_cuenta,
      balanceCentavos: mysqlCentavos,
      currency,
      blocked,
      source: 'mysql',
      warning: `PostgreSQL no disponible (${describeDbError(error)}). Saldo leído solo desde MySQL.`,
    };
  }
}

export async function placeBet({
  userId,
  selectionIds,
  stakePesos,
  idempotencyKey,
}) {
  if (!Array.isArray(selectionIds) || selectionIds.length === 0) {
    const err = new Error('Debes enviar al menos una selección.');
    err.status = 400;
    throw err;
  }

  let stakeCentavos;
  try {
    stakeCentavos = pesosToCentavos(stakePesos);
  } catch {
    const err = new Error('Importe inválido.');
    err.status = 400;
    throw err;
  }
  if (stakeCentavos < 1000) {
    const err = new Error('La apuesta mínima es de $10 COP (simulación).');
    err.status = 400;
    throw err;
  }

  const wallet = await ensureWallet(userId);
  if (wallet.blocked) {
    const err = new Error('La cuenta está bloqueada.');
    err.status = 403;
    throw err;
  }

  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    if (idempotencyKey) {
      const existing = await client.query(
        `SELECT id_cupon, estado, monto_centavos, cuota_total_millis, ganancia_potencial_centavos
         FROM cupon WHERE idempotency_key = $1`,
        [idempotencyKey],
      );
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return { duplicate: true, bet: existing.rows[0] };
      }
    }

    const sels = await client.query(
      `SELECT s.id_seleccion, s.cuota_millis, s.estado AS sel_estado,
              m.estado AS mercado_estado, m.id_partido, p.estado AS partido_estado
       FROM seleccion_ops s
       INNER JOIN mercado_ops m ON m.id_mercado = s.id_mercado
       INNER JOIN partido_ops p ON p.id_partido = m.id_partido
       WHERE s.id_seleccion = ANY($1::int[])
       FOR UPDATE OF s`,
      [selectionIds],
    );

    if (sels.rows.length !== selectionIds.length) {
      throw httpError('Una o más selecciones no existen en el motor.', 400);
    }

    // Parlay: una sola selección por partido (sin 1+X del mismo evento)
    const matchIds = sels.rows.map((r) => Number(r.id_partido));
    if (new Set(matchIds).size !== matchIds.length) {
      throw httpError(
        'No puedes combinar dos selecciones del mismo partido en un cupón.',
        409,
      );
    }

    for (const row of sels.rows) {
      if (row.sel_estado !== 'abierta' || row.mercado_estado !== 'abierto') {
        throw httpError(`Selección ${row.id_seleccion} no está abierta.`, 409);
      }
      const estado = String(row.partido_estado || '').toLowerCase();
      if (MATCH_STATES_CLOSED_FOR_BETS.has(estado)) {
        throw httpError(
          `El partido #${row.id_partido} está ${estado} y no admite apuestas.`,
          409,
        );
      }
    }

    const walletRow = await client.query(
      `SELECT saldo_centavos, bloqueada FROM billetera_sim WHERE id_cuenta = $1 FOR UPDATE`,
      [wallet.accountId],
    );
    const balance = Number(walletRow.rows[0]?.saldo_centavos || 0);
    if (walletRow.rows[0]?.bloqueada) {
      const err = new Error('La cuenta está bloqueada.');
      err.status = 403;
      throw err;
    }
    if (balance < stakeCentavos) {
      const err = new Error('Saldo insuficiente.');
      err.status = 409;
      throw err;
    }

    const cuotaTotalMillis = multiplyOddsMillis(sels.rows.map((r) => r.cuota_millis));
    const ganancia = potentialWinCentavos(stakeCentavos, cuotaTotalMillis);
    const tipo = selectionIds.length === 1 ? 'simple' : 'combinada';
    const referencia = `APT-${Date.now()}-${userId}`;

    const newBalance = balance - stakeCentavos;
    await client.query(
      `UPDATE billetera_sim SET saldo_centavos = $1, actualizado_en = NOW() WHERE id_cuenta = $2`,
      [newBalance, wallet.accountId],
    );

    const cupon = await client.query(
      `INSERT INTO cupon (
         id_usuario, id_cuenta, tipo, estado, monto_centavos,
         cuota_total_millis, ganancia_potencial_centavos, idempotency_key
       ) VALUES ($1,$2,$3,'pendiente',$4,$5,$6,$7)
       RETURNING id_cupon, estado, monto_centavos, cuota_total_millis, ganancia_potencial_centavos`,
      [
        userId,
        wallet.accountId,
        tipo,
        stakeCentavos,
        cuotaTotalMillis,
        ganancia,
        idempotencyKey || null,
      ],
    );

    for (const row of sels.rows) {
      await client.query(
        `INSERT INTO cupon_seleccion (id_cupon, id_seleccion, cuota_millis)
         VALUES ($1,$2,$3)`,
        [cupon.rows[0].id_cupon, row.id_seleccion, row.cuota_millis],
      );
    }

    await client.query(
      `INSERT INTO libro_movimiento (
         id_cuenta, id_usuario, tipo, monto_centavos, saldo_despues_centavos, referencia, metadata
       ) VALUES ($1,$2,'apuesta', $3, $4, $5, $6::jsonb)`,
      [
        wallet.accountId,
        userId,
        -stakeCentavos,
        newBalance,
        referencia,
        JSON.stringify({ id_cupon: cupon.rows[0].id_cupon }),
      ],
    );

    await client.query('COMMIT');

    // Mirror balance to MySQL source of user-facing saldo (simulation sync)
    await mysqlPool.execute(`UPDATE cuenta SET saldo = ? WHERE id_cuenta = ?`, [
      newBalance / 100,
      wallet.accountId,
    ]);

    await writeDomainEvent({
      type: 'bet.placed',
      aggregate: 'cupon',
      aggregateId: cupon.rows[0].id_cupon,
      actorId: userId,
      payload: { stakeCentavos, selectionIds, referencia },
    });

    await pushUserNotification(userId, {
      title: 'Apuesta registrada',
      body: `Cupón #${cupon.rows[0].id_cupon} confirmado (simulación).`,
      kind: 'bet',
    });

    return { duplicate: false, bet: cupon.rows[0], referencia, balanceCentavos: newBalance };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listUserBets(userId) {
  try {
    const { rows } = await pgPool.query(
      `SELECT id_cupon, tipo, estado, monto_centavos, cuota_total_millis,
              ganancia_potencial_centavos, creado_en, liquidado_en
       FROM cupon WHERE id_usuario = $1 ORDER BY creado_en DESC LIMIT 100`,
      [userId],
    );

    const cuponIds = rows.map((r) => Number(r.id_cupon));
    let legsByCupon = {};
    if (cuponIds.length) {
      const legs = await pgPool.query(
        `SELECT cs.id_cupon, cs.id_seleccion, cs.cuota_millis,
                s.etiqueta, m.nombre AS mercado, m.id_partido,
                p.id_equipo_local, p.id_equipo_visitante
         FROM cupon_seleccion cs
         INNER JOIN seleccion_ops s ON s.id_seleccion = cs.id_seleccion
         INNER JOIN mercado_ops m ON m.id_mercado = s.id_mercado
         INNER JOIN partido_ops p ON p.id_partido = m.id_partido
         WHERE cs.id_cupon = ANY($1::bigint[])
         ORDER BY cs.id`,
        [cuponIds],
      );

      const teamIds = [
        ...new Set(
          legs.rows.flatMap((r) => [r.id_equipo_local, r.id_equipo_visitante]),
        ),
      ];
      let teamMap = {};
      if (teamIds.length) {
        const [teams] = await mysqlPool.execute(
          `SELECT id_equipo, nombre, sigla FROM equipo
           WHERE id_equipo IN (${teamIds.map(() => '?').join(',')})`,
          teamIds,
        );
        teamMap = Object.fromEntries(
          teams.map((t) => [t.id_equipo, { name: t.nombre, short: t.sigla }]),
        );
      }

      legsByCupon = legs.rows.reduce((acc, row) => {
        const key = Number(row.id_cupon);
        if (!acc[key]) acc[key] = [];
        const home = teamMap[row.id_equipo_local];
        const away = teamMap[row.id_equipo_visitante];
        const code = String(row.etiqueta || '').trim().toUpperCase();
        const pickLabel =
          code === '1'
            ? home?.name || 'Local'
            : code === '2'
              ? away?.name || 'Visitante'
              : code === 'X'
                ? 'Empate'
                : row.etiqueta;
        acc[key].push({
          selectionId: row.id_seleccion,
          label: pickLabel,
          code,
          market: row.mercado,
          matchId: row.id_partido,
          matchLabel:
            home && away
              ? `${home.short} vs ${away.short}`
              : row.mercado,
          odd: millisToOdd(row.cuota_millis),
        });
        return acc;
      }, {});
    }

    return {
      source: 'postgresql',
      items: rows.map((row) => ({
        id: Number(row.id_cupon),
        id_cupon: Number(row.id_cupon),
        tipo: row.tipo,
        estado: row.estado,
        monto_centavos: Number(row.monto_centavos),
        stake: centavosToPesos(row.monto_centavos),
        cuota_total_millis: Number(row.cuota_total_millis),
        totalOdd: millisToOdd(row.cuota_total_millis),
        ganancia_potencial_centavos: Number(row.ganancia_potencial_centavos),
        potentialWin: centavosToPesos(row.ganancia_potencial_centavos),
        creado_en: row.creado_en,
        liquidado_en: row.liquidado_en,
        legs: legsByCupon[Number(row.id_cupon)] || [],
      })),
    };
  } catch (error) {
    return {
      items: [],
      source: 'unavailable',
      warning: `PostgreSQL no disponible (${describeDbError(error)}). Historial de apuestas vacío hasta levantar Postgres.`,
    };
  }
}
