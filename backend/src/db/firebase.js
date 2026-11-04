/**
 * Firebase adapter.
 * Prefer FIREBASE_CREDENTIALS_PATH (JSON service account) over inline env vars.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let firestore = null;
let mode = 'stub';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadServiceAccount() {
  const credPath =
    process.env.FIREBASE_CREDENTIALS_PATH ||
    path.resolve(__dirname, '../../secrets/firebase-adminsdk.json');

  if (fs.existsSync(credPath)) {
    const raw = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    return {
      projectId: raw.project_id,
      clientEmail: raw.client_email,
      privateKey: raw.private_key,
      source: 'file',
      path: credPath,
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey, source: 'env' };
  }
  return null;
}

export async function initFirebase() {
  const useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true';
  const account = loadServiceAccount();

  if (!account && !useEmulator) {
    mode = 'stub';
    return { ok: true, engine: 'firebase', mode };
  }

  try {
    const mod = await import('firebase-admin');
    const admin = mod.default ?? mod;
    if (!admin.apps?.length) {
      if (account) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: account.projectId,
            clientEmail: account.clientEmail,
            privateKey: account.privateKey,
          }),
        });
      } else {
        admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
      }
    }
    firestore = admin.firestore();
    mode = useEmulator ? 'emulator' : 'cloud';
    return {
      ok: true,
      engine: 'firebase',
      mode,
      projectId: account?.projectId || process.env.FIREBASE_PROJECT_ID,
      credentialsSource: account?.source || 'emulator',
    };
  } catch (error) {
    mode = 'stub';
    return { ok: false, engine: 'firebase', mode, detail: error.message };
  }
}

export async function testFirebase() {
  if (mode === 'stub' || !firestore) {
    return { ok: true, engine: 'firebase', mode: 'stub', note: 'sin credenciales; stub activo' };
  }
  try {
    await firestore.collection('_health').doc('ping').set({ at: new Date().toISOString() });
    return { ok: true, engine: 'firebase', mode };
  } catch (error) {
    return {
      ok: false,
      engine: 'firebase',
      mode,
      error: error.message,
      hint: 'Habilita Cloud Firestore en la consola Firebase del proyecto velora-betplay-660e7.',
    };
  }
}

export async function pushUserNotification(userId, notification) {
  const payload = {
    ...notification,
    userId,
    createdAt: new Date().toISOString(),
    read: false,
  };

  if (firestore && mode !== 'stub') {
    try {
      await firestore
        .collection('notifications')
        .doc(String(userId))
        .collection('items')
        .add(payload);
    } catch (error) {
      return { mode, payload, persisted: false, error: error.message };
    }
  }

  return { mode, payload, persisted: mode !== 'stub' };
}

export function getFirebaseMode() {
  return mode;
}
