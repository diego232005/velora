/**
 * Levanta backend + frontend + túneles Tunnelmole.
 *
 * URLs fijas (recomendado para Wompi/OAuth):
 *   TMOLE_API_DOMAIN=velora-api.tunnelmole.net
 *   TMOLE_WEB_DOMAIN=velora-web.tunnelmole.net
 *
 * Sin esos dominios, Tunnelmole genera URLs aleatorias cada vez (gratis).
 * Los subdominios personalizados en el servicio hosted requieren suscripción:
 *   https://tunnelmole.com/docs/
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, '.env'));

const apiDomain = process.env.TMOLE_API_DOMAIN || '';
const webDomain = process.env.TMOLE_WEB_DOMAIN || '';
const concurrently = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'concurrently.cmd' : 'concurrently',
);

const tunnelApi = apiDomain
  ? `tmole 4000 as ${apiDomain}`
  : 'tmole 4000';
const tunnelWeb = webDomain
  ? `tmole 5173 as ${webDomain}`
  : 'tmole 5173';

const urlsPath = path.join(root, '.public-urls.txt');
const hint = [
  'Velora — túneles públicos',
  '',
  apiDomain
    ? `API fija:  https://${apiDomain}`
    : 'API: URL aleatoria (mira la salida de [tmole-api]). Para fijarla: TMOLE_API_DOMAIN en .env raíz',
  webDomain
    ? `WEB fija:  https://${webDomain}`
    : 'WEB: URL aleatoria (mira [tmole-web]). Para fijarla: TMOLE_WEB_DOMAIN en .env raíz',
  '',
  'Wompi URL de eventos (usa la API pública):',
  apiDomain
    ? `  https://${apiDomain}/api/payments/wompi/webhook`
    : '  https://<URL-API-TMOLE>/api/payments/wompi/webhook',
  '',
  'Google OAuth redirect:',
  apiDomain
    ? `  https://${apiDomain}/api/oauth/google/callback`
    : '  https://<URL-API-TMOLE>/api/oauth/google/callback',
  '',
  'Tras fijar dominios, actualiza también backend/.env:',
  '  FRONTEND_ORIGIN=https://<WEB>',
  '  GOOGLE_REDIRECT_URI=https://<API>/api/oauth/google/callback',
].join('\n');

fs.writeFileSync(urlsPath, `${hint}\n`, 'utf8');
console.log(hint);
console.log(`\n(Guardado en ${urlsPath})\n`);

const child = spawn(
  concurrently,
  [
    '-n',
    'api,web,tmole-api,tmole-web',
    '-c',
    'cyan,magenta,green,yellow',
    'npm run dev --prefix backend',
    'npm run dev --prefix frontend',
    tunnelApi,
    tunnelWeb,
  ],
  {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  },
);

child.on('exit', (code) => process.exit(code ?? 0));
