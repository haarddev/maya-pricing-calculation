/**
 * Remove Demo/synthetic customers, their catalogs/templates, and dummy logs.
 * Run: npm run cleanup:demo
 */
import { prisma } from '../src/lib/prisma.js';

const DEMO_NAMES = [
  'Demo Customer - Synthetic Methods',
  'Demo Customer - Synthetic',
];

const DEMO_TEMPLATE_PREFIXES = ['Demo Price List'];

async function main() {
  const dummyLogs = await prisma.systemLog.deleteMany({ where: { isDummy: true } });
  console.log(`Deleted dummy logs: ${dummyLogs.count}`);

  const demoCustomers = await prisma.customer.findMany({
    where: { name: { in: DEMO_NAMES } },
    select: { id: true, name: true },
  });

  for (const customer of demoCustomers) {
    const catalogs = await prisma.catalog.deleteMany({ where: { customerId: customer.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log(`Deleted customer "${customer.name}" (+ ${catalogs.count} catalogs)`);
  }

  // Also catch any customer name containing "Demo" / "Synthetic"
  const extra = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: 'Demo', mode: 'insensitive' } },
        { name: { contains: 'Synthetic', mode: 'insensitive' } },
      ],
    },
  });
  for (const customer of extra) {
    const catalogs = await prisma.catalog.deleteMany({ where: { customerId: customer.id } });
    await prisma.customer.delete({ where: { id: customer.id } });
    console.log(`Deleted extra demo customer "${customer.name}" (+ ${catalogs.count} catalogs)`);
  }

  const demoTemplates = await prisma.template.findMany({
    where: {
      OR: DEMO_TEMPLATE_PREFIXES.map((p) => ({ name: { startsWith: p } })),
    },
    select: { id: true, name: true },
  });

  for (const template of demoTemplates) {
    const catalogs = await prisma.catalog.deleteMany({ where: { templateId: template.id } });
    await prisma.templateField.deleteMany({ where: { templateId: template.id } });
    await prisma.template.delete({ where: { id: template.id } });
    console.log(`Deleted template "${template.name}" (+ ${catalogs.count} catalogs)`);
  }

  // Bootstrap dummy templates from early seed
  const bootstrap = await prisma.template.findMany({
    where: {
      name: {
        in: ['Distance Pricing - Tel Aviv Routes', 'Destination & Vehicle Pricing'],
      },
    },
  });
  for (const template of bootstrap) {
    const catalogs = await prisma.catalog.deleteMany({ where: { templateId: template.id } });
    await prisma.templateField.deleteMany({ where: { templateId: template.id } });
    await prisma.template.delete({ where: { id: template.id } });
    console.log(`Deleted bootstrap template "${template.name}" (+ ${catalogs.count} catalogs)`);
  }

  const remaining = await prisma.customer.findMany({ select: { name: true, _count: { select: { catalogs: true } } } });
  console.log('\nRemaining customers:');
  for (const c of remaining) console.log(`  ${c._count.catalogs}\t${c.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
