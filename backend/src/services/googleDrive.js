import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function credentialsPath() {
  return (
    process.env.FIREBASE_CREDENTIALS_PATH ||
    path.resolve(__dirname, '../../secrets/firebase-adminsdk.json')
  );
}

export async function listDriveFolderFiles({ folderId, nameContains }) {
  if (!folderId) {
    const err = new Error('GOOGLE_DRIVE_FOLDER_ID ausente');
    err.status = 503;
    throw err;
  }

  const nameFilter = nameContains
    ? ` and name contains '${String(nameContains).replace(/'/g, "\\'")}'`
    : '';
  const q = `'${folderId}' in parents and trashed=false${nameFilter}`;
  const fields = 'files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,modifiedTime)';

  // 1) Service account (carpeta compartida con el SA)
  const credFile = credentialsPath();
  if (fs.existsSync(credFile)) {
    try {
      const auth = new GoogleAuth({
        keyFile: credFile,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', q);
      url.searchParams.set('fields', fields);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken.token || accessToken}` },
      });
      const data = await res.json();
      if (!data.error) {
        return { source: 'service-account', files: data.files || [] };
      }
      return {
        source: 'service-account',
        files: [],
        error: data.error,
        hint: `Comparte la carpeta de Drive con ${JSON.parse(fs.readFileSync(credFile, 'utf8')).client_email} (lector).`,
      };
    } catch (error) {
      // cae a API key
      var saError = error.message;
    }
  }

  // 2) API key (solo contenido público / “cualquiera con el enlace”)
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    const err = new Error(
      saError ||
        'Sin acceso a Drive. Configura service account o GOOGLE_DRIVE_API_KEY.',
    );
    err.status = 503;
    throw err;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', fields);
  url.searchParams.set('key', apiKey);
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    return { source: 'api-key', files: [], error: data.error };
  }
  return { source: 'api-key', files: data.files || [] };
}

export function mapDriveFiles(files, kind) {
  return (files || []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink || null,
    previewUrl: file.thumbnailLink || null,
    // Preferir proxy local: los thumbs de Drive fallan en <img> sin cookie
    directUrl: file.id ? `/api/drive/file/${file.id}` : null,
    modifiedTime: file.modifiedTime || null,
    kind,
  }));
}

/** Descarga bytes de un archivo Drive con service account. */
export async function downloadDriveFile(fileId) {
  const token = await getDriveAccessToken(false);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    const err = new Error(`Drive download ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get('content-type') || 'image/png';
  return { buffer, mimeType };
}

export function serviceAccountEmail() {
  try {
    const raw = JSON.parse(fs.readFileSync(credentialsPath(), 'utf8'));
    return raw.client_email || null;
  } catch {
    return null;
  }
}

async function getDriveAccessToken(write = false) {
  const credFile = credentialsPath();
  if (!fs.existsSync(credFile)) {
    const err = new Error('Falta service account (secrets/firebase-adminsdk.json).');
    err.status = 503;
    throw err;
  }
  const auth = new GoogleAuth({
    keyFile: credFile,
    scopes: [
      write
        ? 'https://www.googleapis.com/auth/drive'
        : 'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token || accessToken;
}

/** Sube un archivo a una carpeta de Drive (requiere Editor en la carpeta). */
export async function uploadDriveFile({ folderId, fileName, mimeType, buffer }) {
  if (!folderId) {
    const err = new Error('folderId de Drive ausente');
    err.status = 503;
    throw err;
  }
  const token = await getDriveAccessToken(true);
  const metadata = {
    name: fileName,
    parents: [folderId],
  };
  const boundary = `velora_${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\n\r\n`,
    ),
    Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const data = await res.json();
  if (data.error) {
    const err = new Error(data.error.message || 'No se pudo subir a Drive');
    err.status = 502;
    err.detail = data.error;
    const quota = /storageQuota|storage quota|do not have storage/i.test(
      String(data.error.message || data.error.errors?.[0]?.reason || ''),
    );
    err.hint = quota
      ? 'Service accounts no pueden crear archivos en Mi unidad (sin cuota). Usa Shared Drive o guarda en local.'
      : `Comparte la carpeta Perfil con ${serviceAccountEmail()} como Editor.`;
    throw err;
  }
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || null,
    previewUrl: data.thumbnailLink || null,
    directUrl: data.id
      ? `https://drive.google.com/thumbnail?id=${data.id}&sz=w400`
      : null,
  };
}
