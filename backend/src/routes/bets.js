import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { describeDbError, listUserBets, placeBet } from '../services/betting.js';
import { sendError, sendOk } from '../utils/http.js';

export const betsRouter = Router();

betsRouter.post('/place', requireAuth, async (request, response) => {
  try {
    const selectionIds = (request.body?.selectionIds || []).map(Number);
    const stakePesos = request.body?.stake;
    const idempotencyKey =
      request.headers['idempotency-key'] || request.body?.idempotencyKey || null;

    const result = await placeBet({
      userId: request.userId,
      selectionIds,
      stakePesos,
      idempotencyKey,
    });

    return sendOk(response, result, result.duplicate ? 200 : 201);
  } catch (error) {
    console.error('place bet:', describeDbError(error));
    if (!error.status) {
      error.message =
        describeDbError(error) ||
        'No se pudo registrar la apuesta. ¿PostgreSQL está encendido?';
    }
    return sendError(response, error);
  }
});

betsRouter.get('/mine', requireAuth, async (request, response) => {
  try {
    const result = await listUserBets(request.userId);
    return sendOk(response, {
      source: result.source,
      items: result.items,
      warning: result.warning || null,
    });
  } catch (error) {
    return sendError(response, {
      status: 500,
      message: describeDbError(error) || 'No se pudo listar apuestas.',
    });
  }
});
