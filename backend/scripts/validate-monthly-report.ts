/**
 * CLI wrapper around the same report validation the UI uses
 * (Price Check page / GET /api/pricing/validate-report).
 *
 * Run: npm run validate:report
 */
import { prisma } from '../src/lib/prisma.js';
import { validateMonthlyReport } from '../src/services/pricing.service.js';

async function main() {
  const { source, summary, trips } = await validateMonthlyReport();

  console.log(`Report: ${source}\n`);
  console.log('================ VALIDATION SUMMARY ================');
  console.log(`Trips in report:            ${summary.total}`);
  console.log(`Covered by price list:      ${summary.covered}`);
  console.log(`Engine returned same price: ${summary.matched} / ${summary.covered}`);
  console.log(`Custom quotes (not in price list): ${summary.custom}`);

  const failures = trips.filter((t) => t.status === 'mismatch');
  if (failures.length > 0) {
    console.log(`\nMISMATCHES (${failures.length}):`);
    for (const f of failures) {
      console.log(
        `  - ${f.date} ${f.startTime} "${f.catalogName}": engine=${f.enginePrice}, billed=${f.billedPrice}`,
      );
    }
  }

  const customGroups = new Map<string, { count: number; example: string }>();
  for (const t of trips.filter((t) => t.status === 'custom')) {
    const key = `${t.billedPrice}|${t.vehicle}`;
    const entry = customGroups.get(key) ?? { count: 0, example: t.description };
    entry.count += 1;
    customGroups.set(key, entry);
  }

  if (customGroups.size > 0) {
    console.log('\nCustom-quote price points (no price list entry):');
    for (const [key, { count, example }] of [...customGroups.entries()].sort(
      (a, b) => b[1].count - a[1].count,
    )) {
      const [price, vehicle] = key.split('|');
      console.log(`  - ₪${price} x${count} (${vehicle}) e.g. ${example.slice(0, 60)}`);
    }
  }

  console.log('====================================================');
  process.exit(failures.length > 0 ? 1 : 0);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
