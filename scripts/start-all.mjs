/**
 * Levanta el stack completo de Velora:
 *   1) Docker (mysql, postgres, mongo, mssql)
 *   2) Backend :4000 + Frontend :5173
 *   3) Túneles Tunnelmole (API + WEB)
 *
 * Uso (raíz del repo):
 *   npm run up
 *
 * Solo local (sin túneles / sin docker):
 *   npm run dev
 */
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
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
    out[key] = value;
    if (!(key in process.env)) process.env[key] = value;
  }
  return out;
}

function upsertEnvKey(filePath, key, value) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, `${key}=${value}\n`, 'utf8');
    return;
  }
  let text = fs.readFileSync(filePath, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(text)) {
    text = text.replace(re, `${key}=${value}`);
  } else {
    text = `${text.trimEnd()}\n${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, text, 'utf8');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function tryDockerPath() {
  const candidates = [
    process.env.DOCKER_BIN,
    'C:\\Users\\Diego\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin',
    'C:\\Program Files\\Docker\\Docker\\resources\\bin',
  ].filter(Boolean);
  for (const dir of candidates) {
    const exe = path.join(dir, isWin ? 'docker.exe' : 'docker');
    if (fs.existsSync(exe)) return { dir, exe };
  }
  return { dir: '', exe: 'docker' };
}

async function ensureDocker() {
  const { dir, exe } = tryDockerPath();
  if (dir) {
    process.env.Path = `${dir}${path.delimiter}${process.env.Path || ''}`;
  }

  const check = () => {
    try {
      execSync(`"${exe}" info`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  };

  if (!check()) {
    console.log('[up] Docker no responde. Intentando abrir Docker Desktop…');
    const desktop = [
      'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
      'C:\\Users\\Diego\\AppData\\Local\\Programs\\DockerDesktop\\Docker Desktop.exe',
    ].find((p) => fs.existsSync(p));
    if (desktop && isWin) {
      spawn(desktop, [], { detached: true, stdio: 'ignore' }).unref();
    }
    for (let i = 0; i < 36; i++) {
      await sleep(5000);
      process.stdout.write(`[up] esperando Docker… (${i + 1}/36)\n`);
      if (check()) break;
    }
  }

  if (!check()) {
    console.warn('[up] Docker no disponible. Continúo con API/front/túneles (MySQL local si aplica).');
    return false;
  }

  console.log('[up] docker compose up -d mysql postgres mongo mssql');
  try {
    execSync(`"${exe}" compose up -d mysql postgres mongo mssql`, {
      cwd: root,
      stdio: 'inherit',
    });
    return true;
  } catch (error) {
    console.warn('[up] docker compose falló:', error.message);
    return false;
  }
}

function killPort(port) {
  if (!isWin) return;
  try {
    const out = execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
      { encoding: 'utf8' },
    );
    for (const line of out.split(/\r?\n/)) {
      const pid = Number(String(line).trim());
      if (pid > 0) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

function startTmole(port, label, onUrl) {
  const tmoleEntry = path.join(root, 'node_modules', 'tunnelmole', 'dist', 'bin', 'tunnelmole.js');
  if (!fs.existsSync(tmoleEntry)) {
    console.error('[up] Falta tunnelmole. Ejecuta npm install en la raíz.');
    process.exit(1);
  }
  const domain =
    label === 'api'
      ? process.env.TMOLE_API_DOMAIN
      : process.env.TMOLE_WEB_DOMAIN;
  const args = domain ? [String(port), 'as', domain] : [String(port)];
  const child = spawn(process.execPath, [tmoleEntry, ...args], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  const handle = (buf) => {
    const text = buf.toString();
    process.stdout.write(`[tmole-${label}] ${text}`);
    const match = text.match(/https:\/\/[a-z0-9.-]+\.tunnelmole\.net/i);
    if (match) onUrl(match[0].replace(/\/$/, ''));
  };
  child.stdout.on('data', handle);
  child.stderr.on('data', handle);
  child.on('exit', (code) => {
    console.warn(`[tmole-${label}] salió con código ${code}`);
  });
  return child;
}

async function main() {
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, 'backend', '.env'));

  console.log('\n=== Velora · npm run up ===\n');
  await ensureDocker();

  console.log('[up] liberando puertos 4000 / 5173…');
  killPort(4000);
  killPort(5173);
  await sleep(1500);

  const children = [];
  const urls = { api: '', web: '' };

  console.log('[up] backend…');
  children.push(
    spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev'], {
      cwd: path.join(root, 'backend'),
      shell: true,
      stdio: 'inherit',
      env: process.env,
    }),
  );

  console.log('[up] frontend…');
  children.push(
    spawn(isWin ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host'], {
      cwd: path.join(root, 'frontend'),
      shell: true,
      stdio: 'inherit',
      env: process.env,
    }),
  );

  // Esperar a que la API escuche :4000 antes del túnel (si no, tmole sale).
  for (let i = 0; i < 30; i++) {
    try {
      execSync(
        isWin
          ? `powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 4000 -State Listen -EA SilentlyContinue) { exit 0 } else { exit 1 }"`
          : 'curl -sf http://127.0.0.1:4000/api/health',
        { stdio: 'ignore' },
      );
      console.log('[up] API lista en :4000');
      break;
    } catch {
      await sleep(1000);
    }
  }

  const applyUrls = () => {
    if (!urls.api && !urls.web) return;
    const lines = [
      'Velora — URLs públicas (esta sesión)',
      '',
      urls.api ? `API:  ${urls.api}` : 'API:  (pendiente)',
      urls.web ? `WEB:  ${urls.web}` : 'WEB:  (pendiente)',
      '',
      'Wompi URL de eventos:',
      urls.api
        ? `  ${urls.api}/api/payments/wompi/webhook`
        : '  (espera túnel API)',
      '',
      'Wompi redirect post-pago:',
      urls.web ? `  ${urls.web}/billetera` : '  (espera túnel WEB)',
      '',
      'Local:',
      '  http://localhost:5173',
      '  http://localhost:4000/api/docs',
      '',
    ];
    const text = lines.join('\n');
    fs.writeFileSync(path.join(root, '.public-urls.txt'), text, 'utf8');
    console.log(`\n${text}`);

    if (urls.web) {
      upsertEnvKey(path.join(root, 'backend', '.env'), 'WOMPI_REDIRECT_URL', `${urls.web}/billetera`);
      upsertEnvKey(path.join(root, 'backend', '.env'), 'PUBLIC_FRONTEND_ORIGIN', urls.web);
      upsertEnvKey(path.join(root, 'frontend', '.env'), 'VITE_PUBLIC_ORIGIN', urls.web);
    }
  };

  console.log('[up] túneles Tunnelmole…');
  children.push(
    startTmole(4000, 'api', (url) => {
      urls.api = url;
      applyUrls();
    }),
  );
  children.push(
    startTmole(5173, 'web', (url) => {
      urls.web = url;
      applyUrls();
    }),
  );

  const shutdown = () => {
    for (const child of children) {
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
