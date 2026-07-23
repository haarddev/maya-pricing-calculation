/**
 * Idempotent import of MoD / Masha price list into catalogs.
 * Run: node scripts/load-env.mjs npx tsx scripts/import-mod-masha-price-list.ts
 */
import { CatalogStatus, PricingMethod, TemplateStatus } from '@prisma/client';
import {
  MOD_CUSTOMER_NAME,
} from '../src/constants/customers.js';
import {
  MOD_KM_HOUR_RATES,
  MOD_LINE_RATES,
} from '../src/data/mod-masha-price-list.data.js';
import { prisma } from '../src/lib/prisma.js';

const ROUTE_TEMPLATE = 'MoD Masha - Line Prices (PRICE_BY_ROUTE)';
const KM_HOURS_TEMPLATE = 'MoD Masha - Km + Hours (PRICE_BY_KM_AND_HOURS)';

async function ensureAdmin() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin user — run seed first');
  return admin;
}

async function ensureCustomer(adminId: string) {
  const existing = await prisma.customer.findFirst({ where: { name: MOD_CUSTOMER_NAME } });
  if (existing) return existing;
  return prisma.customer.create({
    data: {
      name: MOD_CUSTOMER_NAME,
      description: 'Ministry of Defense (Maya) — Masha line prices + km/hour rates from 2026 price list.',
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
}

async function ensureRouteTemplate(adminId: string) {
  let template = await prisma.template.findFirst({ where: { name: ROUTE_TEMPLATE } });
  if (template) {
    await prisma.template.update({
      where: { id: template.id },
      data: { status: TemplateStatus.ACTIVE, pricingMethod: PricingMethod.PRICE_BY_ROUTE },
    });
    return template;
  }
  return prisma.template.create({
    data: {
      name: ROUTE_TEMPLATE,
      description: 'Fixed line prices for Masha / MoD routes (2026).',
      status: TemplateStatus.ACTIVE,
      pricingMethod: PricingMethod.PRICE_BY_ROUTE,
      createdById: adminId,
      fields: {
        create: [
          {
            fieldKey: 'route_name',
            labelEn: 'Line / Route',
            labelHe: 'קו / מסלול',
            fieldType: 'TEXT',
            sortOrder: 0,
          },
          {
            fieldKey: 'route_name_en',
            labelEn: 'Line (EN)',
            labelHe: 'קו (EN)',
            fieldType: 'TEXT',
            required: false,
            sortOrder: 1,
          },
          {
            fieldKey: 'vehicle_type',
            labelEn: 'Vehicle Type',
            labelHe: 'סוג רכב',
            fieldType: 'DROPDOWN',
            options: ['Bus', 'Minibus', 'Van'],
            sortOrder: 2,
          },
          {
            fieldKey: 'fixed_price',
            labelEn: 'Line Price',
            labelHe: 'מחיר קו',
            fieldType: 'NUMBER',
            sortOrder: 3,
          },
          {
            fieldKey: 'additional_km_rate',
            labelEn: 'Additional km rate',
            labelHe: 'תוספת לק״מ',
            fieldType: 'NUMBER',
            required: false,
            sortOrder: 4,
          },
          {
            fieldKey: 'vehicle_label',
            labelEn: 'Price-list vehicle label',
            labelHe: 'רכב במחירון',
            fieldType: 'TEXT',
            required: false,
            sortOrder: 5,
          },
        ],
      },
    },
  });
}

async function ensureKmHoursTemplate(adminId: string) {
  let template = await prisma.template.findFirst({ where: { name: KM_HOURS_TEMPLATE } });
  if (template) {
    await prisma.template.update({
      where: { id: template.id },
      data: { status: TemplateStatus.ACTIVE, pricingMethod: PricingMethod.PRICE_BY_KM_AND_HOURS },
    });
    return template;
  }
  return prisma.template.create({
    data: {
      name: KM_HOURS_TEMPLATE,
      description: 'MoD 2026 general km + hourly rates by vehicle.',
      status: TemplateStatus.ACTIVE,
      pricingMethod: PricingMethod.PRICE_BY_KM_AND_HOURS,
      createdById: adminId,
      fields: {
        create: [
          {
            fieldKey: 'vehicle_type',
            labelEn: 'Vehicle Type',
            labelHe: 'סוג רכב',
            fieldType: 'DROPDOWN',
            options: ['Bus', 'Minibus', 'Van'],
            sortOrder: 0,
          },
          {
            fieldKey: 'price_per_km',
            labelEn: 'Price per Km',
            labelHe: 'מחיר לק״מ',
            fieldType: 'NUMBER',
            sortOrder: 1,
          },
          {
            fieldKey: 'price_per_hour',
            labelEn: 'Price per Hour',
            labelHe: 'מחיר לשעה',
            fieldType: 'NUMBER',
            sortOrder: 2,
          },
          {
            fieldKey: 'vehicle_label',
            labelEn: 'Price-list vehicle label',
            labelHe: 'רכב במחירון',
            fieldType: 'TEXT',
            required: false,
            sortOrder: 3,
          },
        ],
      },
    },
  });
}

async function replaceCatalogs(
  customerId: string,
  templateId: string,
  adminId: string,
  rows: Array<{ name: string; fieldValues: Record<string, string | number | null> }>,
) {
  await prisma.catalog.deleteMany({ where: { customerId, templateId } });
  for (const row of rows) {
    await prisma.catalog.create({
      data: {
        name: row.name,
        description: '',
        status: CatalogStatus.ACTIVE,
        customerId,
        templateId,
        fieldValues: row.fieldValues,
        calculatedPrice:
          typeof row.fieldValues.fixed_price === 'number'
            ? row.fieldValues.fixed_price
            : typeof row.fieldValues.price_per_km === 'number' &&
                typeof row.fieldValues.price_per_hour === 'number'
              ? row.fieldValues.price_per_km + row.fieldValues.price_per_hour
              : null,
        createdById: adminId,
      },
    });
  }
}

async function main() {
  const admin = await ensureAdmin();
  const customer = await ensureCustomer(admin.id);
  const routeTemplate = await ensureRouteTemplate(admin.id);
  const kmHoursTemplate = await ensureKmHoursTemplate(admin.id);

  // Unique km/hour by engine vehicle (prefer primary Bus / Minibus 19 / Midibus→Van)
  const kmHourRows = [
    MOD_KM_HOUR_RATES.find((r) => r.vehicleLabel === 'Bus')!,
    MOD_KM_HOUR_RATES.find((r) => r.vehicleLabel === 'Minibus 19')!,
    MOD_KM_HOUR_RATES.find((r) => r.vehicleLabel === 'Midibus')!,
  ].map((r) => ({
    name: `${r.vehicleLabel} km+hours`,
    fieldValues: {
      vehicle_type: r.engineVehicle,
      vehicle_label: r.vehicleLabel,
      km: 1,
      hours: 1,
      price_per_km: r.pricePerKm,
      price_per_hour: r.pricePerHour,
    },
  }));

  const lineRows = MOD_LINE_RATES.map((line) => ({
    name: `${line.lineName} (${line.vehicleLabel})`,
    fieldValues: {
      route_name: line.lineName,
      route_name_en: line.lineName,
      vehicle_type: line.engineVehicle,
      vehicle_label: line.vehicleLabel,
      fixed_price: line.linePrice,
      additional_km_rate: line.additionalKmRate,
      // Also store aliases for debugging / future matching
      aliases: line.aliases.join(' | '),
    },
  }));

  // Duplicate each line under Bus + Minibus + Van so vehicle_type from Excel (unknown) still matches
  const lineRowsAllVehicles = lineRows.flatMap((row) =>
    (['Bus', 'Minibus', 'Van'] as const).map((vehicle) => ({
      name: `${row.name} [${vehicle}]`,
      fieldValues: { ...row.fieldValues, vehicle_type: vehicle },
    })),
  );

  await replaceCatalogs(customer.id, routeTemplate.id, admin.id, lineRowsAllVehicles);
  await replaceCatalogs(customer.id, kmHoursTemplate.id, admin.id, kmHourRows);

  console.log(`Customer: ${customer.name} (${customer.id})`);
  console.log(`Route catalogs: ${lineRowsAllVehicles.length}`);
  console.log(`Km+hours catalogs: ${kmHourRows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
