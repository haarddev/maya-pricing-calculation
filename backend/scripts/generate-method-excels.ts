/**
 * Generates Excel pairs (price list + trips report) for every synthetic
 * pricing method, plus writes JSON trip fixtures used by validation.
 *
 * Output folder: backend/prisma/data/synthetic-excels/
 *
 * Run: node scripts/load-env.mjs npx tsx scripts/generate-method-excels.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { SYNTHETIC_FIXTURES } from '../src/data/synthetic-price-lists.data.js';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(backendDir, 'prisma/data/synthetic-excels');

function slug(method: string) {
  return method.toLowerCase().replace(/_/g, '-');
}

function buildPriceListSheet(fixture: (typeof SYNTHETIC_FIXTURES)[number]) {
  const headers = fixture.priceListColumns.map((c) => c.header);
  const rows = fixture.priceListRows.map((row) =>
    fixture.priceListColumns.map((c) => row.fieldValues[c.key] ?? ''),
  );
  return [headers, ...rows];
}

function buildTripsSheet(fixture: (typeof SYNTHETIC_FIXTURES)[number]) {
  const headers = fixture.tripColumns.map((c) => c.header);
  const rows = fixture.trips.map((trip) =>
    fixture.tripColumns.map((c) => {
      if (c.key === 'date') return trip.date;
      if (c.key === 'start_time') return trip.start_time;
      if (c.key === 'description') return trip.description;
      if (c.key === 'billed_price') return trip.billed_price;
      return trip.request[c.key] ?? '';
    }),
  );
  return [headers, ...rows];
}

function writeWorkbook(filename: string, sheetName: string, data: unknown[][]) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const path = resolve(outDir, filename);
  XLSX.writeFile(wb, path);
  return path;
}

mkdirSync(outDir, { recursive: true });

const index: Array<{ method: string; priceList: string; trips: string }> = [];

for (const fixture of SYNTHETIC_FIXTURES) {
  const s = slug(fixture.method);
  const priceListFile = `${s}-price-list.xlsx`;
  const tripsFile = `${s}-trips-report.xlsx`;

  writeWorkbook(priceListFile, 'Price List', [
    [`${fixture.templateName} — prices excl. VAT`],
    [],
    ...buildPriceListSheet(fixture),
  ]);

  writeWorkbook(tripsFile, 'Trips Report', [
    [`Detailed trip report — ${fixture.templateName}`],
    [],
    ...buildTripsSheet(fixture),
  ]);

  // JSON fixture for tooling
  writeFileSync(
    resolve(outDir, `${s}-trips.json`),
    JSON.stringify(
      {
        source: fixture.templateName,
        method: fixture.method,
        trip_count: fixture.trips.length,
        trips: fixture.trips,
      },
      null,
      2,
    ),
    'utf8',
  );

  index.push({ method: fixture.method, priceList: priceListFile, trips: tripsFile });
  console.log(`✓ ${fixture.method}: ${priceListFile} + ${tripsFile}`);
}

writeFileSync(resolve(outDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log(`\nWrote ${index.length * 2} Excel files to ${outDir}`);
