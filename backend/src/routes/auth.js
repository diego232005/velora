import { Router } from 'express';
import { pool } from '../db.js';
import {
  getAgeFromDate,
  isValidEmail,
  isValidPhone,
  nextId,
  toPublicUser,
} from '../utils/authHelpers.js';

export const authRouter = Router();
const MIN_AGE = 18;

authRouter.post('/login', async (request, response) => {
  const identifier = String(request.body?.identifier || '').trim().toLowerCase();
  const password = String(request.body?.password || '');

  if (!identifier || !password) {
    return response.status(400).json({
      ok: false,
      error: 'Escribe el correo y la contraseña.',
    });
  }

  try {
    const found = await findUserByIdentifier(identifier);

    if (!found || found.password !== password) {
      return response.status(401).json({
        ok: false,
        error: 'Correo o contraseña incorrectos.',
      });
    }

    if (String(found.status).toLowerCase() !== 'activo') {
      return response.status(403).json({
        ok: false,
        error: 'Esta cuenta está suspendida y no puede iniciar sesión.',
      });
    }

    await pool.execute(
      'UPDATE usuario SET ultimo_acceso = NOW() WHERE id_usuario = ?',
      [found.id],
    );

    return response.json({
      ok: true,
      user: toPublicUser(found),
    });
  } catch (error) {
    console.error('Error en login:', error.message);
    return response.status(500).json({
      ok: false,
      error: 'No se pudo conectar con la base de datos.',
    });
  }
});

authRouter.post('/register', async (request, response) => {
  const body = request.body || {};
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const cityId = Number(body.cityId);
  const documentTypeId = Number(body.documentTypeId);
  const documentNumber = String(body.documentNumber || '').replace(/\D/g, '');
  const birthDate = String(body.birthDate || '').trim();
  const password = String(body.password || '');
  const terms = Boolean(body.terms);
  const ofAge = Boolean(body.ofAge);

  if (!firstName || !lastName) {
    return response.status(400).json({ ok: false, error: 'Escribe nombre y apellido.' });
  }
  if (!isValidEmail(email)) {
    return response.status(400).json({ ok: false, error: 'El correo no es válido.' });
  }
  if (!isValidPhone(phone)) {
    return response.status(400).json({ ok: false, error: 'El teléfono no es válido.' });
  }
  if (!cityId || !documentTypeId || documentNumber.length < 6) {
    return response.status(400).json({
      ok: false,
      error: 'Selecciona ciudad, tipo y número de documento.',
    });
  }
  if (getAgeFromDate(birthDate) < MIN_AGE) {
    return response.status(400).json({
      ok: false,
      error: `Debes tener al menos ${MIN_AGE} años.`,
    });
  }
  if (password.length < 8) {
    return response.status(400).json({
      ok: false,
      error: 'La contraseña debe tener al menos 8 caracteres.',
    });
  }
  if (!terms || !ofAge) {
    return response.status(400).json({
      ok: false,
      error: 'Debes aceptar los términos y confirmar la mayoría de edad.',
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [emailRows] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE LOWER(correo) = ? LIMIT 1',
      [email],
    );
    if (emailRows.length) {
      await connection.rollback();
      return response.status(409).json({
        ok: false,
        error: 'Ya existe una cuenta con ese correo.',
      });
    }

    const [docRows] = await connection.execute(
      'SELECT id_perfil FROM perfil_cliente WHERE numero_documento = ? LIMIT 1',
      [documentNumber],
    );
    if (docRows.length) {
      await connection.rollback();
      return response.status(409).json({
        ok: false,
        error: 'Ya existe una cuenta con ese documento.',
      });
    }

    const [cityRows] = await connection.execute(
      'SELECT id_ciudad FROM ciudad WHERE id_ciudad = ? LIMIT 1',
      [cityId],
    );
    const [typeRows] = await connection.execute(
      'SELECT id_tipo_documento FROM tipo_documento WHERE id_tipo_documento = ? LIMIT 1',
      [documentTypeId],
    );
    if (!cityRows.length || !typeRows.length) {
      await connection.rollback();
      return response.status(400).json({
        ok: false,
        error: 'La ciudad o el tipo de documento no existen.',
      });
    }

    const userId = await nextId(connection, 'usuario', 'id_usuario');
    const profileId = await nextId(connection, 'perfil_cliente', 'id_perfil');
    const accountId = await nextId(connection, 'cuenta', 'id_cuenta');

    await connection.execute(
      `INSERT INTO usuario (
          id_usuario, id_empresa, id_rol, id_estado_usuario,
          correo, hash_contrasena, fecha_registro, ultimo_acceso
       ) VALUES (?, 1, 3, 1, ?, ?, NOW(), NOW())`,
      [userId, email, password],
    );

    await connection.execute(
      `INSERT INTO perfil_cliente (
          id_perfil, id_usuario, id_ciudad, id_tipo_documento,
          nombres, apellidos, telefono, numero_documento, fecha_nacimiento
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        userId,
        cityId,
        documentTypeId,
        firstName,
        lastName,
        phone,
        documentNumber,
        birthDate,
      ],
    );

    await connection.execute(
      `INSERT INTO cuenta (
          id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura
       ) VALUES (?, ?, 0, 'COP', 0, NOW())`,
      [accountId, userId],
    );

    await connection.commit();

    return response.status(201).json({
      ok: true,
      user: toPublicUser({
        id: userId,
        email,
        firstName,
        lastName,
        balance: 0,
        currency: 'COP',
      }),
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error en registro:', error.message);
    return response.status(500).json({
      ok: false,
      error: 'No se pudo crear la cuenta.',
    });
  } finally {
    connection.release();
  }
});

authRouter.post('/recover', async (request, response) => {
  const email = String(request.body?.email || '').trim().toLowerCase();

  if (!isValidEmail(email)) {
    return response.status(400).json({
      ok: false,
      error: 'Introduce un correo electrónico válido.',
    });
  }

  try {
    const found = await findUserByIdentifier(email);
    if (!found) {
      return response.status(404).json({
        ok: false,
        error: 'No hay una cuenta registrada con ese correo.',
      });
    }

    return response.json({
      ok: true,
      message: 'Correo encontrado. Confirma tu documento y elige una contraseña nueva.',
    });
  } catch (error) {
    console.error('Error en recuperación:', error.message);
    return response.status(500).json({
      ok: false,
      error: 'No se pudo consultar la base de datos.',
    });
  }
});

authRouter.post('/reset-password', async (request, response) => {
  const email = String(request.body?.email || '').trim().toLowerCase();
  const documentNumber = String(request.body?.documentNumber || '').replace(/\D/g, '');
  const password = String(request.body?.password || '');

  if (!isValidEmail(email) || documentNumber.length < 6) {
    return response.status(400).json({
      ok: false,
      error: 'Escribe el correo y el número de documento.',
    });
  }
  if (password.length < 8) {
    return response.status(400).json({
      ok: false,
      error: 'La contraseña nueva debe tener al menos 8 caracteres.',
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT
          u.id_usuario AS id,
          u.id_estado_usuario AS statusId,
          p.numero_documento AS documentNumber
       FROM usuario u
       INNER JOIN perfil_cliente p ON p.id_usuario = u.id_usuario
       WHERE LOWER(u.correo) = ?
       LIMIT 1`,
      [email],
    );

    const found = rows[0];
    if (!found || String(found.documentNumber) !== documentNumber) {
      return response.status(401).json({
        ok: false,
        error: 'El correo y el documento no coinciden.',
      });
    }

    if (Number(found.statusId) !== 1) {
      return response.status(403).json({
        ok: false,
        error: 'Esta cuenta está suspendida y no puede cambiar la contraseña.',
      });
    }

    await pool.execute(
      'UPDATE usuario SET hash_contrasena = ? WHERE id_usuario = ?',
      [password, found.id],
    );

    return response.json({
      ok: true,
      message: 'La contraseña se actualizó. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error.message);
    return response.status(500).json({
      ok: false,
      error: 'No se pudo actualizar la contraseña.',
    });
  }
});

async function findUserByIdentifier(identifier) {
  const [rows] = await pool.execute(
    `SELECT
        u.id_usuario AS id,
        u.correo AS email,
        u.hash_contrasena AS password,
        p.nombres AS firstName,
        p.apellidos AS lastName,
        e.nombre AS status,
        c.saldo AS balance,
        c.moneda AS currency
     FROM usuario u
     INNER JOIN perfil_cliente p ON p.id_usuario = u.id_usuario
     INNER JOIN estado_usuario e ON e.id_estado_usuario = u.id_estado_usuario
     LEFT JOIN cuenta c ON c.id_usuario = u.id_usuario
     WHERE LOWER(u.correo) = ?
        OR LOWER(SUBSTRING_INDEX(u.correo, '@', 1)) = ?
     LIMIT 1`,
    [identifier, identifier],
  );
  return rows[0] || null;
}
