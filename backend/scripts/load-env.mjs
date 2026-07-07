import { spawnSync } from 'node:child_process';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

config({ path: resolve(backendDir, '.env') });

if (!process.env.DATABASE_URL) {
  const username = process.env.DATABASE_USERNAME ?? 'postgres';
  const password = process.env.DATABASE_PASSWORD ?? '';
  const host = process.env.DATABASE_HOST ?? 'localhost';
  const port = process.env.DATABASE_PORT ?? '5432';
  const name = process.env.DATABASE_NAME ?? 'maya_pricing';

  process.env.DATABASE_URL =
    `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

const [, , ...commandParts] = process.argv;

if (commandParts.length === 0) {
  process.exit(0);
}

const result = spawnSync(commandParts[0], commandParts.slice(1), {
  cwd: backendDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

process.exit(result.status ?? 1);
