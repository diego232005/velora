import { mysqlPool } from '../db/mysql.js';

/** Requiere sesión + id_rol = 1 (admin) en MySQL. */
export async function requireAdmin(request, response, next) {
  try {
    const userId = request.userId;
    if (!userId) {
      return response.status(401).json({ ok: false, error: 'Sesión requerida.' });
    }
    const [rows] = await mysqlPool.execute(
      `SELECT id_rol FROM usuario WHERE id_usuario = ? LIMIT 1`,
      [userId],
    );
    const roleId = Number(rows[0]?.id_rol);
    if (roleId !== 1) {
      return response.status(403).json({
        ok: false,
        error: 'Solo el rol admin puede liquidar partidos.',
      });
    }
    request.roleId = roleId;
    return next();
  } catch (error) {
    return response.status(500).json({
      ok: false,
      error: error.message || 'No se pudo verificar el rol.',
    });
  }
}
