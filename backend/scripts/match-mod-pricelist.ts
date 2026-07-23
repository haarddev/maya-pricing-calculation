/**
 * Match MoD trip Excel against MoD Masha price-list lines + km/hours.
 * Run: node scripts/load-env.mjs npx tsx scripts/match-mod-pricelist.ts [limit] [--usable] [--ituran]
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';
import { env } from '../src/config/env.js';
import {
  linePriceCandidates,
  matchModLines,
  MOD_KM_HOUR_RATES,
  roundMoney,
} from '../src/data/mod-masha-price-list.data.js';
import { prisma } from '../src/lib/prisma.js';
import { getVehicleTripsForDate } from '../src/services/ituran.service.js';
import { matchIturanTrip, parseDurationHours } from '../src/services/ituran-pricing.service.js';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = Number(process.argv[2] ?? 100) || 100;
const USABLE_ONLY = process.argv.includes('--usable');
const USE_ITURAN = process.argv.includes('--ituran');
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

function cell(row: Record<string, unknown>, key: string): string {
  const v = row[key];
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function toNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw.replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

async function main() {
  const path =
    env.ITURAN_EXCEL_PATH ?? resolve(backendDir, 'prisma/data/ituran-mod-sample.xlsx');
  const workbook = XLSX.readFile(path);
  const sheet = workbook.Sheets['Sheet1'] ?? workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  const mapped = rows.map((row, index) => ({
    travel_code: cell(row, COL.travelCode) || `row-${index + 1}`,
    date: cell(row, COL.date),
    start_time: cell(row, COL.startTime) || undefined,
    driver_name: cell(row, COL.driverName),
    vehicle_number: cell(row, COL.vehicleNumber),
    billed_total: toNumber(row[COL.billedTotal]),
    description: cell(row, COL.description),
    duration: cell(row, COL.duration),
  }));

  const pool = USABLE_ONLY
    ? mapped.filter((t) => t.vehicle_number && t.driver_name && t.date && t.billed_total != null)
    : mapped.filter((t) => t.billed_total != null);

  const sample = pool.slice(0, LIMIT);
  console.log(
    `Matching ${sample.length} trips to MoD Masha price list (tolerance ±${TOLERANCE})` +
      (USE_ITURAN ? ' [with Ituran distance/idle]' : ' [Excel-only; pass --ituran for GPS]') +
      '\n',
  );

  let lineAliasHits = 0;
  let priceMatchLine = 0;
  let priceMatchKmHours = 0;
  let priceMatchAny = 0;
  const formulaHits = new Map<string, number>();
  const examples: string[] = [];

  for (let i = 0; i < sample.length; i += 1) {
    const row = sample[i];
    if ((i + 1) % 20 === 0 || i === 0) console.log(`  … ${i + 1}/${sample.length}`);

    const billed = row.billed_total!;
    const lines = matchModLines(row.description);
    if (lines.length) lineAliasHits += 1;

    let distance: number | null = null;
    let idleHours: number | null = null;
    let excelHours = parseDurationHours(row.duration);

    if (USE_ITURAN && row.vehicle_number && row.date && row.driver_name) {
      try {
        const { trips } = await getVehicleTripsForDate(row.vehicle_number, row.date);
        const matched = matchIturanTrip(trips, row.driver_name, row.start_time);
        if (matched) {
          distance = typeof matched.distance === 'number' ? matched.distance : null;
          if (typeof matched.idle_mins === 'number') {
            idleHours = roundMoney(matched.idle_mins / 60);
          }
        }
      } catch {
        // ignore Ituran errors for Excel-only style matching
      }
    }

    let matchedThis = false;

    // Line formulas
    for (const line of lines) {
      for (const cand of linePriceCandidates(line, distance)) {
        if (Math.abs(cand.price - billed) <= TOLERANCE) {
          matchedThis = true;
          priceMatchLine += 1;
          formulaHits.set(cand.formula, (formulaHits.get(cand.formula) ?? 0) + 1);
          if (examples.length < 20) {
            examples.push(
              `${row.travel_code} billed=${billed} ← ${cand.formula} ${cand.lineName}/${cand.vehicleLabel}=${cand.price} desc="${row.description.slice(0, 60)}"`,
            );
          }
        }
      }
    }

    // Km + hours (MoD rates) — prefer Excel duration hours, else idle
    const hours = excelHours ?? idleHours;
    if (hours != null && distance != null) {
      for (const rate of MOD_KM_HOUR_RATES) {
        const price = roundMoney(distance * rate.pricePerKm + hours * rate.pricePerHour);
        if (Math.abs(price - billed) <= TOLERANCE) {
          matchedThis = true;
          priceMatchKmHours += 1;
          formulaHits.set(
            `km+hours:${rate.vehicleLabel}`,
            (formulaHits.get(`km+hours:${rate.vehicleLabel}`) ?? 0) + 1,
          );
          if (examples.length < 20) {
            examples.push(
              `${row.travel_code} billed=${billed} ← km+hours ${rate.vehicleLabel}=${price} (km=${distance}, h=${hours})`,
            );
          }
        }
      }
    } else if (hours != null && distance == null) {
      // hours-only using MoD hour rate (weak)
      for (const rate of MOD_KM_HOUR_RATES) {
        const price = roundMoney(hours * rate.pricePerHour);
        if (Math.abs(price - billed) <= TOLERANCE) {
          matchedThis = true;
          priceMatchKmHours += 1;
          formulaHits.set(
            `hours-only:${rate.vehicleLabel}`,
            (formulaHits.get(`hours-only:${rate.vehicleLabel}`) ?? 0) + 1,
          );
        }
      }
    }

    if (matchedThis) priceMatchAny += 1;
    else if (lines.length && examples.length < 40) {
      // Show closest candidate for alias hits that didn't exact-match
      let best: { formula: string; price: number; delta: number; line: string } | null = null;
      for (const line of lines) {
        for (const cand of linePriceCandidates(line, distance)) {
          const delta = Math.abs(cand.price - billed);
          if (!best || delta < best.delta) {
            best = {
              formula: cand.formula,
              price: cand.price,
              delta,
              line: `${cand.lineName}/${cand.vehicleLabel}`,
            };
          }
        }
      }
      if (best) {
        examples.push(
          `CLOSE ${row.travel_code} billed=${billed} closest=${best.price} (Δ=${best.delta.toFixed(2)}) via ${best.formula} ${best.line} km=${distance ?? '—'} desc="${row.description.slice(0, 50)}"`,
        );
      }
    }
  }

  console.log('\n========== MoD PRICE LIST MATCH ==========');
  console.log(`Rows checked:                         ${sample.length}`);
  console.log(`Description matched a MoD line alias: ${lineAliasHits}`);
  console.log(`Excel total matched (any formula):    ${priceMatchAny}`);
  console.log(`  via line formulas:                  ${priceMatchLine} (counts can overlap vehicles)`);
  console.log(`  via km+hours formulas:              ${priceMatchKmHours}`);
  console.log('\nFormula hits:');
  for (const [k, n] of [...formulaHits.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n}\t${k}`);
  }
  if (examples.length) {
    console.log('\nExamples:');
    for (const e of examples) console.log(`  ${e}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
