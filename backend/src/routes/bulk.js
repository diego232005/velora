import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { buildRandomClients } from '../data/randomClients.js';
import {
  getAgeFromDate,
  isValidEmail,
  isValidPhone,
  nextId,
} from '../utils/authHelpers.js';
import { parseClientWorkbook, workbookFromRows } from '../utils/excelClients.js';

export const bulkRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

async function loadCatalogs() {
  const [cities] = await pool.execute(
    'SELECT id_ciudad AS id, nombre FROM ciudad ORDER BY nombre',
  );
  const [documentTypes] = await pool.execute(
    'SELECT id_tipo_documento AS id, nombre, codigo FROM tipo_documento',
  );
  return { cities, documentTypes };
}

function findCity(cities, name) {
  const value = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return cities.find((city) => {
    const cityName = String(city.nombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return cityName === value;
  });
}

function findDocumentType(types, value) {
  const needle = String(value || '')
    .trim()
    .toLowerCase();
  return types.find(
    (item) =>
      String(item.codigo).toLowerCase() === needle ||
      String(item.nombre).toLowerCase() === needle,
  );
}

function sendExcel(response, buffer, filename) {
  response.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return response.send(buffer);
}

bulkRouter.get('/clients/template', (_request, response) => {
  const buffer = workbookFromRows([]);
  return sendExcel(response, buffer, 'plantilla_clientes.xlsx');
});

bulkRouter.get('/clients/sample', async (_request, response) => {
  try {
    const { cities, documentTypes } = await loadCatalogs();
    const rows = buildRandomClients(cities, documentTypes, 20);
    const buffer = workbookFromRows(rows);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return sendExcel(response, buffer, `clientes_aleatorios_${stamp}.xlsx`);
  } catch (error) {
    console.error('Error al generar Excel:', error.message);
    return response.status(500).json({
      ok: false,
      error: 'No se pudo generar el Excel de ejemplo.',
    });
  }
});

bulkRouter.post('/clients', upload.single('file'), async (request, response) => {
  if (!request.file) {
    return response.status(400).json({
      ok: false,
      error: 'Adjunta un archivo Excel .xlsx',
    });
  }

  try {
    const rows = parseClientWorkbook(request.file.buffer);
    if (!rows.length) {
      return response.status(400).json({
        ok: false,
        error: 'El archivo no tiene filas de clientes.',
      });
    }
    if (rows.length > 100) {
      return response.status(400).json({
        ok: false,
        error: 'El archivo no puede tener más de 100 clientes.',
      });
    }

    const { cities, documentTypes } = await loadCatalogs();
    const created = [];
    const skipped = [];

    for (const row of rows) {
      const result = await importClientRow(row, cities, documentTypes);
      if (result.ok) {
        created.push(result);
      } else {
        skipped.push(result);
      }
    }

    return response.json({
      ok: true,
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    });
  } catch (error) {
    console.error('Error en carga masiva:', error.message);
    return response.status(500).json({
      ok: false,
      error: 'No se pudo leer o importar el Excel.',
    });
  }
});

async function importClientRow(row, cities, documentTypes) {
  if (!row.nombres || !row.apellidos) {
    return { ok: false, line: row.line, email: row.correo, error: 'Falta nombre o apellido.' };
  }
  if (!isValidEmail(row.correo)) {
    return { ok: false, line: row.line, email: row.correo, error: 'Correo inválido.' };
  }
  if (!isValidPhone(row.telefono)) {
    return { ok: false, line: row.line, email: row.correo, error: 'Teléfono inválido.' };
  }
  if (row.numero_documento.length < 6) {
    return { ok: false, line: row.line, email: row.correo, error: 'Documento inválido.' };
  }
  if (getAgeFromDate(row.fecha_nacimiento) < 18) {
    return { ok: false, line: row.line, email: row.correo, error: 'Debe ser mayor de 18 años.' };
  }
  if (row.contrasena.length < 8) {
    return { ok: false, line: row.line, email: row.correo, error: 'Contraseña muy corta.' };
  }

  const city = findCity(cities, row.ciudad);
  const documentType = findDocumentType(documentTypes, row.tipo_documento);
  if (!city) {
    return { ok: false, line: row.line, email: row.correo, error: `Ciudad no existe: ${row.ciudad}` };
  }
  if (!documentType) {
    return {
      ok: false,
      line: row.line,
      email: row.correo,
      error: `Tipo de documento no existe: ${row.tipo_documento}`,
    };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [emailRows] = await connection.execute(
      'SELECT id_usuario FROM usuario WHERE LOWER(correo) = ? LIMIT 1',
      [row.correo],
    );
    if (emailRows.length) {
      await connection.rollback();
      return { ok: false, line: row.line, email: row.correo, error: 'El correo ya está registrado.' };
    }

    const [docRows] = await connection.execute(
      'SELECT id_perfil FROM perfil_cliente WHERE numero_documento = ? LIMIT 1',
      [row.numero_documento],
    );
    if (docRows.length) {
      await connection.rollback();
      return { ok: false, line: row.line, email: row.correo, error: 'El documento ya está registrado.' };
    }

    const userId = await nextId(connection, 'usuario', 'id_usuario');
    const profileId = await nextId(connection, 'perfil_cliente', 'id_perfil');
    const accountId = await nextId(connection, 'cuenta', 'id_cuenta');

    await connection.execute(
      `INSERT INTO usuario (
          id_usuario, id_empresa, id_rol, id_estado_usuario,
          correo, hash_contrasena, fecha_registro, ultimo_acceso
       ) VALUES (?, 1, 3, 1, ?, ?, NOW(), NOW())`,
      [userId, row.correo, row.contrasena],
    );
    await connection.execute(
      `INSERT INTO perfil_cliente (
          id_perfil, id_usuario, id_ciudad, id_tipo_documento,
          nombres, apellidos, telefono, numero_documento, fecha_nacimiento
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        userId,
        city.id,
        documentType.id,
        row.nombres,
        row.apellidos,
        row.telefono,
        row.numero_documento,
        row.fecha_nacimiento,
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
      ok: true,
      line: row.line,
      email: row.correo,
      name: `${row.nombres} ${row.apellidos}`,
    };
  } catch (error) {
    await connection.rollback();
    return {
      ok: false,
      line: row.line,
      email: row.correo,
      error: error.message,
    };
  } finally {
    connection.release();
  }
}
