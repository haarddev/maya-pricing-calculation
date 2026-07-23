import { config } from 'dotenv';
import { z } from 'zod';

config();

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const username = process.env.DATABASE_USERNAME ?? 'postgres';
  const password = process.env.DATABASE_PASSWORD ?? '';
  const host = process.env.DATABASE_HOST ?? 'localhost';
  const port = process.env.DATABASE_PORT ?? '5432';
  const name = process.env.DATABASE_NAME ?? 'maya_pricing';

  return `postgresql://${username}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ITURAN_BASE_URL: z.string().url().default('https://api.ituran.com/api/v1'),
  ITURAN_USERNAME: z.string().optional(),
  ITURAN_PASSWORD: z.string().optional(),
  ITURAN_EXCEL_PATH: z.string().optional(),
});

const databaseUrl = buildDatabaseUrl();
process.env.DATABASE_URL = databaseUrl;

export const env = envSchema.parse({
  ...process.env,
  DATABASE_URL: databaseUrl,
});
