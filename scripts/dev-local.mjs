import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const concurrently = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'concurrently.cmd' : 'concurrently',
);

const child = spawn(
  concurrently,
  [
    '-n',
    'api,web',
    '-c',
    'cyan,magenta',
    'npm run dev --prefix backend',
    'npm run dev --prefix frontend',
  ],
  { cwd: root, stdio: 'inherit', shell: true },
);

child.on('exit', (code) => process.exit(code ?? 0));
