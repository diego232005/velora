import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { describeDbError, ensureWallet } from '../services/betting.js';
import { pgPool } from '../db/postgres.js';
import { centavosToPesos } from '../utils/money.js';

export const walletRouter = Router();

walletRouter.get('/me', requireAuth, async (request, response) => {
  try {
    const wallet = await ensureWallet(request.userId);
    response.json({
      ok: true,
      wallet: {
        accountId: wallet.accountId,
        balance: centavosToPesos(wallet.balanceCentavos),
        balanceCentavos: wallet.balanceCentavos,
        currency: wallet.currency,
        blocked: wallet.blocked,
        source: wallet.source,
        warning: wallet.warning || null,
      },
    });
  } catch (error) {
    response.status(error.status || 500).json({
      ok: false,
      error: describeDbError(error) || 'No se pudo cargar la billetera.',
    });
  }
});

walletRouter.get('/movements', requireAuth, async (request, response) => {
  try {
    const { rows } = await pgPool.query(
      `SELECT id, tipo, monto_centavos, saldo_despues_centavos, referencia, creado_en
       FROM libro_movimiento WHERE id_usuario = $1 ORDER BY creado_en DESC LIMIT 100`,
      [request.userId],
    );
    response.json({
      ok: true,
      source: 'postgresql',
      items: rows.map((r) => ({
        ...r,
        monto: centavosToPesos(r.monto_centavos),
        saldoDespues: centavosToPesos(r.saldo_despues_centavos),
      })),
    });
  } catch (error) {
    response.json({
      ok: true,
      source: 'unavailable',
      items: [],
      warning: `PostgreSQL no disponible (${describeDbError(error)}). Movimientos vacíos hasta levantar Postgres (docker compose up -d postgres).`,
    });
  }
});
