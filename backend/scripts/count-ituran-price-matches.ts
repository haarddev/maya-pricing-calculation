/**
 * One-off: first N Excel rows → Ituran → price match vs Excel billed total.
 * Run: node scripts/load-env.mjs tsx scripts/count-ituran-price-matches.ts [count]
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import XLSX from 'xlsx';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { verifyTripsWithIturan } from '../src/services/ituran-pricing.service.js';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = Number(process.argv[2] ?? 100) || 100;
const USABLE_ONLY = process.argv.includes('--usable');
const TOLERANCE = 0.5;

const COL = {
  travelCode: 'קוד נסיעה',
  date: 'תאריך',
  startTime: 'שעת התחלה',
  driverName: 'שם הנהג',
  vehicleNumber: 'מספר הרכב',
  billedTotal: 'סה"כ ללקוח',
  description: 'תאור',
  duration: 'משך הנסיעה',
} as const;

function toNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw.replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function cell(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function almostEqual(a: number, b: number) {
  return Math.abs(a - b) <= TOLERANCE;
}

async function main() {
  const path = env.ITURAN_EXCEL_PATH ?? resolve(backendDir, 'prisma/data/ituran-mod-sample.xlsx');
  console.log(`Reading: ${path}`);
  console.log(`Limit: ${LIMIT} | price match tolerance: ±${TOLERANCE}\n`);

  const workbook = XLSX.readFile(path);
  const sheetName = workbook.SheetNames.includes('Sheet1')
    ? 'Sheet1'
    : workbook.SheetNames[0];
  const allRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });

  const mapped = allRows.map((row, index) => ({
    index,
    travel_code: cell(row, COL.travelCode) || `row-${index + 1}`,
    date: cell(row, COL.date),
    start_time: cell(row, COL.startTime) || undefined,
    driver_name: cell(row, COL.driverName),
    vehicle_number: cell(row, COL.vehicleNumber),
    billed_total: toNumber(row[COL.billedTotal]),
    description: cell(row, COL.description) || undefined,
    duration: cell(row, COL.duration) || undefined,
  }));

  const pool = USABLE_ONLY
    ? mapped.filter((t) => t.vehicle_number && t.driver_name && t.date)
    : mapped;

  const sample = pool.slice(0, LIMIT);
  console.log(
    USABLE_ONLY
      ? `Mode: first ${LIMIT} rows WITH plate+driver+date`
      : `Mode: first ${LIMIT} rows as-is`,
  );

  const skipped = sample.filter(
    (t) => !t.vehicle_number || !t.driver_name || !t.date,
  );
  const trips = sample.filter((t) => t.vehicle_number && t.driver_name && t.date);

  console.log(
    `Calling Ituran + pricing for ${trips.length} usable rows (${skipped.length} skipped: missing plate/driver/date)...\n`,
  );

  // Process in chunks to avoid one Zod failure killing the whole run,
  // and to show progress for long Ituran calls.
  const CHUNK = 10;
  const results: Awaited<ReturnType<typeof verifyTripsWithIturan>>['results'] = [];

  for (let i = 0; i < trips.length; i += CHUNK) {
    const chunk = trips.slice(i, i + CHUNK).map(({ index: _i, ...trip }) => trip);
    console.log(`  chunk ${Math.floor(i / CHUNK) + 1}/${Math.ceil(trips.length / CHUNK)} (rows ${i + 1}-${i + chunk.length})...`);
    try {
      const { results: chunkResults } = await verifyTripsWithIturan({ trips: chunk });
      results.push(...chunkResults);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  chunk failed: ${msg.slice(0, 200)}`);
      for (const trip of chunk) {
        results.push({
          travel_code: trip.travel_code,
          date: trip.date,
          start_time: trip.start_time ?? null,
          driver_name: trip.driver_name,
          vehicle_number: trip.vehicle_number,
          description: trip.description ?? null,
          duration: trip.duration ?? null,
          billed_total: trip.billed_total ?? null,
          ituran_from: null,
          ituran_to: null,
          ituran_trip_count: 0,
          matched: false,
          match_error: msg.slice(0, 300),
          matched_trip: null,
          km: null,
          hours: null,
          excel_hours: null,
          ituran_hours: null,
          prices: [],
          method_prices: [],
          best_method: null,
        });
      }
    }
  }

  // Count skipped as non-matches against the original 100
  const totalRows = sample.length;

  let ituranMatched = 0;
  let priceMatchedAny = 0;
  let pricedOk = 0;
  const methodMatchCounts = new Map<string, number>();
  const priceMatchDetails: Array<{
    code: string;
    method: string;
    vehicle: string;
    billed: number;
    engine: number;
  }> = [];
  const ituranFails: Array<{ code: string; err: string | null }> = [];

  for (const r of results) {
    if (r.matched) {
      ituranMatched += 1;
      if (r.method_prices?.some((g) => g.prices.some((p) => p.total_price != null))) pricedOk += 1;
    } else {
      ituranFails.push({ code: r.travel_code, err: r.match_error });
    }

    if (r.billed_total == null || !r.matched) continue;

    let any = false;
    for (const group of r.method_prices ?? []) {
      if (group.matched_billed) {
        any = true;
        methodMatchCounts.set(group.key, (methodMatchCounts.get(group.key) ?? 0) + 1);
        for (const p of group.prices) {
          if (p.total_price == null) continue;
          if (Math.abs(p.total_price - r.billed_total) > TOLERANCE) continue;
          priceMatchDetails.push({
            code: r.travel_code,
            method: group.key,
            vehicle: p.vehicle_type,
            billed: r.billed_total,
            engine: p.total_price,
          });
        }
      }
    }
    if (any) priceMatchedAny += 1;
  }

  console.log('========== SUMMARY ==========');
  console.log(`Rows in sample (first ${LIMIT}):                 ${totalRows}`);
  console.log(`Skipped (missing plate/driver/date):         ${skipped.length}`);
  console.log(`Rows sent to Ituran:                         ${trips.length}`);
  console.log(`Ituran trip matched (driver found):          ${ituranMatched}`);
  console.log(`Ituran match failed (among sent):            ${trips.length - ituranMatched}`);
  console.log(`Rows with any engine prices computed:        ${pricedOk}`);
  console.log('---');
  console.log(
    `Excel total matched by ANY method/vehicle:    ${priceMatchedAny} / ${totalRows}`,
  );
  console.log(`(Match = |engine − Excel billed| ≤ ${TOLERANCE})`);
  console.log('Matches by method:');
  for (const [k, n] of [...methodMatchCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${n}`);
  }

  if (skipped.length) {
    console.log(`\nSkipped examples (first 10):`);
    for (const s of skipped.slice(0, 10)) {
      console.log(
        `  ${s.travel_code}: plate="${s.vehicle_number}" driver="${s.driver_name}" date="${s.date}"`,
      );
    }
  }

  if (priceMatchDetails.length) {
    console.log('\nPrice match details:');
    for (const m of priceMatchDetails) {
      console.log(
        `  ${m.code}  ${m.method.padEnd(18)} ${m.vehicle.padEnd(8)} billed=${m.billed} engine=${m.engine}`,
      );
    }
  }

  if (ituranFails.length) {
    console.log(`\nIturan failures (${ituranFails.length}), first 15:`);
    for (const f of ituranFails.slice(0, 15)) {
      console.log(`  ${f.code}: ${f.err}`);
    }
  }
}

main()
  .catch((error) => {
    if (error instanceof Error) {
      console.error('FAILED:', error.message);
      console.error(error.stack);
    } else {
      console.error('FAILED:', String(error));
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
