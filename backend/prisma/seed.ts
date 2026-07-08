import bcrypt from 'bcryptjs';
import { PrismaClient, TemplateStatus, UserRole } from '@prisma/client';
import { seedDummyLogsIfNeeded } from '../src/services/log.service.js';
import { ensureSettings } from '../src/services/settings.service.js';
import { seedClientTemplates } from './seed-client-templates.js';

const prisma = new PrismaClient();

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

  const existingCatalogs = await prisma.catalog.count();
  if (existingCatalogs === 0) {
    const distanceTemplate = await prisma.template.findFirst({
      where: { pricingMethod: 'PRICE_BY_DISTANCE' },
    });

    if (distanceTemplate) {
      await prisma.catalog.create({
        data: {
          name: 'Line 5 - Tel Aviv North',
          description: 'Distance pricing for route line 5',
          status: 'ACTIVE',
          templateId: distanceTemplate.id,
          fieldValues: {
            route_number: '5',
            price_per_km: 4.5,
          },
          calculatedPrice: 4.5,
          createdById: admin.id,
        },
      });
    }
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
