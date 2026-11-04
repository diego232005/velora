import crypto from 'crypto';
import { pgPool } from '../db/postgres.js';
import { ensureMssqlSchema, getMssqlPool, sql, upsertUsuarioIdentidad } from '../db/mssql.js';

const sessions = new Map();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * @param {number} userId
 * @param {{ email?: string, passwordHash?: string, roleId?: number }} [identity]
 */
export function createSessionToken(userId, identity = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  sessions.set(token, { userId, expiresAt });
  persistSession(userId, token, expiresAt, identity).catch((error) => {
    console.warn('persistSession:', error.message);
  });
  return token;
}

async function persistSession(userId, token, expiresAt, identity = {}) {
  const hash = hashToken(token);
  const exp = new Date(expiresAt);

  try {
    await pgPool.query(
      `INSERT INTO sesion_app (token_hash, id_usuario, expira_en)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_hash) DO UPDATE
         SET id_usuario = EXCLUDED.id_usuario,
             expira_en = EXCLUDED.expira_en`,
      [hash, userId, exp],
    );
  } catch (error) {
    console.warn('sesion_app PostgreSQL:', error.message);
  }

  try {
    await ensureMssqlSchema();
    await upsertUsuarioIdentidad({
      userId,
      email: identity.email || `mysql-${userId}@velora.identity`,
      passwordHash: identity.passwordHash || 'mysql-mirror',
      roleId: identity.roleId || 3,
      estado: 'activo',
    });
    const pool = await getMssqlPool();
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('hash', sql.NVarChar(128), hash)
      .input('exp', sql.DateTime2, exp)
      .query(
        `INSERT INTO sesion_app (id_usuario, token_hash, expira_en)
         VALUES (@userId, @hash, @exp)`,
      );
  } catch (error) {
    console.warn('sesion_app SQL Server:', error.message);
  }
}

async function resolveSession(token) {
  if (!token) return null;

  const cached = sessions.get(token);
  if (cached) {
    if (cached.expiresAt < Date.now()) {
      sessions.delete(token);
      return null;
    }
    return cached;
  }

  // Tras reinicio del API: rehidratar desde PostgreSQL por hash
  try {
    const hash = hashToken(token);
    const result = await pgPool.query(
      `SELECT id_usuario, expira_en
       FROM sesion_app
       WHERE token_hash = $1 AND expira_en > NOW()`,
      [hash],
    );
    const row = result.rows[0];
    if (!row) return null;
    const session = {
      userId: Number(row.id_usuario),
      expiresAt: new Date(row.expira_en).getTime(),
    };
    sessions.set(token, session);
    return session;
  } catch {
    return null;
  }
}

export async function requireAuth(request, response, next) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = await resolveSession(token);
  if (!session) {
    return response.status(401).json({ ok: false, error: 'Sesión requerida.' });
  }
  request.userId = session.userId;
  request.token = token;
  return next();
}

export async function optionalAuth(request, _response, next) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = await resolveSession(token);
  if (session) {
    request.userId = session.userId;
  }
  next();
}

export function revokeToken(token) {
  sessions.delete(token);
  const hash = hashToken(token);
  pgPool
    .query(`DELETE FROM sesion_app WHERE token_hash = $1`, [hash])
    .catch(() => {});
}
