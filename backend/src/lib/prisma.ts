import { env } from '../config/env.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});
