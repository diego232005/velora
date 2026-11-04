import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import multer from 'multer';
import {
  downloadDriveFile,
  listDriveFolderFiles,
  mapDriveFiles,
  serviceAccountEmail,
  uploadDriveFile,
} from '../services/googleDrive.js';
import { profilesFolderId, shieldsFolderId } from '../services/teamCrests.js';
import { requireAuth } from '../middleware/auth.js';
import { mysqlPool } from '../db/mysql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const profilesDir = path.resolve(__dirname, '../../uploads/profiles');
fs.mkdirSync(profilesDir, { recursive: true });

export const driveRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

const fileCache = new Map();

driveRouter.get('/file/:id', async (request, response) => {
  try {
    const fileId = String(request.params.id || '').trim();
    if (!fileId || fileId.length < 10) {
      return response.status(400).send('id inválido');
    }
    const cached = fileCache.get(fileId);
    if (cached && Date.now() - cached.at < 30 * 60_000) {
      response.setHeader('Content-Type', cached.mimeType);
      response.setHeader('Cache-Control', 'public, max-age=1800');
      return response.send(cached.buffer);
    }
    const { buffer, mimeType } = await downloadDriveFile(fileId);
    fileCache.set(fileId, { buffer, mimeType, at: Date.now() });
    response.setHeader('Content-Type', mimeType);
    response.setHeader('Cache-Control', 'public, max-age=1800');
    return response.send(buffer);
  } catch (error) {
    console.warn('drive file:', error.message);
    return response.status(error.status || 502).send('No se pudo cargar el archivo');
  }
});

driveRouter.get('/status', async (_request, response) => {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
  const apiKeyConfigured = Boolean(process.env.GOOGLE_DRIVE_API_KEY);
  const sa = serviceAccountEmail();

  let probe = null;
  if (folderId) {
    try {
      const listed = await listDriveFolderFiles({ folderId });
      probe = {
        source: listed.source,
        fileCount: listed.files?.length ?? 0,
        error: listed.error?.message || null,
        hint: listed.hint || null,
      };
    } catch (error) {
      probe = { error: error.message };
    }
  }

  response.json({
    ok: true,
    configured: Boolean(folderId) && (apiKeyConfigured || Boolean(sa)),
    folderId,
    shieldsFolderId: shieldsFolderId(),
    profilesFolderId: profilesFolderId(),
    apiKeyConfigured,
    serviceAccountEmail: sa,
    probe,
    note: sa
      ? `Comparte «Velora Betplay», «Primera A» y «Perfil» con ${sa} (Lector / Editor en Perfil).`
      : 'Configura service account o API key.',
  });
});

driveRouter.get('/assets/:kind', async (request, response) => {
  const kind = request.params.kind;
  if (!['shields', 'profiles', 'players', 'competitions', 'all'].includes(kind)) {
    return response.status(400).json({ ok: false, error: 'kind inválido.' });
  }

  const folderId =
    kind === 'shields'
      ? shieldsFolderId()
      : kind === 'profiles'
        ? profilesFolderId()
        : process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    return response.status(503).json({
      ok: false,
      error: 'Falta carpeta de Drive.',
      items: [],
    });
  }

  const nameContains =
    kind === 'players'
      ? 'jugador'
      : kind === 'competitions'
        ? 'competicion'
        : undefined;

  try {
    const listed = await listDriveFolderFiles({ folderId, nameContains });
    if (listed.error && !(listed.files || []).length) {
      return response.status(502).json({
        ok: false,
        error: listed.error.message || 'Error de Google Drive',
        detail: listed.error,
        hint:
          listed.hint ||
          `Comparte la carpeta con ${serviceAccountEmail()} como Lector.`,
        items: [],
      });
    }
    response.json({
      ok: true,
      kind,
      source: listed.source,
      items: mapDriveFiles(listed.files, kind),
    });
  } catch (error) {
    response.status(error.status || 500).json({
      ok: false,
      error: error.message,
      items: [],
    });
  }
});

driveRouter.post(
  '/profile-photo',
  requireAuth,
  upload.single('photo'),
  async (request, response) => {
    try {
      if (!request.file) {
        return response.status(400).json({
          ok: false,
          error: 'Adjunta una imagen (campo photo).',
        });
      }
      const mime = request.file.mimetype || 'image/jpeg';
      if (!mime.startsWith('image/')) {
        return response.status(400).json({
          ok: false,
          error: 'Solo se permiten imágenes.',
        });
      }
      const ext = mime.includes('png')
        ? 'png'
        : mime.includes('webp')
          ? 'webp'
          : 'jpg';
      const fileName = `user_${request.userId}_${Date.now()}.${ext}`;

      let fotoUrl = null;
      let driveFileId = null;
      let note = '';
      let driveHint = null;

      try {
        const uploaded = await uploadDriveFile({
          folderId: profilesFolderId(),
          fileName,
          mimeType: mime,
          buffer: request.file.buffer,
        });
        fotoUrl = uploaded.directUrl || uploaded.previewUrl;
        driveFileId = uploaded.id;
        note = 'Foto guardada en Drive / Perfil.';
      } catch (driveError) {
        // SA no puede crear archivos en «Mi unidad» (sin cuota), aunque sea Editor.
        // Shared Drive o OAuth de usuario serían la alternativa; en demo → disco local.
        const diskPath = path.join(profilesDir, fileName);
        fs.writeFileSync(diskPath, request.file.buffer);
        fotoUrl = `/uploads/profiles/${fileName}`;
        const msg = String(driveError.message || '');
        const noQuota =
          /storage quota|Service Accounts do not have storage/i.test(msg);
        note = noQuota
          ? 'Foto en servidor local. Drive (Mi unidad) no admite subidas con service account (sin cuota).'
          : 'Foto guardada en el servidor local (Drive no disponible).';
        driveHint = noQuota
          ? 'Los escudos se leen de Drive; las fotos de perfil se guardan en backend/uploads/profiles. Para subir a Drive haría falta un Shared Drive o OAuth del usuario.'
          : driveError.hint ||
            `Revisa acceso de ${serviceAccountEmail()} a la carpeta Perfil.`;
        console.warn('profile-photo Drive fallback:', msg);
      }

      try {
        await mysqlPool.execute(
          `ALTER TABLE perfil_cliente ADD COLUMN foto_url VARCHAR(500) NULL`,
        );
      } catch {
        /* columna ya existe */
      }
      await mysqlPool.execute(
        `UPDATE perfil_cliente SET foto_url = ? WHERE id_usuario = ?`,
        [fotoUrl, request.userId],
      );
      response.json({
        ok: true,
        avatarUrl: fotoUrl,
        driveFileId,
        note,
        hint: driveHint,
      });
    } catch (error) {
      response.status(error.status || 500).json({
        ok: false,
        error: error.message || 'No se pudo subir la foto.',
        hint: error.hint || null,
      });
    }
  },
);
