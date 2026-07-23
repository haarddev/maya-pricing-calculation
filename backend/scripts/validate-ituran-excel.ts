/**
 * Validates first 5 Hebrew Sheet1 rows against Ituran trips + PRICE_BY_KM_AND_HOURS.
 * Run: npm run validate:ituran
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { env } from '../src/config/env.js';
import { prisma } from '../src/lib/prisma.js';
import { verifyTripsWithIturan } from '../src/services/ituran-pricing.service.js';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

function excelPath(): string {
  if (env.ITURAN_EXCEL_PATH) return env.ITURAN_EXCEL_PATH;
  return resolve(backendDir, 'prisma/data/ituran-mod-sample.xlsx');
}

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

async function main() {
  const path = excelPath();
  console.log(`Reading: ${path}`);

  const workbook = XLSX.readFile(path);
  const sheetName = workbook.SheetNames.includes('Sheet1')
    ? 'Sheet1'
    : workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });

  const sample = rows.slice(0, 5);
  if (sample.length === 0) {
    console.error('No rows found in Sheet1');
    process.exit(1);
  }

  console.log(`Sheet: ${sheetName} | verifying first ${sample.length} rows\n`);

  const trips = sample.map((row) => ({
    travel_code: cell(row, COL.travelCode) || 'unknown',
    date: cell(row, COL.date),
    start_time: cell(row, COL.startTime) || undefined,
    driver_name: cell(row, COL.driverName),
    vehicle_number: cell(row, COL.vehicleNumber),
    billed_total: toNumber(row[COL.billedTotal]),
    description: cell(row, COL.description) || undefined,
    duration: cell(row, COL.duration) || undefined,
  }));

  const { customer_id, results } = await verifyTripsWithIturan({ trips });

  console.log(`Customer ID: ${customer_id}\n`);

  for (const r of results) {
    console.log('─'.repeat(72));
    console.log(
      `#${r.travel_code}  plate=${r.vehicle_number}  date=${r.date}  start=${r.start_time ?? '—'}`,
    );
    console.log(`  Excel driver: ${r.driver_name}`);
    if (r.description) console.log(`  Desc: ${r.description}`);
    if (r.duration) console.log(`  Duration: ${r.duration} (excel_hours=${r.excel_hours})`);
    console.log(`  Excel billed: ${r.billed_total ?? '—'}`);
    console.log(`  Ituran window: ${r.ituran_from ?? '—'} → ${r.ituran_to ?? '—'} (${r.ituran_trip_count} trips)`);

    if (!r.matched) {
      console.log(`  MATCH FAIL: ${r.match_error}`);
      continue;
    }

    const m = r.matched_trip!;
    console.log(
      `  MATCHED trip_id=${m.trip_id} driver="${m.driver_name}" distance=${m.distance}km idle=${m.idle_mins}min ituran_h=${r.ituran_hours}`,
    );

    for (const group of r.method_prices) {
      const ok = group.prices.filter((p) => p.total_price != null).length;
      console.log(
        `  [${group.key}] ${group.label}  priced=${ok}/3  Δ=${group.closest_delta ?? '—'} matched_billed=${group.matched_billed}`,
      );
      for (const p of group.prices) {
        if (p.error && !p.total_price) {
          // keep quiet for expected no-route errors unless all failed
          continue;
        }
        if (p.total_price != null) {
          console.log(`     ${p.vehicle_type.padEnd(8)} ${String(p.total_price).padStart(10)}  [${p.catalog_name}]`);
        }
      }
    }

    if (r.best_method) {
      console.log(
        `  BEST vs Excel: ${r.best_method.key} (Δ=${r.best_method.closest_delta}) matched=${r.best_method.matched_billed}`,
      );
    }
  }

  console.log('─'.repeat(72));
  const matched = results.filter((r) => r.matched).length;
  console.log(`\nDone: ${matched}/${results.length} rows matched Ituran trips.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
