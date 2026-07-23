import { LogCategory } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export type CreateLogInput = {
  category: LogCategory;
  method?: string;
  path?: string;
  statusCode?: number;
  source?: string;
  externalId?: string;
  pricingMethod?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  calculatedPrice?: number | null;
  durationMs?: number;
  errorMessage?: string;
  isDummy?: boolean;
  userId?: string;
};

export type LogFilters = {
  category?: LogCategory;
  search?: string;
  isDummy?: boolean;
  limit?: number;
};

function redactSensitive(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const record = { ...(body as Record<string, unknown>) };
  if ('password' in record) record.password = '[REDACTED]';
  if ('token' in record) record.token = '[REDACTED]';
  return record;
}

export async function createLog(input: CreateLogInput) {
  try {
    return await prisma.systemLog.create({
      data: {
        category: input.category,
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
        source: input.source,
        externalId: input.externalId,
        pricingMethod: input.pricingMethod,
        requestBody: input.requestBody ? (redactSensitive(input.requestBody) as object) : undefined,
        responseBody: input.responseBody ? (redactSensitive(input.responseBody) as object) : undefined,
        calculatedPrice: input.calculatedPrice ?? undefined,
        durationMs: input.durationMs,
        errorMessage: input.errorMessage,
        isDummy: input.isDummy ?? false,
        userId: input.userId,
      },
    });
  } catch (error) {
    console.error('Failed to write system log:', error);
    return null;
  }
}

export async function listLogs(filters: LogFilters = {}) {
  const where: {
    category?: LogCategory;
    isDummy?: boolean;
    OR?: Array<{
      path?: { contains: string; mode: 'insensitive' };
      source?: { contains: string; mode: 'insensitive' };
      externalId?: { contains: string; mode: 'insensitive' };
      pricingMethod?: { contains: string; mode: 'insensitive' };
      errorMessage?: { contains: string; mode: 'insensitive' };
    }>;
  } = {};

  if (filters.category) where.category = filters.category;
  if (filters.isDummy !== undefined) where.isDummy = filters.isDummy;

  if (filters.search) {
    where.OR = [
      { path: { contains: filters.search, mode: 'insensitive' } },
      { source: { contains: filters.search, mode: 'insensitive' } },
      { externalId: { contains: filters.search, mode: 'insensitive' } },
      { pricingMethod: { contains: filters.search, mode: 'insensitive' } },
      { errorMessage: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.systemLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 100,
  });
}

export async function getLogStats() {
  const [byCategory, pricingStats, errorCount, recentCount] = await Promise.all([
    prisma.systemLog.groupBy({
      by: ['category'],
      _count: { id: true },
    }),
    prisma.systemLog.aggregate({
      where: { category: LogCategory.PRICING_RESULT, durationMs: { not: null } },
      _avg: { durationMs: true },
      _count: { id: true },
    }),
    prisma.systemLog.count({ where: { category: LogCategory.ERROR } }),
    prisma.systemLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const categoryCounts = Object.fromEntries(
    byCategory.map((row) => [row.category, row._count.id]),
  ) as Record<LogCategory, number>;

  const incomingTotal = categoryCounts.INCOMING_REQUEST ?? 0;
  const pricingTotal = categoryCounts.PRICING_RESULT ?? 0;
  const errorTotal = errorCount;
  const successRate =
    incomingTotal > 0
      ? Math.round(((incomingTotal - errorTotal) / incomingTotal) * 100)
      : 100;

  return {
    categoryCounts,
    avgCalculationMs: Math.round(pricingStats._avg.durationMs ?? 0),
    pricingCalculations: pricingStats._count.id,
    errorCount: errorTotal,
    requestsLast24h: recentCount,
    successRate: Math.min(100, Math.max(0, successRate)),
  };
}

export async function logPricingResult(input: {
  pricingMethod: string;
  fieldValues: Record<string, unknown>;
  calculatedPrice: number | null;
  durationMs: number;
  source?: string;
  userId?: string;
}) {
  return createLog({
    category: LogCategory.PRICING_RESULT,
    pricingMethod: input.pricingMethod,
    requestBody: input.fieldValues,
    calculatedPrice: input.calculatedPrice,
    durationMs: input.durationMs,
    source: input.source ?? 'internal',
    userId: input.userId,
  });
}

export async function logError(input: {
  method?: string;
  path?: string;
  statusCode?: number;
  errorMessage: string;
  source?: string;
  userId?: string;
  durationMs?: number;
  requestBody?: unknown;
}) {
  return createLog({
    category: LogCategory.ERROR,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    errorMessage: input.errorMessage,
    source: input.source ?? 'internal',
    userId: input.userId,
    durationMs: input.durationMs,
    requestBody: input.requestBody,
  });
}
