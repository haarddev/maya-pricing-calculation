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

export async function seedDummyLogsIfNeeded() {
  const existingDummy = await prisma.systemLog.count({ where: { isDummy: true } });
  if (existingDummy > 0) return;

  const now = Date.now();
  const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000);

  const dummyLogs: CreateLogInput[] = [
    {
      category: LogCategory.INCOMING_REQUEST,
      method: 'POST',
      path: '/api/pricing/calculate',
      statusCode: 200,
      source: 'external-booking-system',
      pricingMethod: 'PRICE_BY_DESTINATION',
      requestBody: {
        pricing_method: 'price_by_destination',
        values: { destination: 'Tel Aviv', vehicle_type: 'Van' },
        quantity: 2,
      },
      responseBody: { success: true, total_price: 450 },
      calculatedPrice: 450,
      durationMs: 38,
      isDummy: true,
      createdAt: hoursAgo(2),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.INCOMING_REQUEST,
      method: 'POST',
      path: '/api/pricing/calculate',
      statusCode: 200,
      source: 'travel-portal-api',
      pricingMethod: 'PRICE_BY_DISTANCE',
      requestBody: {
        pricing_method: 'price_by_distance',
        values: { distance_km: 42, route_number: '5' },
        quantity: 1,
      },
      responseBody: { success: true, total_price: 189 },
      calculatedPrice: 189,
      durationMs: 52,
      isDummy: true,
      createdAt: hoursAgo(5),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.INCOMING_REQUEST,
      method: 'POST',
      path: '/api/pricing/calculate',
      statusCode: 400,
      source: 'mobile-app',
      pricingMethod: 'PRICE_BY_HOURS',
      requestBody: {
        pricing_method: 'price_by_hours',
        values: { hours: '' },
        quantity: 1,
      },
      responseBody: { success: false, error: 'Invalid field values' },
      durationMs: 12,
      errorMessage: 'Field "hours" is required',
      isDummy: true,
      createdAt: hoursAgo(8),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.OUTGOING_RESPONSE,
      method: 'POST',
      path: '/api/pricing/calculate',
      statusCode: 200,
      source: 'maya-pricing-engine',
      responseBody: { success: true, total_price: 450 },
      durationMs: 38,
      isDummy: true,
      createdAt: hoursAgo(2),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.OUTGOING_RESPONSE,
      method: 'POST',
      path: '/api/pricing/calculate',
      statusCode: 200,
      source: 'maya-pricing-engine',
      responseBody: { success: true, total_price: 189 },
      durationMs: 52,
      isDummy: true,
      createdAt: hoursAgo(5),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.PRICING_RESULT,
      pricingMethod: 'PRICE_BY_DESTINATION',
      source: 'external-booking-system',
      requestBody: {
        destination: 'Tel Aviv',
        vehicle_type: 'Van',
        quantity: 2,
      },
      calculatedPrice: 450,
      durationMs: 24,
      isDummy: true,
      createdAt: hoursAgo(2),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.PRICING_RESULT,
      pricingMethod: 'PRICE_BY_DISTANCE',
      source: 'travel-portal-api',
      requestBody: { distance_km: 42, route_number: '5' },
      calculatedPrice: 189,
      durationMs: 31,
      isDummy: true,
      createdAt: hoursAgo(5),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.PRICING_RESULT,
      pricingMethod: 'PRICE_BY_HOURS',
      source: 'corporate-portal',
      requestBody: { hours: 6, price_per_hour: 120 },
      calculatedPrice: 720,
      durationMs: 18,
      isDummy: true,
      createdAt: hoursAgo(12),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.EXTERNAL_CALLBACK,
      method: 'POST',
      path: 'https://partner.example.com/api/price-update',
      statusCode: 200,
      source: 'partner-booking-system',
      externalId: '12345',
      requestBody: { external_id: '12345', calculated_price: 450 },
      responseBody: { acknowledged: true, updated_at: '2026-07-06T10:30:00Z' },
      calculatedPrice: 450,
      durationMs: 145,
      isDummy: true,
      createdAt: hoursAgo(2),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.EXTERNAL_CALLBACK,
      method: 'POST',
      path: 'https://partner.example.com/api/price-update',
      statusCode: 200,
      source: 'travel-erp',
      externalId: '98765',
      requestBody: { external_id: '98765', calculated_price: 189 },
      responseBody: { acknowledged: true },
      calculatedPrice: 189,
      durationMs: 210,
      isDummy: true,
      createdAt: hoursAgo(5),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.EXTERNAL_CALLBACK,
      method: 'POST',
      path: 'https://partner.example.com/api/price-update',
      statusCode: 503,
      source: 'fleet-manager',
      externalId: '55443',
      requestBody: { external_id: '55443', calculated_price: 320 },
      responseBody: { error: 'Service temporarily unavailable' },
      calculatedPrice: 320,
      durationMs: 5020,
      errorMessage: 'External API timeout after 3 retries',
      isDummy: true,
      createdAt: hoursAgo(18),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.ERROR,
      method: 'POST',
      path: '/api/pricing/calculate',
      statusCode: 500,
      source: 'mobile-app',
      errorMessage: 'Pricing catalog not found for destination: Haifa',
      durationMs: 8,
      isDummy: true,
      createdAt: hoursAgo(20),
    } as CreateLogInput & { createdAt: Date },
    {
      category: LogCategory.ERROR,
      method: 'POST',
      path: 'https://partner.example.com/api/price-update',
      statusCode: 503,
      source: 'fleet-manager',
      externalId: '55443',
      errorMessage: 'External API timeout after 3 retries',
      durationMs: 5020,
      isDummy: true,
      createdAt: hoursAgo(18),
    } as CreateLogInput & { createdAt: Date },
  ];

  for (const log of dummyLogs) {
    const { createdAt, ...data } = log as CreateLogInput & { createdAt?: Date };
    await prisma.systemLog.create({
      data: {
        ...data,
        requestBody: data.requestBody as object | undefined,
        responseBody: data.responseBody as object | undefined,
        createdAt: createdAt ?? new Date(),
      },
    });
  }
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
