import { mysqlPool } from '../db/mysql.js';
import { ensureMssqlSchema, getMssqlPool, sql, upsertUsuarioIdentidad } from '../db/mssql.js';
import { nextId, toPublicUser } from '../utils/authHelpers.js';
import { writeDomainEvent } from '../db/mongo.js';

/**
 * Busca o crea un usuario MySQL a partir de un perfil OAuth (Google/Microsoft).
 * No requiere SQL Server; si está disponible, registra la identidad externa.
 */
export async function upsertOAuthUser({
  provider,
  subject,
  email,
  firstName,
  lastName,
  pictureUrl,
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    const err = new Error('El proveedor OAuth no devolvió un correo.');
    err.status = 400;
    throw err;
  }

  try {
    await mysqlPool.execute(
      `ALTER TABLE perfil_cliente ADD COLUMN foto_url VARCHAR(500) NULL`,
    );
  } catch {
    /* ya existe */
  }

  const [existing] = await mysqlPool.execute(
    `SELECT u.id_usuario AS id, u.correo AS email, u.id_rol AS roleId,
            p.nombres AS firstName, p.apellidos AS lastName, p.foto_url AS avatarUrl,
            c.saldo AS balance, c.moneda AS currency
     FROM usuario u
     INNER JOIN perfil_cliente p ON p.id_usuario = u.id_usuario
     LEFT JOIN cuenta c ON c.id_usuario = u.id_usuario
     WHERE LOWER(u.correo) = ?
     LIMIT 1`,
    [normalizedEmail],
  );

  let user = existing[0];

  if (!user) {
    user = await createOAuthMysqlUser({
      email: normalizedEmail,
      firstName: firstName || 'Usuario',
      lastName: lastName || provider,
      subject,
      provider,
    });
    user.roleId = 3;
  }

  // Preferir foto de Google/Microsoft si el perfil aún no tiene una local
  const oauthPhoto = String(pictureUrl || '').trim();
  if (oauthPhoto && !user.avatarUrl) {
    await mysqlPool.execute(
      `UPDATE perfil_cliente SET foto_url = ? WHERE id_usuario = ?`,
      [oauthPhoto, user.id],
    );
    user.avatarUrl = oauthPhoto;
  }

  await linkExternalIdentity({
    userId: user.id,
    email: normalizedEmail,
    provider,
    subject,
  });

  await writeDomainEvent({
    type: 'auth.oauth.login',
    aggregate: 'usuario',
    aggregateId: user.id,
    actorId: user.id,
    payload: { provider, subject, email: normalizedEmail },
  });

  return toPublicUser(user);
}

async function createOAuthMysqlUser({ email, firstName, lastName, subject, provider }) {
  const connection = await mysqlPool.getConnection();
  try {
    await connection.beginTransaction();

    const [cities] = await connection.execute(
      'SELECT id_ciudad AS id FROM ciudad ORDER BY id_ciudad LIMIT 1',
    );
    const [docTypes] = await connection.execute(
      'SELECT id_tipo_documento AS id FROM tipo_documento ORDER BY id_tipo_documento LIMIT 1',
    );
    if (!cities[0] || !docTypes[0]) {
      throw new Error('Faltan catálogos ciudad/tipo_documento para crear usuario OAuth.');
    }

    const userId = await nextId(connection, 'usuario', 'id_usuario');
    const profileId = await nextId(connection, 'perfil_cliente', 'id_perfil');
    const accountId = await nextId(connection, 'cuenta', 'id_cuenta');
    const docNumber = `OAUTH${String(subject).replace(/\W/g, '').slice(-12) || userId}`;

    await connection.execute(
      `INSERT INTO usuario (
          id_usuario, id_empresa, id_rol, id_estado_usuario,
          correo, hash_contrasena, fecha_registro, ultimo_acceso
       ) VALUES (?, 1, 3, 1, ?, ?, NOW(), NOW())`,
      [userId, email, `oauth:${provider}:${providerSafe(subject)}`],
    );

    await connection.execute(
      `INSERT INTO perfil_cliente (
          id_perfil, id_usuario, id_ciudad, id_tipo_documento,
          nombres, apellidos, telefono, numero_documento, fecha_nacimiento
       ) VALUES (?, ?, ?, ?, ?, ?, '3000000000', ?, '1990-01-01')`,
      [
        profileId,
        userId,
        cities[0].id,
        docTypes[0].id,
        firstName.slice(0, 80),
        lastName.slice(0, 80),
        docNumber.slice(0, 20),
      ],
    );

    await connection.execute(
      `INSERT INTO cuenta (
          id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura
       ) VALUES (?, ?, 0, 'COP', 0, NOW())`,
      [accountId, userId],
    );

    await connection.commit();
    return {
      id: userId,
      email,
      firstName,
      lastName,
      balance: 0,
      currency: 'COP',
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function providerSafe(subject) {
  return String(subject || 'user').slice(0, 40);
}

async function linkExternalIdentity({ userId, email, provider, subject }) {
  try {
    await ensureMssqlSchema();
    await upsertUsuarioIdentidad({
      userId,
      email,
      passwordHash: `oauth:${provider}`,
      roleId: 3,
      estado: 'activo',
    });
    const pool = await getMssqlPool();
    await pool
      .request()
      .input('id', sql.Int, userId)
      .input('prov', sql.NVarChar(40), provider)
      .input('sub', sql.NVarChar(200), subject)
      .input('email', sql.NVarChar(120), email)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM identidad_externa WHERE proveedor=@prov AND subject=@sub)
          INSERT INTO identidad_externa (id_usuario, proveedor, subject, email)
          VALUES (@id, @prov, @sub, @email);
      `);
  } catch (error) {
    console.warn('SQL Server identidad_externa:', error.message);
  }
}
