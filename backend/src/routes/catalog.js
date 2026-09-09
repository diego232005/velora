import { Router } from 'express';
import { pool } from '../db.js';

export const catalogRouter = Router();

catalogRouter.get('/ciudades', async (_request, response) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
          c.id_ciudad AS id,
          c.nombre,
          d.nombre AS departamento
       FROM ciudad c
       INNER JOIN departamento d ON d.id_departamento = c.id_departamento
       ORDER BY c.nombre`,
    );
    response.json({ ok: true, items: rows });
  } catch (error) {
    console.error('Error al listar ciudades:', error.message);
    response.status(500).json({ ok: false, error: 'No se pudieron cargar las ciudades.' });
  }
});

catalogRouter.get('/tipos-documento', async (_request, response) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
          id_tipo_documento AS id,
          nombre,
          codigo
       FROM tipo_documento
       ORDER BY id_tipo_documento`,
    );
    response.json({ ok: true, items: rows });
  } catch (error) {
    console.error('Error al listar documentos:', error.message);
    response.status(500).json({
      ok: false,
      error: 'No se pudieron cargar los tipos de documento.',
    });
  }
});
