/**
 * One-off: builds the JSON used by the verification canvas.
 * Compares (1) the client's Excel price list against the seeded catalogs and
 * (2) the May monthly report against the pricing engine.
 *
 * Run: node scripts/load-env.mjs npx tsx scripts/export-verification.ts <excel-json> <out-json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import {
  calculateTripPrice,
  normalizeVehicleType,
} from '../src/services/pricing.service.js';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

type ExcelRow = {
  section: 'dedicated' | 'hops';
  routeHe: string;
  bus: number | null;
  minibus: number | null;
  van: number | null;
};

type Trip = {
  date: string;
  start_time: string | null;
  description: string;
  vehicle_type: string;
  total_before_vat: number;
};

type CatalogRow = {
  id: string;
  name: string;
  fieldValues: {
    route_name?: string;
    route_name_en?: string;
    vehicle_type?: string;
    fixed_price?: number;
    time_from?: string;
    time_to?: string;
  };
  template: { name: string };
};

const norm = (s: string) =>
  s.toLowerCase().replace(/["'`״׳]/g, '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim();

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function windowMatches(row: CatalogRow, startTime: string | null): boolean {
  const { time_from: from, time_to: to } = row.fieldValues;
  if (!from && !to) return true;
  if (!startTime) return false;
  const t = timeToMinutes(startTime);
  if (from && t < timeToMinutes(from)) return false;
  if (to && t >= timeToMinutes(to)) return false;
  return true;
}

async function main() {
  const excelRows = JSON.parse(readFileSync(process.argv[2], 'utf8')) as ExcelRow[];
  const { trips } = JSON.parse(
    readFileSync(resolve(backendDir, 'prisma/data/monthly-report-2026-05.json'), 'utf8'),
  ) as { trips: Trip[] };

  const catalogs = (await prisma.catalog.findMany({
    where: { status: CatalogStatus.ACTIVE, template: { name: { startsWith: 'Kivunim' } } },
    select: { id: true, name: true, fieldValues: true, template: { select: { name: true } } },
  })) as unknown as CatalogRow[];

  // --- Part 1: Excel price list vs seeded catalogs ---
  const sheet1 = excelRows.map((row) => {
    const isEvening = row.routeHe.includes('ואילך');
    const templateHint = row.section === 'dedicated' ? 'Dedicated' : 'Hops';

    const findDb = (vehicle: 'Bus' | 'Minibus' | 'Van') => {
      const match = catalogs.find((c) => {
        if (!c.template.name.includes(templateHint)) return false;
        if (c.fieldValues.vehicle_type !== vehicle) return false;
        const routeName = c.fieldValues.route_name ?? '';
        const excelName = norm(row.routeHe);
        if (!(excelName === norm(routeName) || excelName.includes(norm(routeName)))) return false;
        const { time_from: from, time_to: to } = c.fieldValues;
        if (from || to) return isEvening ? Boolean(from) : Boolean(to);
        return true;
      });
      return match ? { price: match.fieldValues.fixed_price ?? null, en: match.fieldValues.route_name_en ?? null } : null;
    };

    const vehicles = (['Bus', 'Minibus', 'Van'] as const).map((vehicle) => {
      const excelPrice = row[vehicle.toLowerCase() as 'bus' | 'minibus' | 'van'];
      const db = findDb(vehicle);
      return {
        vehicle,
        excel: excelPrice,
        db: db?.price ?? null,
        match:
          excelPrice === null
            ? db === null // "not offered" must also be absent in DB
            : db !== null && Math.abs((db.price ?? NaN) - excelPrice) < 0.005,
      };
    });

    const en = (['Bus', 'Minibus', 'Van'] as const)
      .map((v) => findDb(v)?.en)
      .find((e) => e) as string | null;

    return { section: row.section, routeHe: row.routeHe, routeEn: en ?? '', vehicles };
  });

  // --- Part 2: monthly report vs pricing engine ---
  const sheet2 = [] as Array<{
    date: string;
    time: string | null;
    desc: string;
    vehicleRaw: string;
    vehicle: string | null;
    billed: number;
    engine: number | null;
    catalog: string | null;
    status: 'match' | 'mismatch' | 'custom';
  }>;

  for (const trip of trips) {
    const vehicle = normalizeVehicleType(trip.vehicle_type);
    const listMatch = catalogs.find(
      (row) =>
        row.fieldValues.vehicle_type === vehicle &&
        Math.abs((row.fieldValues.fixed_price ?? NaN) - trip.total_before_vat) < 0.005 &&
        windowMatches(row, trip.start_time),
    );

    let engine: number | null = null;
    let status: 'match' | 'mismatch' | 'custom' = 'custom';
    if (listMatch) {
      try {
        const result = await calculateTripPrice({
          route_name: listMatch.fieldValues.route_name,
          vehicle_type: trip.vehicle_type,
          start_time: trip.start_time ?? undefined,
          source: 'verification-canvas',
        });
        engine = result.total_price;
        status = Math.abs(engine - trip.total_before_vat) < 0.005 ? 'match' : 'mismatch';
      } catch {
        status = 'mismatch';
      }
    }

    sheet2.push({
      date: trip.date,
      time: trip.start_time,
      desc: trip.description,
      vehicleRaw: trip.vehicle_type,
      vehicle,
      billed: trip.total_before_vat,
      engine,
      catalog: listMatch?.name ?? null,
      status,
    });
  }

  writeFileSync(process.argv[3], JSON.stringify({ sheet1, sheet2 }, null, 1), 'utf8');

  const s1Cells = sheet1.flatMap((r) => r.vehicles);
  console.log(
    `sheet1: ${sheet1.length} routes, ${s1Cells.filter((c) => c.match).length}/${s1Cells.length} cells match`,
  );
  console.log(
    `sheet2: ${sheet2.length} trips, match=${sheet2.filter((t) => t.status === 'match').length}, mismatch=${sheet2.filter((t) => t.status === 'mismatch').length}, custom=${sheet2.filter((t) => t.status === 'custom').length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
