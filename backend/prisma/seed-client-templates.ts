import { FieldType, PricingMethod } from '@prisma/client';
import { CLIENT_TEMPLATES } from './client-templates.data.js';

type DefaultField = {
  fieldKey: string;
  labelEn: string;
  labelHe: string;
  fieldType: FieldType;
  options?: string[];
  required?: boolean;
  sortOrder: number;
};

const defaultFieldsByMethod: Record<PricingMethod, DefaultField[]> = {
  PRICE_BY_DESTINATION: [
    {
      fieldKey: 'destination',
      labelEn: 'Destination',
      labelHe: 'יעד',
      fieldType: FieldType.TEXT,
      sortOrder: 0,
    },
    {
      fieldKey: 'vehicle_type',
      labelEn: 'Vehicle Type',
      labelHe: 'סוג רכב',
      fieldType: FieldType.DROPDOWN,
      options: ['Sedan', 'Van', 'Bus', 'Minibus'],
      sortOrder: 1,
    },
    {
      fieldKey: 'price',
      labelEn: 'Price',
      labelHe: 'מחיר',
      fieldType: FieldType.NUMBER,
      sortOrder: 2,
    },
  ],
  PRICE_BY_HOURS: [
    {
      fieldKey: 'hours',
      labelEn: 'Hours',
      labelHe: 'שעות',
      fieldType: FieldType.NUMBER,
      sortOrder: 0,
    },
    {
      fieldKey: 'price_per_hour',
      labelEn: 'Price per Hour',
      labelHe: 'מחיר לשעה',
      fieldType: FieldType.NUMBER,
      sortOrder: 1,
    },
  ],
  PRICE_BY_ROUTE: [
    {
      fieldKey: 'route_name',
      labelEn: 'Route Name',
      labelHe: 'שם מסלול',
      fieldType: FieldType.TEXT,
      sortOrder: 0,
    },
    {
      fieldKey: 'vehicle_type',
      labelEn: 'Vehicle Type',
      labelHe: 'סוג רכב',
      fieldType: FieldType.DROPDOWN,
      options: ['Sedan', 'Van', 'Bus', 'Minibus'],
      sortOrder: 1,
    },
    {
      fieldKey: 'fixed_price',
      labelEn: 'Fixed Price',
      labelHe: 'מחיר קבוע',
      fieldType: FieldType.NUMBER,
      sortOrder: 2,
    },
  ],
  PRICE_BY_DISTANCE: [
    {
      fieldKey: 'vehicle_type',
      labelEn: 'Vehicle Type',
      labelHe: 'סוג רכב',
      fieldType: FieldType.DROPDOWN,
      options: ['Sedan', 'Van', 'Bus', 'Minibus'],
      sortOrder: 0,
    },
    {
      fieldKey: 'price_per_km',
      labelEn: 'Price per Kilometer',
      labelHe: 'מחיר לקילומטר',
      fieldType: FieldType.NUMBER,
      sortOrder: 1,
    },
  ],
  PRICE_BY_AREA: [
    {
      fieldKey: 'area_name',
      labelEn: 'Area Name',
      labelHe: 'שם אזור',
      fieldType: FieldType.TEXT,
      sortOrder: 0,
    },
    {
      fieldKey: 'vehicle_type',
      labelEn: 'Vehicle Type',
      labelHe: 'סוג רכב',
      fieldType: FieldType.DROPDOWN,
      options: ['Sedan', 'Van', 'Bus', 'Minibus'],
      sortOrder: 1,
    },
    {
      fieldKey: 'price',
      labelEn: 'Price',
      labelHe: 'מחיר',
      fieldType: FieldType.NUMBER,
      sortOrder: 2,
    },
  ],
  PRICE_BY_PASSENGERS: [
    {
      fieldKey: 'passenger_tier',
      labelEn: 'Passenger Tier',
      labelHe: 'דרגת נוסעים',
      fieldType: FieldType.DROPDOWN,
      options: ['Up to 2', 'Up to 4', 'Larger group'],
      sortOrder: 0,
    },
    {
      fieldKey: 'vehicle_type',
      labelEn: 'Vehicle Type',
      labelHe: 'סוג רכב',
      fieldType: FieldType.DROPDOWN,
      options: ['Sedan', 'Van', 'Bus', 'Minibus'],
      sortOrder: 1,
    },
    {
      fieldKey: 'price',
      labelEn: 'Price',
      labelHe: 'מחיר',
      fieldType: FieldType.NUMBER,
      sortOrder: 2,
    },
  ],
  PRICE_BY_SKU: [
    {
      fieldKey: 'sku',
      labelEn: 'SKU / Catalog Number',
      labelHe: 'מק"ט / מספר קטלוג',
      fieldType: FieldType.TEXT,
      sortOrder: 0,
    },
    {
      fieldKey: 'price',
      labelEn: 'Price',
      labelHe: 'מחיר',
      fieldType: FieldType.NUMBER,
      sortOrder: 1,
    },
  ],
  PRICE_BY_MINUTES: [
    {
      fieldKey: 'minutes',
      labelEn: 'Minutes',
      labelHe: 'דקות',
      fieldType: FieldType.NUMBER,
      sortOrder: 0,
    },
    {
      fieldKey: 'price_per_minute',
      labelEn: 'Price per Minute',
      labelHe: 'מחיר לדקה',
      fieldType: FieldType.NUMBER,
      sortOrder: 1,
    },
  ],
  PRICE_BY_KM_AND_HOURS: [
    {
      fieldKey: 'km',
      labelEn: 'Kilometers',
      labelHe: 'קילומטרים',
      fieldType: FieldType.NUMBER,
      sortOrder: 0,
    },
    {
      fieldKey: 'hours',
      labelEn: 'Hours',
      labelHe: 'שעות',
      fieldType: FieldType.NUMBER,
      sortOrder: 1,
    },
    {
      fieldKey: 'price_per_km',
      labelEn: 'Price per Kilometer',
      labelHe: 'מחיר לקילומטר',
      fieldType: FieldType.NUMBER,
      sortOrder: 2,
    },
    {
      fieldKey: 'price_per_hour',
      labelEn: 'Price per Hour',
      labelHe: 'מחיר לשעה',
      fieldType: FieldType.NUMBER,
      sortOrder: 3,
    },
  ],
};

export async function seedClientTemplates(
  prisma: { template: { findFirst: Function; create: Function } },
  adminId: string,
) {
  let created = 0;

  for (const template of CLIENT_TEMPLATES) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name },
    });

    if (existing) continue;

    const defaults = defaultFieldsByMethod[template.pricingMethod];

    await prisma.template.create({
      data: {
        name: template.name,
        description: template.description,
        supplementsAdditions: template.supplementsAdditions,
        status: 'ACTIVE',
        pricingMethod: template.pricingMethod,
        createdById: adminId,
        fields: {
          create: defaults.map((field) => ({
            fieldKey: field.fieldKey,
            labelEn: field.labelEn,
            labelHe: field.labelHe,
            fieldType: field.fieldType,
            options: field.options ?? undefined,
            required: field.required ?? true,
            sortOrder: field.sortOrder,
          })),
        },
      },
    });

    created += 1;
  }

  return created;
}
