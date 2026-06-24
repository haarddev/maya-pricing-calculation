import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.join(root, 'backend');

function loadBackendEnv() {
  const envPath = path.join(backendDir, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  if (!process.env.DATABASE_URL) {
    const username = process.env.DATABASE_USERNAME ?? 'postgres';
    const password = process.env.DATABASE_PASSWORD ?? '';
    const host = process.env.DATABASE_HOST ?? 'localhost';
    const port = process.env.DATABASE_PORT ?? '5432';
    const name = process.env.DATABASE_NAME ?? 'maya_pricing';

    process.env.DATABASE_URL =
      `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
  }
}

loadBackendEnv();

function run(command, args, cwd = root, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
    ...options,
  });

  if (result.error?.code === 'ETIMEDOUT') {
    return 'timeout';
  }

  return result.status ?? 1;
}

function runNpm(args, cwd) {
  return run('npm', args, cwd);
}

console.log('\n[dev] Starting PostgreSQL (Docker)...\n');
const dockerStatus = run('docker', ['compose', 'up', '-d'], root, {
  timeout: 15_000,
});
if (dockerStatus === 'timeout') {
  console.warn(
    '[dev] Docker timed out after 15s. Continue only if PostgreSQL is already running locally.\n',
  );
} else if (dockerStatus !== 0) {
  console.warn(
    '[dev] Docker Compose failed. Continue only if PostgreSQL is already running locally.\n',
  );
}

console.log('\n[dev] Preparing Prisma...\n');
if (runNpm(['exec', 'prisma', 'generate'], backendDir) !== 0) {
  process.exit(1);
}
if (runNpm(['exec', 'prisma', 'migrate', 'deploy'], backendDir) !== 0) {
  console.warn(
    '[dev] Prisma migrate failed. Start PostgreSQL, then run: npm run prisma:migrate\n',
  );
}

console.log('\n[dev] Starting backend, frontend, and Prisma Studio...\n');
console.log('  Backend:       http://localhost:4000');
console.log('  Frontend:      http://localhost:5173');
console.log('  Prisma Studio: http://localhost:5555\n');

const concurrentlyBin = path.join(
  root,
  'node_modules',
  'concurrently',
  'dist',
  'bin',
  'concurrently.js',
);

const concurrently = spawn(
  process.execPath,
  [
    concurrentlyBin,
    '-n',
    'backend,frontend,prisma',
    '-c',
    'blue,green,magenta',
    'npm --prefix backend run dev',
    'npm --prefix frontend run dev',
    'npm --prefix backend run prisma:studio',
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  },
);

concurrently.on('exit', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  concurrently.kill('SIGINT');
});

process.on('SIGTERM', () => {
  concurrently.kill('SIGTERM');
});
