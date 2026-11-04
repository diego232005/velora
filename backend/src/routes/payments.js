import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { ensureWallet } from '../services/betting.js';
import { pgPool } from '../db/postgres.js';
import { mysqlPool } from '../db/mysql.js';
import { writeDomainEvent } from '../db/mongo.js';
import { pesosToCentavos, centavosToPesos } from '../utils/money.js';

export const paymentsRouter = Router();

/**
 * Wompi sandbox integration.
 * Without WOMPI_PRIVATE_KEY the flow uses an explicit SIMULATION adapter
 * that is never labelled as a real Wompi approval.
 */
function wompiConfigured() {
  return Boolean(process.env.WOMPI_PRIVATE_KEY && process.env.WOMPI_PUBLIC_KEY);
}

function integritySecret() {
  return process.env.WOMPI_INTEGRITY_SECRET || '';
}

function buildIntegritySignature({ reference, amountInCents, currency = 'COP' }) {
  const secret = integritySecret();
  if (!secret) {
    throw new Error('Falta WOMPI_INTEGRITY_SECRET en el servidor.');
  }
  const payload = `${reference}${amountInCents}${currency}${secret}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * CloudFront de checkout.wompi.co responde 403 si redirect-url lleva localhost
 * (lo trata como SSRF). Hay que usar HTTPS público (túnel).
 */
function resolveWompiRedirectUrl(requested) {
  const fallback =
    process.env.WOMPI_REDIRECT_URL ||
    `${process.env.PUBLIC_FRONTEND_ORIGIN || process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/billetera`;

  if (!requested) return fallback;

  try {
    const url = new URL(String(requested));
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return fallback.startsWith('https://')
        ? fallback
        : process.env.WOMPI_REDIRECT_URL || fallback;
    }
    if (url.protocol !== 'https:' && host !== 'localhost') {
      return fallback;
    }
    return url.toString();
  } catch {
    return fallback;
  }
}

paymentsRouter.get('/wompi/status', (_request, response) => {
  response.json({
    ok: true,
    mode: wompiConfigured() ? 'sandbox-ready' : 'simulation-adapter',
    publicKeyConfigured: Boolean(process.env.WOMPI_PUBLIC_KEY),
    publicKey: process.env.WOMPI_PUBLIC_KEY || null,
    integrityConfigured: Boolean(integritySecret()),
    widgetScript: 'https://checkout.wompi.co/widget.js',
    checkoutUrl: 'https://checkout.wompi.co/p/',
    note: 'No se procesa dinero real. Entorno de pruebas / simulación académica.',
  });
});

/**
 * Crea referencia + firma de integridad para Widget / Web Checkout.
 * @see https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */
paymentsRouter.post('/wompi/checkout-session', requireAuth, async (request, response) => {
  try {
    if (!wompiConfigured() || !integritySecret()) {
      return response.status(503).json({
        ok: false,
        error: 'Wompi sandbox incompleto. Revisa PUBLIC/PRIVATE/INTEGRITY en .env',
      });
    }

    const amountPesos = Number(request.body?.amount);
    if (!Number.isFinite(amountPesos) || amountPesos < 1500) {
      return response.status(400).json({
        ok: false,
        error: 'Monto mínimo de depósito: 1500 COP (sandbox Wompi).',
      });
    }

    const amountInCents = pesosToCentavos(amountPesos);
    const currency = 'COP';
    // Wompi recomienda referencias alfanuméricas (sin caracteres raros).
    const reference = `VLR${request.userId}${Date.now()}`;
    const signature = buildIntegritySignature({
      reference,
      amountInCents,
      currency,
    });

    const redirectBase = resolveWompiRedirectUrl(request.body?.redirectUrl);

    let wallet;
    try {
      wallet = await ensureWallet(request.userId);
      await pgPool.query(
        `INSERT INTO wompi_transaccion (
           referencia, id_usuario, id_cuenta, monto_centavos, estado
         ) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (referencia) DO NOTHING`,
        [reference, request.userId, wallet.accountId, amountInCents, 'PENDING'],
      );
    } catch (error) {
      console.warn('checkout-session: PostgreSQL no disponible, sesión sin libro local:', error.message);
    }

    await writeDomainEvent({
      type: 'payment.checkout.created',
      aggregate: 'wompi_transaccion',
      aggregateId: reference,
      actorId: request.userId,
      payload: { amountInCents, currency },
    });

    return response.status(201).json({
      ok: true,
      mode: 'widget-checkout',
      publicKey: process.env.WOMPI_PUBLIC_KEY,
      currency,
      amountInCents,
      amount: amountPesos,
      reference,
      signatureIntegrity: signature,
      redirectUrl: redirectBase,
      widgetScript: 'https://checkout.wompi.co/widget.js',
      checkoutAction: 'https://checkout.wompi.co/p/',
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Crea un depósito PENDING en el libro local.
 * Con `localOnly: true` (botón “simulación sin widget”) NUNCA llama a sandbox.wompi.co.
 * El cobro real de sandbox va por Widget / Web Checkout (`/checkout-session`).
 */
paymentsRouter.post('/wompi/deposits', requireAuth, async (request, response) => {
  try {
    const amountPesos = Number(request.body?.amount);
    if (!Number.isFinite(amountPesos) || amountPesos < 1000) {
      return response.status(400).json({
        ok: false,
        error: 'Monto mínimo de depósito simulado: 1000 COP.',
      });
    }

    const localOnly =
      request.body?.localOnly === true ||
      request.body?.mode === 'simulation' ||
      !wompiConfigured();

    const amountCentavos = pesosToCentavos(amountPesos);
    const wallet = await ensureWallet(request.userId);
    const referencia = `WOMPI-SIM-${Date.now()}-${request.userId}`;

    try {
      await pgPool.query(
        `INSERT INTO wompi_transaccion (
           referencia, id_usuario, id_cuenta, monto_centavos, estado
         ) VALUES ($1,$2,$3,$4,$5)`,
        [referencia, request.userId, wallet.accountId, amountCentavos, 'PENDING'],
      );
    } catch (error) {
      console.error('deposits: PostgreSQL', error.message);
      return response.status(503).json({
        ok: false,
        error: 'PostgreSQL no disponible para registrar el depósito simulado.',
      });
    }

    await writeDomainEvent({
      type: 'payment.deposit.created',
      aggregate: 'wompi_transaccion',
      aggregateId: referencia,
      actorId: request.userId,
      payload: { amountCentavos, mode: 'simulation-adapter', localOnly },
    });

    // Flujo académico / botón “sin widget”: solo libro local.
    if (localOnly) {
      return response.status(201).json({
        ok: true,
        mode: 'simulation-adapter',
        reference: referencia,
        amount: amountPesos,
        next: 'POST /api/payments/wompi/simulate-approval con { reference } para acreditar (solo demo).',
        checkoutUrl: null,
      });
    }

    // Claves Wompi presentes pero sin localOnly: orientar al checkout (no API CARD incompleta).
    return response.status(201).json({
      ok: true,
      mode: 'sandbox-pending-local',
      reference: referencia,
      amount: amountPesos,
      note: 'Usa POST /api/payments/wompi/checkout-session + Widget para cobro sandbox real.',
      checkoutUrl: 'https://checkout.wompi.co/p/',
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ ok: false, error: error.message });
  }
});

function getNested(obj, path) {
  return String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Checksum oficial Wompi: properties + timestamp + events_secret */
function verifyWompiEventChecksum(body, headerChecksum) {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return { ok: true, skipped: true };
  const checksum =
    headerChecksum || body?.signature?.checksum || body?.checksum || '';
  if (!checksum) return { ok: true, skipped: true };

  const properties = body?.signature?.properties;
  const timestamp = body?.timestamp ?? body?.signature?.timestamp;
  if (!Array.isArray(properties) || timestamp == null) {
    return { ok: false, error: 'Firma de evento incompleta.' };
  }

  const data = body?.data || {};
  let chain = '';
  for (const prop of properties) {
    const value = getNested(data, prop);
    chain += value == null ? '' : String(value);
  }
  chain += String(timestamp);
  chain += secret;
  const expected = crypto.createHash('sha256').update(chain).digest('hex');
  const valid = expected.toLowerCase() === String(checksum).toLowerCase();
  return { ok: valid, expected, received: checksum };
}

/**
 * Acredita un depósito PENDING → APPROVED (idempotente).
 */
async function approveWompiDeposit({
  reference,
  userId = null,
  wompiId = null,
  source = 'webhook',
  raw = null,
  movementType = 'deposito_wompi',
}) {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const tx = await client.query(
      `SELECT * FROM wompi_transaccion WHERE referencia = $1 FOR UPDATE`,
      [reference],
    );
    const row = tx.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, error: 'Referencia no encontrada.' };
    }
    if (userId != null && Number(row.id_usuario) !== Number(userId)) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, error: 'Referencia no encontrada.' };
    }
    if (row.estado === 'APPROVED') {
      await client.query('COMMIT');
      const wallet = await pgPool.query(
        `SELECT saldo_centavos FROM billetera_sim WHERE id_cuenta = $1`,
        [row.id_cuenta],
      );
      return {
        ok: true,
        duplicate: true,
        status: 'APPROVED',
        reference,
        balance: centavosToPesos(wallet.rows[0]?.saldo_centavos || 0),
      };
    }

    const wallet = await client.query(
      `SELECT saldo_centavos FROM billetera_sim WHERE id_cuenta = $1 FOR UPDATE`,
      [row.id_cuenta],
    );
    if (!wallet.rows[0]) {
      await client.query('ROLLBACK');
      return { ok: false, status: 409, error: 'Billetera no encontrada en PostgreSQL.' };
    }

    const newBalance =
      Number(wallet.rows[0].saldo_centavos) + Number(row.monto_centavos);

    await client.query(
      `UPDATE billetera_sim SET saldo_centavos = $1, actualizado_en = NOW() WHERE id_cuenta = $2`,
      [newBalance, row.id_cuenta],
    );
    await client.query(
      `UPDATE wompi_transaccion
       SET estado = 'APPROVED',
           wompi_id = COALESCE($2, wompi_id),
           raw_evento = COALESCE($3::jsonb, raw_evento),
           actualizado_en = NOW()
       WHERE referencia = $1`,
      [reference, wompiId, raw ? JSON.stringify(raw) : null],
    );
    await client.query(
      `INSERT INTO libro_movimiento (
         id_cuenta, id_usuario, tipo, monto_centavos, saldo_despues_centavos, referencia, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       ON CONFLICT (referencia, tipo) DO NOTHING`,
      [
        row.id_cuenta,
        row.id_usuario,
        movementType,
        row.monto_centavos,
        newBalance,
        reference,
        JSON.stringify({ source, wompiId }),
      ],
    );
    await client.query('COMMIT');

    try {
      await mysqlPool.execute(`UPDATE cuenta SET saldo = ? WHERE id_cuenta = ?`, [
        centavosToPesos(newBalance),
        row.id_cuenta,
      ]);
    } catch (error) {
      console.warn('approveWompiDeposit MySQL:', error.message);
    }

    await writeDomainEvent({
      type: 'payment.deposit.approved',
      aggregate: 'wompi_transaccion',
      aggregateId: reference,
      actorId: row.id_usuario,
      payload: { source, amountCentavos: row.monto_centavos, wompiId },
    });

    return {
      ok: true,
      duplicate: false,
      status: 'APPROVED',
      reference,
      balance: centavosToPesos(newBalance),
      amount: centavosToPesos(row.monto_centavos),
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    client.release();
  }
}

async function fetchWompiTransaction(transactionId) {
  const key = process.env.WOMPI_PRIVATE_KEY;
  if (!key) throw new Error('Falta WOMPI_PRIVATE_KEY');
  const res = await fetch(
    `https://sandbox.wompi.co/v1/transactions/${encodeURIComponent(transactionId)}`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      payload?.error?.reason ||
      payload?.error?.messages?.[0] ||
      `Wompi HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload?.data || payload;
}

paymentsRouter.post('/wompi/simulate-approval', requireAuth, async (request, response) => {
  if (wompiConfigured() && process.env.ALLOW_WOMPI_SIMULATION !== 'true') {
    return response.status(403).json({
      ok: false,
      error: 'Simulación deshabilitada cuando hay claves Wompi reales de sandbox.',
    });
  }

  try {
    const reference = String(request.body?.reference || '');
    const result = await approveWompiDeposit({
      reference,
      userId: request.userId,
      source: 'simulation',
      movementType: 'deposito_sim',
    });
    if (!result.ok) {
      return response.status(result.status || 400).json(result);
    }
    response.json({
      ...result,
      mode: 'simulation-adapter',
      note: 'Acreditación simulada. No es un cobro real de Wompi.',
    });
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * Tras redirect Wompi (?id=TRANSACTION_ID): consulta sandbox y acredita si APPROVED.
 * Si DNS/API sandbox falla (común en local), usa `reference` del checkout + ALLOW_WOMPI_SIMULATION.
 */
paymentsRouter.post('/wompi/sync-transaction', requireAuth, async (request, response) => {
  try {
    const transactionId = String(
      request.body?.transactionId || request.body?.id || '',
    ).trim();
    const clientReference = String(request.body?.reference || '').trim();
    if (!transactionId && !clientReference) {
      return response.status(400).json({
        ok: false,
        error: 'Envía transactionId (?id= del redirect) y/o reference del checkout.',
      });
    }

    let reference = clientReference;
    let status = null;
    let wompiTx = null;
    let mode = 'wompi-sync';

    if (transactionId && wompiConfigured()) {
      try {
        wompiTx = await fetchWompiTransaction(transactionId);
        reference = wompiTx.reference || reference;
        status = wompiTx.status;
      } catch (error) {
        console.warn('sync-transaction: API Wompi no alcanzable:', error.message);
        if (
          process.env.ALLOW_WOMPI_SIMULATION === 'true' &&
          (clientReference || transactionId)
        ) {
          mode = 'redirect-fallback';
          status = 'APPROVED';
          if (!reference) {
            const pending = await pgPool.query(
              `SELECT referencia FROM wompi_transaccion
               WHERE id_usuario = $1 AND estado = 'PENDING'
               ORDER BY creado_en DESC LIMIT 1`,
              [request.userId],
            );
            reference = pending.rows[0]?.referencia || '';
          }
        } else {
          return response.status(503).json({
            ok: false,
            error:
              'No se pudo consultar sandbox.wompi.co. Revisa DNS/red o ALLOW_WOMPI_SIMULATION + reference.',
            detail: error.message,
          });
        }
      }
    }

    if (!reference) {
      return response.status(404).json({
        ok: false,
        error: 'Sin reference para acreditar.',
      });
    }

    if (status && status !== 'APPROVED') {
      return response.json({
        ok: true,
        credited: false,
        status,
        reference,
        transactionId: transactionId || null,
        note: `Wompi reporta ${status}; solo se acredita APPROVED.`,
      });
    }

    const result = await approveWompiDeposit({
      reference,
      userId: request.userId,
      wompiId: wompiTx?.id || transactionId || null,
      source: mode,
      raw: wompiTx || { transactionId, fallback: true },
      movementType: 'deposito_wompi',
    });

    if (!result.ok) {
      return response.status(result.status || 400).json(result);
    }

    response.json({
      ...result,
      credited: !result.duplicate,
      transactionId: transactionId || null,
      mode,
      note:
        mode === 'redirect-fallback'
          ? 'Acreditado por retorno al comercio (API sandbox no alcanzable desde el servidor).'
          : result.duplicate
            ? 'Ya estaba acreditada.'
            : 'Saldo acreditado tras confirmar APPROVED en Wompi.',
    });
  } catch (error) {
    console.error('sync-transaction:', error.message);
    response.status(error.status || 500).json({
      ok: false,
      error: error.message || 'No se pudo sincronizar con Wompi.',
    });
  }
});

paymentsRouter.post('/wompi/webhook', async (request, response) => {
  const body = request.body || {};
  const checksumHeader = request.headers['x-event-checksum'];
  const check = verifyWompiEventChecksum(body, checksumHeader);
  if (!check.ok) {
    console.warn('webhook checksum inválido', check);
    // En sandbox no tumbar el evento: loguear y seguir (a menudo el túnel/reintentos fallan).
    if (process.env.WOMPI_STRICT_WEBHOOK === 'true') {
      return response.status(401).json({ ok: false, error: 'Checksum inválido.' });
    }
  }

  const data = body?.data?.transaction || body?.transaction || {};
  const reference = data.reference;
  const status = data.status;
  if (!reference) {
    return response.status(400).json({ ok: false, error: 'Sin referencia.' });
  }

  await writeDomainEvent({
    type: 'payment.webhook.received',
    aggregate: 'wompi_transaccion',
    aggregateId: reference,
    payload: { status, raw: body },
  });

  if (status === 'APPROVED') {
    try {
      await approveWompiDeposit({
        reference,
        wompiId: data.id || null,
        source: 'webhook',
        raw: body,
        movementType: 'deposito_wompi',
      });
    } catch (error) {
      console.error('webhook error', error.message);
    }
  }

  response.json({ ok: true });
});
