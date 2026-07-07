import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const clientEntry = resolve(backendDir, 'node_modules', '.prisma', 'client', 'index.js');

const result = spawnSync('node', ['scripts/load-env.mjs', 'npx', 'prisma', 'generate'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status === 0) {
  process.exit(0);
}

if (existsSync(clientEntry)) {
  console.warn(
    '[prisma] generate failed (file may be locked by a running server). Using existing Prisma client.',
  );
  process.exit(0);
}

console.error('[prisma] generate failed and no Prisma client was found.');
process.exit(result.status ?? 1);
