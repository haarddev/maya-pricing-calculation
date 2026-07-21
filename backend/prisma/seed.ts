import bcrypt from 'bcryptjs';
import { PrismaClient, TemplateStatus, UserRole } from '@prisma/client';
import {
  DEMO_CUSTOMER_NAME,
  KIVUNIM_CUSTOMER_NAME,
} from '../src/constants/customers.js';
import { seedDummyLogsIfNeeded } from '../src/services/log.service.js';
import { ensureSettings } from '../src/services/settings.service.js';
import { seedClientTemplates } from './seed-client-templates.js';
import { seedPriceList } from './seed-price-list.js';
import { seedSyntheticPriceLists } from './seed-synthetic-price-lists.js';

const prisma = new PrismaClient();

async function ensureCustomer(
  name: string,
  description: string,
  adminId: string,
) {
  const existing = await prisma.customer.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      name,
      description,
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@maya.local' },
    update: { role: UserRole.ADMIN, status: 'ACTIVE' },
    create: {
      email: 'admin@maya.local',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  await ensureSettings();

  const kivunimCustomer = await ensureCustomer(
    KIVUNIM_CUSTOMER_NAME,
    'Real client price lists from the Kivunim Excel (dedicated trips + hops).',
    admin.id,
  );
  const demoCustomer = await ensureCustomer(
    DEMO_CUSTOMER_NAME,
    'Demo customer owning the synthetic price lists for all other pricing methods.',
    admin.id,
  );
  console.log(`Customers ready: "${kivunimCustomer.name}", "${demoCustomer.name}"`);

  const existingTemplates = await prisma.template.count();
  if (existingTemplates === 0) {
    await prisma.template.create({
      data: {
        name: 'Distance Pricing - Tel Aviv Routes',
        description: 'Price per kilometer based on route number',
        status: TemplateStatus.ACTIVE,
        pricingMethod: 'PRICE_BY_DISTANCE',
        createdById: admin.id,
        fields: {
          create: [
            {
              fieldKey: 'route_number',
              labelEn: 'Route / Line Number',
              labelHe: 'מספר קו',
              fieldType: 'TEXT',
              sortOrder: 0,
            },
            {
              fieldKey: 'price_per_km',
              labelEn: 'Price per Kilometer',
              labelHe: 'מחיר לקילומטר',
              fieldType: 'NUMBER',
              sortOrder: 1,
            },
          ],
        },
      },
    });

    await prisma.template.create({
      data: {
        name: 'Destination & Vehicle Pricing',
        description: 'Fixed price by destination and vehicle type',
        status: TemplateStatus.ACTIVE,
        pricingMethod: 'PRICE_BY_DESTINATION',
        createdById: admin.id,
        fields: {
          create: [
            {
              fieldKey: 'destination',
              labelEn: 'Destination',
              labelHe: 'יעד',
              fieldType: 'TEXT',
              sortOrder: 0,
            },
            {
              fieldKey: 'vehicle_type',
              labelEn: 'Vehicle Type',
              labelHe: 'סוג רכב',
              fieldType: 'DROPDOWN',
              options: ['Sedan', 'Van', 'Bus', 'Minibus'],
              sortOrder: 1,
            },
            {
              fieldKey: 'price',
              labelEn: 'Price',
              labelHe: 'מחיר',
              fieldType: 'NUMBER',
              sortOrder: 2,
            },
          ],
        },
      },
    });
  }

  const clientTemplatesCreated = await seedClientTemplates(prisma, admin.id);
  if (clientTemplatesCreated > 0) {
    console.log(`Created ${clientTemplatesCreated} client templates`);
  }

  const priceListCatalogsCreated = await seedPriceList(
    prisma,
    admin.id,
    kivunimCustomer.id,
  );
  if (priceListCatalogsCreated > 0) {
    console.log(`Created ${priceListCatalogsCreated} Kivunim price list catalogs`);
  }

  const synthetic = await seedSyntheticPriceLists(prisma, admin.id, demoCustomer.id);
  if (synthetic.templatesCreated > 0 || synthetic.catalogsCreated > 0) {
    console.log(
      `Created ${synthetic.templatesCreated} synthetic templates and ${synthetic.catalogsCreated} catalogs`,
    );
  }

  // Assign any leftover orphan catalogs to the demo customer
  const orphans = await prisma.catalog.updateMany({
    where: { customerId: null },
    data: { customerId: demoCustomer.id },
  });
  if (orphans.count > 0) {
    console.log(`Assigned ${orphans.count} orphan catalogs to demo customer`);
  }

  console.log('Seed completed');

  await seedDummyLogsIfNeeded();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
