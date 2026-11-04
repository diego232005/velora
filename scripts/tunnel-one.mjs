/**
 * Arranca un túnel Tunnelmole hacia api (4000) o web (5173).
 * Evita `shell: true` + rutas con espacios en Windows.
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
loadEnvFile(path.join(root, 'backend', '.env'));

const target = process.argv[2] || 'api';
const port = target === 'web' ? Number(process.env.WEB_PORT || 5173) : Number(process.env.API_PORT || 4000);
const domain =
  target === 'web'
    ? process.env.TMOLE_WEB_DOMAIN
    : process.env.TMOLE_API_DOMAIN;

const tmoleEntry = path.join(root, 'node_modules', 'tunnelmole', 'dist', 'bin', 'tunnelmole.js');
if (!fs.existsSync(tmoleEntry)) {
  console.error('No se encontró tunnelmole. Ejecuta npm install en la raíz del repo.');
  process.exit(1);
}

const args = domain ? [String(port), 'as', domain] : [String(port)];

console.log(`[tmole:${target}] puerto ${port}${domain ? ` → ${domain}` : ' (URL aleatoria)'}`);

const child = spawn(process.execPath, [tmoleEntry, ...args], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
