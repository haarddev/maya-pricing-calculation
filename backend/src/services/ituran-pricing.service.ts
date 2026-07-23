import { PricingMethod } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';
import { KIVUNIM_CUSTOMER_NAME, MOD_CUSTOMER_NAME } from '../constants/customers.js';
import {
  linePriceCandidates,
  matchModLines,
  MOD_HIGHWAY_6_FEE,
} from '../data/mod-masha-price-list.data.js';
import { calculateTripPrice } from './pricing.service.js';
import {
  getVehicleTripsForDate,
  type IturanTrip,
} from './ituran.service.js';

const VEHICLE_TYPES = ['Bus', 'Minibus', 'Van'] as const;

const tripRowSchema = z.object({
  travel_code: z.string().min(1),
  date: z.string().min(1),
  start_time: z.string().optional(),
  driver_name: z.string().min(1),
  vehicle_number: z.string().min(1),
  billed_total: z.number().optional(),
  description: z.string().optional(),
  /** Excel "משך הנסיעה" e.g. 2:00:00 */
  duration: z.string().optional(),
});

const verifySchema = z.object({
  customer_id: z.string().uuid().optional(),
  /** Optional override for PRICE_BY_ROUTE lookups (defaults to Kivunim). */
  route_customer_id: z.string().uuid().optional(),
  trips: z.array(tripRowSchema).min(1),
});

export type VerifyTripInput = z.infer<typeof tripRowSchema>;
export type VerifyTripsInput = z.infer<typeof verifySchema>;

export type VehiclePriceResult = {
  vehicle_type: (typeof VEHICLE_TYPES)[number];
  total_price: number | null;
  catalog_name: string | null;
  error: string | null;
};

export type MethodPriceGroup = {
  key: string;
  pricing_method: PricingMethod;
  label: string;
  inputs: Record<string, string | number | null>;
  customer_id: string;
  prices: VehiclePriceResult[];
  /** Closest |engine − billed| when billed_total is present */
  closest_delta: number | null;
  matched_billed: boolean;
};

export type VerifiedTripResult = {
  travel_code: string;
  date: string;
  start_time: string | null;
  driver_name: string;
  vehicle_number: string;
  description: string | null;
  duration: string | null;
  billed_total: number | null;
  ituran_from: string | null;
  ituran_to: string | null;
  ituran_trip_count: number;
  matched: boolean;
  match_error: string | null;
  matched_trip: {
    trip_id: number;
    driver_name: string | null;
    distance: number;
    idle_mins: number;
    duration_second: number | null;
    start_timestamp: string | null;
  } | null;
  km: number | null;
  /** Idle hours (Ituran idle_mins / 60) — used by km+hours */
  hours: number | null;
  excel_hours: number | null;
  ituran_hours: number | null;
  /** @deprecated Prefer method_prices; kept as KM_AND_HOURS (idle) for UI compat */
  prices: VehiclePriceResult[];
  method_prices: MethodPriceGroup[];
  /** Best method group vs Excel billed (smallest delta), if any prices exist */
  best_method: MethodPriceGroup | null;
};

const BILLED_TOLERANCE = 0.5;

function normalizeDriverName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/["'`״׳]/g, '')
    .replace(/\s+/g, ' ');
}

function nameVariants(raw: string): string[] {
  const normalized = normalizeDriverName(raw);
  if (!normalized) return [];
  const parts = normalized.split(' ').filter(Boolean);
  const variants = new Set<string>([normalized]);
  if (parts.length >= 2) {
    variants.add([...parts].reverse().join(' '));
  }
  return [...variants];
}

export function driverNamesMatch(excelName: string, ituranName: string): boolean {
  const a = nameVariants(excelName);
  const b = nameVariants(ituranName);
  if (a.length === 0 || b.length === 0) return false;

  for (const left of a) {
    for (const right of b) {
      if (left === right) return true;
      if (left.includes(right) || right.includes(left)) return true;
    }
  }

  const tokensA = new Set(normalizeDriverName(excelName).split(' ').filter(Boolean));
  const tokensB = new Set(normalizeDriverName(ituranName).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  if (tokensA.size !== tokensB.size) return false;
  for (const t of tokensA) {
    if (!tokensB.has(t)) return false;
  }
  return true;
}

function parseStartMinutes(time?: string | null): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function tripStartMinutes(trip: IturanTrip): number | null {
  const ts = trip.start_location?.timestamp;
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

export function matchIturanTrip(
  trips: IturanTrip[],
  driverName: string,
  startTime?: string | null,
): IturanTrip | null {
  const byDriver = trips.filter(
    (trip) => typeof trip.driver_name === 'string' && driverNamesMatch(driverName, trip.driver_name),
  );
  if (byDriver.length === 0) return null;
  if (byDriver.length === 1) return byDriver[0];

  const target = parseStartMinutes(startTime);
  if (target === null) return byDriver[0];

  let best = byDriver[0];
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const trip of byDriver) {
    const mins = tripStartMinutes(trip);
    if (mins === null) continue;
    const delta = Math.abs(mins - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = trip;
    }
  }
  return best;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function parseDurationHours(raw?: string | null): number | null {
  if (!raw) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(raw.trim());
  if (!m) return null;
  return round4(Number(m[1]) + Number(m[2]) / 60 + Number(m[3] ?? 0) / 3600);
}

async function resolveCustomerIdByName(name: string): Promise<string> {
  const customer = await prisma.customer.findFirst({ where: { name } });
  if (!customer) {
    throw new AppError(409, `Customer "${name}" not found. Run the seed first.`);
  }
  return customer.id;
}

async function resolvePricingCustomerId(customerId?: string): Promise<string> {
  if (customerId) return customerId;
  return resolveCustomerIdByName(MOD_CUSTOMER_NAME);
}

async function resolveRouteCustomerId(customerId?: string): Promise<string> {
  if (customerId) return customerId;
  const mod = await prisma.customer.findFirst({ where: { name: MOD_CUSTOMER_NAME } });
  if (mod) return mod.id;
  return resolveCustomerIdByName(KIVUNIM_CUSTOMER_NAME);
}

async function priceVehicles(opts: {
  customerId: string;
  travelCode: string;
  method: PricingMethod;
  values: Record<string, string | number>;
  routeName?: string;
  startTime?: string;
}): Promise<VehiclePriceResult[]> {
  const results: VehiclePriceResult[] = [];

  for (const vehicleType of VEHICLE_TYPES) {
    try {
      const priced = await calculateTripPrice(
        {
          customer_id: opts.customerId,
          pricing_method: opts.method,
          values: { ...opts.values, vehicle_type: vehicleType },
          route_name: opts.routeName,
          start_time: opts.startTime,
          vehicle_type: vehicleType,
          external_id: opts.travelCode,
          source: 'ituran-verify',
        },
        undefined,
        { log: false },
      );
      results.push({
        vehicle_type: vehicleType,
        total_price: priced.total_price,
        catalog_name: priced.catalog_name,
        error: null,
      });
    } catch (error) {
      results.push({
        vehicle_type: vehicleType,
        total_price: null,
        catalog_name: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

function summarizeGroup(
  group: Omit<MethodPriceGroup, 'closest_delta' | 'matched_billed'>,
  billedTotal: number | null | undefined,
): MethodPriceGroup {
  let closest: number | null = null;
  let matched = false;
  if (billedTotal != null) {
    for (const p of group.prices) {
      if (p.total_price == null) continue;
      const d = Math.abs(p.total_price - billedTotal);
      if (closest === null || d < closest) closest = d;
      if (d <= BILLED_TOLERANCE) matched = true;
    }
  }
  return { ...group, closest_delta: closest, matched_billed: matched };
}

export async function verifyTripsWithIturan(
  input: unknown,
): Promise<{ customer_id: string; route_customer_id: string; results: VerifiedTripResult[] }> {
  const data = verifySchema.parse(input);
  const customerId = await resolvePricingCustomerId(data.customer_id);
  const routeCustomerId = await resolveRouteCustomerId(data.route_customer_id);
  const results: VerifiedTripResult[] = [];

  for (const row of data.trips) {
    const base: VerifiedTripResult = {
      travel_code: row.travel_code,
      date: row.date,
      start_time: row.start_time ?? null,
      driver_name: row.driver_name,
      vehicle_number: row.vehicle_number,
      description: row.description ?? null,
      duration: row.duration ?? null,
      billed_total: row.billed_total ?? null,
      ituran_from: null,
      ituran_to: null,
      ituran_trip_count: 0,
      matched: false,
      match_error: null,
      matched_trip: null,
      km: null,
      hours: null,
      excel_hours: parseDurationHours(row.duration),
      ituran_hours: null,
      prices: [],
      method_prices: [],
      best_method: null,
    };

    try {
      const { from, to, trips } = await getVehicleTripsForDate(row.vehicle_number, row.date);
      base.ituran_from = from;
      base.ituran_to = to;
      base.ituran_trip_count = trips.length;

      const matched = matchIturanTrip(trips, row.driver_name, row.start_time);
      if (!matched) {
        base.match_error = `No Ituran trip matched driver "${row.driver_name}" among ${trips.length} trips`;
        results.push(base);
        continue;
      }

      const distance = typeof matched.distance === 'number' ? matched.distance : 0;
      const idleMins = typeof matched.idle_mins === 'number' ? matched.idle_mins : 0;
      const idleHours = round4(idleMins / 60);
      const ituranHours =
        typeof matched.duration_second === 'number'
          ? round4(matched.duration_second / 3600)
          : null;
      const excelHours = parseDurationHours(row.duration);

      base.matched = true;
      base.km = distance;
      base.hours = idleHours;
      base.excel_hours = excelHours;
      base.ituran_hours = ituranHours;
      base.matched_trip = {
        trip_id: matched.trip_id,
        driver_name: matched.driver_name ?? null,
        distance,
        idle_mins: idleMins,
        duration_second:
          typeof matched.duration_second === 'number' ? matched.duration_second : null,
        start_timestamp: matched.start_location?.timestamp ?? null,
      };

      const groups: MethodPriceGroup[] = [];

      // 1) MoD km + idle hours (Ituran telemetry)
      groups.push(
        summarizeGroup(
          {
            key: 'KM_HOURS_idle',
            pricing_method: PricingMethod.PRICE_BY_KM_AND_HOURS,
            label: 'MoD km + hours (Ituran distance + idle/60)',
            inputs: { km: distance, hours: idleHours, idle_mins: idleMins },
            customer_id: customerId,
            prices: await priceVehicles({
              customerId,
              travelCode: row.travel_code,
              method: PricingMethod.PRICE_BY_KM_AND_HOURS,
              values: { km: distance, hours: idleHours },
            }),
          },
          row.billed_total,
        ),
      );

      // 2) MoD Masha line prices — Hebrew description aliases → English line catalogs
      if (row.description) {
        const modLines = matchModLines(row.description);
        if (modLines.length > 0) {
          const primary = modLines[0];
          groups.push(
            summarizeGroup(
              {
                key: 'MOD_LINE_ROUTE',
                pricing_method: PricingMethod.PRICE_BY_ROUTE,
                label: `MoD line: ${primary.lineName} (${primary.vehicleLabel})`,
                inputs: {
                  route_name: primary.lineName,
                  vehicle_label: primary.vehicleLabel,
                  line_price: primary.linePrice,
                  additional_km_rate: primary.additionalKmRate,
                  highway6: MOD_HIGHWAY_6_FEE,
                },
                customer_id: routeCustomerId,
                prices: await priceVehicles({
                  customerId: routeCustomerId,
                  travelCode: row.travel_code,
                  method: PricingMethod.PRICE_BY_ROUTE,
                  values: {},
                  routeName: primary.lineName,
                }),
              },
              row.billed_total,
            ),
          );

          const formulaPrices: VehiclePriceResult[] = [];
          for (const line of modLines) {
            for (const cand of linePriceCandidates(line, distance)) {
              formulaPrices.push({
                vehicle_type: line.engineVehicle,
                total_price: cand.price,
                catalog_name: `${cand.formula} · ${cand.lineName} · ${cand.vehicleLabel}`,
                error: null,
              });
            }
          }
          groups.push(
            summarizeGroup(
              {
                key: 'MOD_LINE_FORMULAS',
                pricing_method: PricingMethod.PRICE_BY_ROUTE,
                label: 'MoD line formulas (fixed / +highway6 / +add_km×distance)',
                inputs: {
                  description: row.description,
                  distance,
                  matched_lines: modLines.map((l) => l.lineName).join(', '),
                },
                customer_id: routeCustomerId,
                prices: formulaPrices.slice(0, 9).map((p, idx) => ({
                  ...p,
                  vehicle_type: VEHICLE_TYPES[idx % VEHICLE_TYPES.length],
                })),
              },
              row.billed_total,
            ),
          );
        }
      }

      base.method_prices = groups;
      base.prices = groups.find((g) => g.key === 'KM_HOURS_idle')?.prices ?? [];

      const withPrices = groups.filter((g) => g.prices.some((p) => p.total_price != null));
      if (row.billed_total != null) {
        base.best_method = withPrices.sort(
          (a, b) => (a.closest_delta ?? Infinity) - (b.closest_delta ?? Infinity),
        )[0] ?? null;
      } else {
        base.best_method = withPrices[0] ?? null;
      }
    } catch (error) {
      base.match_error = error instanceof Error ? error.message : String(error);
    }

    results.push(base);
  }

  return { customer_id: customerId, route_customer_id: routeCustomerId, results };
}
