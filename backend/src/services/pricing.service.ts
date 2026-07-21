import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogStatus, LogCategory, PricingMethod } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import { toNumber } from '../utils/catalog-pricing.js';
import { createLog } from './log.service.js';
import { DEMO_CUSTOMER_NAME, KIVUNIM_CUSTOMER_NAME } from '../constants/customers.js';
import { requireActiveCustomer } from './customer.service.js';
import {
  SYNTHETIC_FIXTURES,
  getFixtureByMethod,
  type SyntheticTrip,
} from '../data/synthetic-price-lists.data.js';

export { DEMO_CUSTOMER_NAME, KIVUNIM_CUSTOMER_NAME };

const calculateSchema = z.object({
  /** Our internal Customer UUID — required; prices come from that customer's catalogs. */
  customer_id: z.string().uuid(),
  /** Defaults to PRICE_BY_ROUTE for backward compatibility with Kivunim. */
  pricing_method: z.nativeEnum(PricingMethod).optional().default(PricingMethod.PRICE_BY_ROUTE),
  template_id: z.string().uuid().optional(),
  /** Trip field values used for lookup / calculation. */
  values: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  // Legacy flat fields (Kivunim / Price Check page)
  route_name: z.string().optional(),
  vehicle_type: z.string().optional(),
  date: z.string().optional(),
  start_time: z
    .string()
    .regex(/^\d{1,2}:\d{2}/, 'start_time must be HH:MM')
    .optional(),
  quantity: z.number().int().positive().optional(),
  external_id: z.string().optional(),
  source: z.string().optional(),
});

export type CalculateInput = z.infer<typeof calculateSchema>;

type CatalogRow = {
  id: string;
  name: string;
  templateId: string;
  fieldValues: Record<string, unknown>;
  template: { name: string; pricingMethod: PricingMethod };
};

export function normalizeVehicleType(raw: string): string | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[-\s]*\d+$/, '')
    .trim();

  if (cleaned === 'bus' || cleaned.startsWith('אוטובוס')) return 'Bus';
  if (cleaned === 'minibus' || cleaned.startsWith('מיניבוס')) return 'Minibus';
  if (cleaned === 'van' || cleaned.startsWith('ואן')) return 'Van';
  if (cleaned === 'sedan') return 'Sedan';
  return null;
}

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/["'`״׳]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .trim();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function textFieldMatches(requested: string, stored: unknown): boolean {
  if (typeof stored !== 'string' || !stored) return false;
  const a = normalizeText(requested);
  const b = normalizeText(stored);
  return a === b || a.includes(b) || b.includes(a);
}

function timeWindowMatches(row: CatalogRow, startTime?: string): boolean {
  const from = typeof row.fieldValues.time_from === 'string' ? row.fieldValues.time_from : null;
  const to = typeof row.fieldValues.time_to === 'string' ? row.fieldValues.time_to : null;
  if (!from && !to) return true;
  if (!startTime) return false;
  const t = timeToMinutes(startTime);
  if (from && t < timeToMinutes(from)) return false;
  if (to && t >= timeToMinutes(to)) return false;
  return true;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function getValues(data: CalculateInput): Record<string, string | number | boolean> {
  const values: Record<string, string | number | boolean> = { ...(data.values ?? {}) };
  if (data.route_name) values.route_name = data.route_name;
  if (data.vehicle_type) values.vehicle_type = data.vehicle_type;
  if (data.start_time) values.start_time = data.start_time;
  return values;
}

async function loadCatalogs(
  customerId: string,
  method: PricingMethod,
  templateId?: string,
): Promise<CatalogRow[]> {
  return (await prisma.catalog.findMany({
    where: {
      status: CatalogStatus.ACTIVE,
      customerId,
      ...(templateId
        ? { templateId }
        : { template: { pricingMethod: method, status: 'ACTIVE' } }),
    },
    select: {
      id: true,
      name: true,
      templateId: true,
      fieldValues: true,
      template: { select: { name: true, pricingMethod: true } },
    },
  })) as unknown as CatalogRow[];
}

function requireVehicle(values: Record<string, string | number | boolean>): string {
  const raw = values.vehicle_type;
  if (typeof raw !== 'string' || !raw) {
    throw new AppError(400, 'vehicle_type is required');
  }
  const vehicle = normalizeVehicleType(raw);
  if (!vehicle) throw new AppError(400, `Unknown vehicle type: "${raw}"`);
  return vehicle;
}

function matchFixedPrice(
  catalogs: CatalogRow[],
  keys: Array<{ field: string; value: string }>,
): CatalogRow {
  const matches = catalogs.filter((row) =>
    keys.every(({ field, value }) => {
      if (field === 'vehicle_type') return row.fieldValues.vehicle_type === value;
      return textFieldMatches(value, row.fieldValues[field]);
    }),
  );
  if (matches.length === 0) {
    const desc = keys.map((k) => `${k.field}="${k.value}"`).join(', ');
    throw new AppError(404, `No price list entry found for ${desc}`);
  }
  return matches[0];
}

function priceFromCatalog(
  method: PricingMethod,
  match: CatalogRow,
  tripValues: Record<string, string | number | boolean>,
): number {
  switch (method) {
    case PricingMethod.PRICE_BY_DESTINATION:
    case PricingMethod.PRICE_BY_AREA:
    case PricingMethod.PRICE_BY_PASSENGERS:
    case PricingMethod.PRICE_BY_SKU: {
      const price = toNumber(match.fieldValues.price);
      if (price === null) throw new AppError(500, `Catalog "${match.name}" has no valid price`);
      return price;
    }
    case PricingMethod.PRICE_BY_ROUTE: {
      const price = toNumber(match.fieldValues.fixed_price);
      if (price === null) throw new AppError(500, `Catalog "${match.name}" has no valid price`);
      return price;
    }
    case PricingMethod.PRICE_BY_HOURS: {
      const rate = toNumber(match.fieldValues.price_per_hour);
      const hours = toNumber(tripValues.hours);
      if (rate === null) throw new AppError(500, `Catalog "${match.name}" has no hourly rate`);
      if (hours === null) throw new AppError(400, 'hours is required for PRICE_BY_HOURS');
      return roundMoney(hours * rate);
    }
    case PricingMethod.PRICE_BY_MINUTES: {
      const rate = toNumber(match.fieldValues.price_per_minute);
      const minutes = toNumber(tripValues.minutes);
      if (rate === null) throw new AppError(500, `Catalog "${match.name}" has no per-minute rate`);
      if (minutes === null) throw new AppError(400, 'minutes is required for PRICE_BY_MINUTES');
      return roundMoney(minutes * rate);
    }
    case PricingMethod.PRICE_BY_DISTANCE: {
      const rate = toNumber(match.fieldValues.price_per_km);
      const km = toNumber(tripValues.km);
      if (rate === null) throw new AppError(500, `Catalog "${match.name}" has no per-km rate`);
      if (km === null) throw new AppError(400, 'km is required for PRICE_BY_DISTANCE');
      return roundMoney(km * rate);
    }
    case PricingMethod.PRICE_BY_KM_AND_HOURS: {
      const kmRate = toNumber(match.fieldValues.price_per_km);
      const hourRate = toNumber(match.fieldValues.price_per_hour);
      const km = toNumber(tripValues.km);
      const hours = toNumber(tripValues.hours);
      if (kmRate === null || hourRate === null) {
        throw new AppError(500, `Catalog "${match.name}" is missing km/hour rates`);
      }
      if (km === null || hours === null) {
        throw new AppError(400, 'km and hours are required for PRICE_BY_KM_AND_HOURS');
      }
      return roundMoney(km * kmRate + hours * hourRate);
    }
    default:
      throw new AppError(400, `Unsupported pricing method: ${method}`);
  }
}

function findMatch(
  method: PricingMethod,
  catalogs: CatalogRow[],
  values: Record<string, string | number | boolean>,
): CatalogRow {
  switch (method) {
    case PricingMethod.PRICE_BY_ROUTE: {
      const routeName = values.route_name;
      if (typeof routeName !== 'string' || !routeName) {
        throw new AppError(400, 'route_name is required for PRICE_BY_ROUTE');
      }
      const vehicle = requireVehicle(values);
      const startTime = typeof values.start_time === 'string' ? values.start_time : undefined;

      const byRoute = catalogs.filter((row) => {
        const he = row.fieldValues.route_name;
        const en = row.fieldValues.route_name_en;
        return textFieldMatches(routeName, he) || textFieldMatches(routeName, en);
      });
      if (byRoute.length === 0) {
        throw new AppError(404, `No price list entry found for route "${routeName}"`);
      }

      const byVehicle = byRoute.filter((row) => row.fieldValues.vehicle_type === vehicle);
      if (byVehicle.length === 0) {
        throw new AppError(404, `Route "${routeName}" is not offered for vehicle type "${vehicle}"`);
      }

      const matches = byVehicle.filter((row) => timeWindowMatches(row, startTime));
      if (matches.length === 0) {
        throw new AppError(
          422,
          `Route "${routeName}" (${vehicle}) is time-dependent; provide "start_time" (HH:MM)`,
        );
      }

      const uniquePrices = new Set(matches.map((row) => toNumber(row.fieldValues.fixed_price)));
      if (uniquePrices.size > 1) {
        throw new AppError(
          422,
          `Route "${routeName}" (${vehicle}) matched ${matches.length} entries with different prices; pass "template_id"`,
        );
      }
      return matches[0];
    }

    case PricingMethod.PRICE_BY_DESTINATION: {
      const destination = values.destination;
      if (typeof destination !== 'string' || !destination) {
        throw new AppError(400, 'destination is required');
      }
      return matchFixedPrice(catalogs, [
        { field: 'destination', value: destination },
        { field: 'vehicle_type', value: requireVehicle(values) },
      ]);
    }

    case PricingMethod.PRICE_BY_AREA: {
      const area = values.area_name;
      if (typeof area !== 'string' || !area) throw new AppError(400, 'area_name is required');
      return matchFixedPrice(catalogs, [
        { field: 'area_name', value: area },
        { field: 'vehicle_type', value: requireVehicle(values) },
      ]);
    }

    case PricingMethod.PRICE_BY_PASSENGERS: {
      const tier = values.passenger_tier;
      if (typeof tier !== 'string' || !tier) throw new AppError(400, 'passenger_tier is required');
      return matchFixedPrice(catalogs, [
        { field: 'passenger_tier', value: tier },
        { field: 'vehicle_type', value: requireVehicle(values) },
      ]);
    }

    case PricingMethod.PRICE_BY_SKU: {
      const sku = values.sku;
      if (typeof sku !== 'string' || !sku) throw new AppError(400, 'sku is required');
      return matchFixedPrice(catalogs, [{ field: 'sku', value: sku }]);
    }

    case PricingMethod.PRICE_BY_HOURS:
    case PricingMethod.PRICE_BY_MINUTES:
    case PricingMethod.PRICE_BY_KM_AND_HOURS: {
      const vehicle = requireVehicle(values);
      const match = catalogs.find((row) => row.fieldValues.vehicle_type === vehicle);
      if (!match) throw new AppError(404, `No rate card found for vehicle type "${vehicle}"`);
      return match;
    }

    case PricingMethod.PRICE_BY_DISTANCE: {
      const routeNumber = values.route_number;
      if (typeof routeNumber !== 'string' && typeof routeNumber !== 'number') {
        throw new AppError(400, 'route_number is required');
      }
      return matchFixedPrice(catalogs, [{ field: 'route_number', value: String(routeNumber) }]);
    }

    default:
      throw new AppError(400, `Unsupported pricing method: ${method}`);
  }
}

export async function calculateTripPrice(
  input: unknown,
  userId?: string,
  options: { log?: boolean } = {},
) {
  const start = Date.now();
  const data = calculateSchema.parse(input);
  const customer = await requireActiveCustomer(data.customer_id);
  const method = data.pricing_method;
  const values = getValues(data);

  const catalogs = await loadCatalogs(data.customer_id, method, data.template_id);
  if (catalogs.length === 0) {
    throw new AppError(
      404,
      `No active price list entries for customer "${customer.name}" and method ${method}`,
    );
  }

  const match = findMatch(method, catalogs, values);
  const unitPrice = priceFromCatalog(method, match, values);
  const quantity = data.quantity ?? 1;

  const result = {
    customer_id: customer.id,
    customer_name: customer.name,
    catalog_id: match.id,
    catalog_name: match.name,
    template_id: match.templateId,
    template_name: match.template.name,
    pricing_method: method,
    matched_fields: match.fieldValues,
    unit_price: unitPrice,
    quantity,
    total_price: roundMoney(unitPrice * quantity),
    // Keep legacy fields for the Price Check UI / Kivunim flow
    route_name: match.fieldValues.route_name ?? null,
    route_name_en: match.fieldValues.route_name_en ?? null,
    vehicle_type:
      typeof values.vehicle_type === 'string'
        ? normalizeVehicleType(values.vehicle_type)
        : (match.fieldValues.vehicle_type ?? null),
  };

  if (options.log !== false) {
    void createLog({
      category: LogCategory.PRICING_RESULT,
      pricingMethod: method,
      source: data.source ?? 'pricing-api',
      externalId: data.external_id,
      requestBody: data,
      responseBody: result,
      calculatedPrice: result.total_price,
      durationMs: Date.now() - start,
      userId,
    });
  }

  return result;
}

export type ReportValidationRow = {
  date: string;
  startTime: string | null;
  description: string;
  vehicleRaw: string;
  vehicle: string | null;
  billedPrice: number;
  enginePrice: number | null;
  catalogName: string | null;
  status: 'match' | 'mismatch' | 'custom';
  request?: Record<string, string | number | boolean>;
};

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function getCustomerIdByName(name: string): Promise<string> {
  const customer = await prisma.customer.findFirst({ where: { name } });
  if (!customer) {
    throw new AppError(409, `Customer "${name}" not found. Run the seed first.`);
  }
  return customer.id;
}

/** Original Kivunim May 2026 validation (PRICE_BY_ROUTE). */
export async function validateMonthlyReport() {
  const fixturePath = resolve(backendDir, 'prisma/data/monthly-report-2026-05.json');
  const { source, trips } = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    source: string;
    trips: Array<{
      date: string;
      start_time: string | null;
      description: string;
      vehicle_type: string;
      total_before_vat: number;
    }>;
  };

  const customerId = await getCustomerIdByName(KIVUNIM_CUSTOMER_NAME);

  const catalogs = (await prisma.catalog.findMany({
    where: {
      status: CatalogStatus.ACTIVE,
      customerId,
      template: { name: { startsWith: 'Kivunim' } },
    },
    select: {
      id: true,
      name: true,
      templateId: true,
      fieldValues: true,
      template: { select: { name: true, pricingMethod: true } },
    },
  })) as unknown as CatalogRow[];

  if (catalogs.length === 0) {
    throw new AppError(409, 'Price list catalogs not found. Run the seed first.');
  }

  const rows: ReportValidationRow[] = [];

  for (const trip of trips) {
    const vehicle = normalizeVehicleType(trip.vehicle_type);
    const listMatch = catalogs.find(
      (row) =>
        row.fieldValues.vehicle_type === vehicle &&
        Math.abs((toNumber(row.fieldValues.fixed_price) ?? NaN) - trip.total_before_vat) < 0.005 &&
        timeWindowMatches(row, trip.start_time ?? undefined),
    );

    let enginePrice: number | null = null;
    let status: ReportValidationRow['status'] = 'custom';

    if (listMatch) {
      try {
        const result = await calculateTripPrice(
          {
            customer_id: customerId,
            pricing_method: PricingMethod.PRICE_BY_ROUTE,
            route_name: listMatch.fieldValues.route_name as string,
            vehicle_type: trip.vehicle_type,
            start_time: trip.start_time ?? undefined,
          },
          undefined,
          { log: false },
        );
        enginePrice = result.total_price;
        status = Math.abs(enginePrice - trip.total_before_vat) < 0.005 ? 'match' : 'mismatch';
      } catch {
        status = 'mismatch';
      }
    }

    rows.push({
      date: trip.date,
      startTime: trip.start_time,
      description: trip.description,
      vehicleRaw: trip.vehicle_type,
      vehicle,
      billedPrice: trip.total_before_vat,
      enginePrice,
      catalogName: listMatch?.name ?? null,
      status,
    });
  }

  return summarize(source, rows);
}

/** Validate a synthetic method fixture against the engine. */
export async function validateMethodReport(method: PricingMethod) {
  const fixture = getFixtureByMethod(method);
  if (!fixture) {
    throw new AppError(404, `No synthetic fixture for method ${method}`);
  }

  const rows: ReportValidationRow[] = [];

  for (const trip of fixture.trips) {
    rows.push(await validateSyntheticTrip(method, trip, fixture.templateName));
  }

  return summarize(fixture.templateName, rows);
}

/** Validate all synthetic methods (+ optionally list them). */
export async function validateAllSyntheticReports() {
  const results = [];
  for (const fixture of SYNTHETIC_FIXTURES) {
    results.push({
      method: fixture.method,
      templateName: fixture.templateName,
      ...(await validateMethodReport(fixture.method)),
    });
  }
  return results;
}

export function listPricingMethods() {
  return [
    {
      method: PricingMethod.PRICE_BY_ROUTE,
      label: 'Price by Route (Kivunim)',
      hasSynthetic: false,
      hasKivunim: true,
    },
    ...SYNTHETIC_FIXTURES.map((f) => ({
      method: f.method,
      label: f.templateName,
      hasSynthetic: true,
      hasKivunim: false,
    })),
  ];
}

async function validateSyntheticTrip(
  method: PricingMethod,
  trip: SyntheticTrip,
  templateName: string,
): Promise<ReportValidationRow> {
  const vehicleRaw =
    typeof trip.request.vehicle_type === 'string' ? trip.request.vehicle_type : '';
  const vehicle = vehicleRaw ? normalizeVehicleType(vehicleRaw) : null;

  if (trip.custom) {
    return {
      date: trip.date,
      startTime: trip.start_time,
      description: trip.description,
      vehicleRaw: vehicleRaw || '—',
      vehicle,
      billedPrice: trip.billed_price,
      enginePrice: null,
      catalogName: null,
      status: 'custom',
      request: trip.request,
    };
  }

  try {
    const customerId = await getCustomerIdByName(DEMO_CUSTOMER_NAME);
    const template = await prisma.template.findFirst({ where: { name: templateName } });
    const result = await calculateTripPrice(
      {
        customer_id: customerId,
        pricing_method: method,
        template_id: template?.id,
        values: trip.request,
      },
      undefined,
      { log: false },
    );

    const match = Math.abs(result.total_price - trip.billed_price) < 0.005;
    return {
      date: trip.date,
      startTime: trip.start_time,
      description: trip.description,
      vehicleRaw: vehicleRaw || '—',
      vehicle,
      billedPrice: trip.billed_price,
      enginePrice: result.total_price,
      catalogName: result.catalog_name,
      status: match ? 'match' : 'mismatch',
      request: trip.request,
    };
  } catch {
    return {
      date: trip.date,
      startTime: trip.start_time,
      description: trip.description,
      vehicleRaw: vehicleRaw || '—',
      vehicle,
      billedPrice: trip.billed_price,
      enginePrice: null,
      catalogName: null,
      status: 'mismatch',
      request: trip.request,
    };
  }
}

function summarize(source: string, rows: ReportValidationRow[]) {
  return {
    source,
    summary: {
      total: rows.length,
      covered: rows.filter((r) => r.status !== 'custom').length,
      matched: rows.filter((r) => r.status === 'match').length,
      mismatched: rows.filter((r) => r.status === 'mismatch').length,
      custom: rows.filter((r) => r.status === 'custom').length,
    },
    trips: rows,
  };
}
