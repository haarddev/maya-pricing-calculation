/**
 * Validates every synthetic pricing-method fixture against the engine.
 * Run: npm run validate:synthetic
 */
import { PricingMethod } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import {
  listPricingMethods,
  validateAllSyntheticReports,
  validateMethodReport,
} from '../src/services/pricing.service.js';

async function main() {
  const arg = process.argv[2];

  if (arg && Object.values(PricingMethod).includes(arg as PricingMethod)) {
    const result = await validateMethodReport(arg as PricingMethod);
    console.log(`\n${arg}`);
    console.log(`  matched ${result.summary.matched}/${result.summary.covered}, custom ${result.summary.custom}, mismatched ${result.summary.mismatched}`);
    if (result.summary.mismatched > 0) {
      for (const t of result.trips.filter((r) => r.status === 'mismatch')) {
        console.log(`  FAIL ${t.date} ${t.description}: billed=${t.billedPrice} engine=${t.enginePrice}`);
      }
      process.exit(1);
    }
    process.exit(0);
  }

  console.log('Available methods:', listPricingMethods().map((m) => m.method).join(', '));
  console.log('\nValidating all synthetic fixtures...\n');

  const results = await validateAllSyntheticReports();
  let failed = 0;

  for (const r of results) {
    const ok = r.summary.mismatched === 0;
    if (!ok) failed += 1;
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(
      `${mark} ${r.method.padEnd(24)} matched ${r.summary.matched}/${r.summary.covered}  custom ${r.summary.custom}  mismatched ${r.summary.mismatched}`,
    );
    if (!ok) {
      for (const t of r.trips.filter((row) => row.status === 'mismatch')) {
        console.log(`       ${t.date} ${t.description}: billed=${t.billedPrice} engine=${t.enginePrice}`);
      }
    }
  }

  console.log(failed === 0 ? '\nAll synthetic methods passed.' : `\n${failed} method(s) failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
