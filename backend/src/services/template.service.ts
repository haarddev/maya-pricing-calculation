import { FieldType, PricingMethod, TemplateStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/errors.js';

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
      fieldKey: 'route_number',
      labelEn: 'Route / Line Number',
      labelHe: 'מספר קו',
      fieldType: FieldType.TEXT,
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

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  supplementsAdditions: z.string().optional(),
  status: z.nativeEnum(TemplateStatus).optional(),
  pricingMethod: z.nativeEnum(PricingMethod),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  supplementsAdditions: z.string().optional(),
  status: z.nativeEnum(TemplateStatus).optional(),
});

const createFieldSchema = z.object({
  fieldKey: z.string().min(1),
  labelEn: z.string().min(1),
  labelHe: z.string().min(1),
  fieldType: z.nativeEnum(FieldType),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const updateFieldSchema = createFieldSchema.partial();

export async function listTemplates(filters: {
  status?: TemplateStatus;
  pricingMethod?: PricingMethod;
  search?: string;
}) {
  const where: {
    status?: TemplateStatus;
    pricingMethod?: PricingMethod;
    name?: { contains: string; mode: 'insensitive' };
  } = {};

  if (filters.status) where.status = filters.status;
  if (filters.pricingMethod) where.pricingMethod = filters.pricingMethod;
  if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };

  const templates = await prisma.template.findMany({
    where,
    include: {
      _count: { select: { fields: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return templates.map(({ _count, ...template }) => ({
    ...template,
    fieldCount: _count.fields,
  }));
}

export async function getTemplateById(id: string) {
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!template) {
    throw new AppError(404, 'Template not found');
  }

  return template;
}

export async function createTemplate(input: unknown, userId: string) {
  const data = createTemplateSchema.parse(input);
  const defaults = defaultFieldsByMethod[data.pricingMethod];

  return prisma.template.create({
    data: {
      name: data.name,
      description: data.description ?? '',
      supplementsAdditions: data.supplementsAdditions ?? '',
      status: data.status ?? TemplateStatus.DRAFT,
      pricingMethod: data.pricingMethod,
      createdById: userId,
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
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateTemplate(id: string, input: unknown) {
  const data = updateTemplateSchema.parse(input);
  await getTemplateById(id);

  return prisma.template.update({
    where: { id },
    data,
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteTemplate(id: string) {
  await getTemplateById(id);
  await prisma.template.delete({ where: { id } });
}

export async function addTemplateField(templateId: string, input: unknown) {
  await getTemplateById(templateId);
  const data = createFieldSchema.parse(input);

  const maxOrder = await prisma.templateField.aggregate({
    where: { templateId },
    _max: { sortOrder: true },
  });

  return prisma.templateField.create({
    data: {
      templateId,
      fieldKey: data.fieldKey,
      labelEn: data.labelEn,
      labelHe: data.labelHe,
      fieldType: data.fieldType,
      options: data.options ?? undefined,
      required: data.required ?? true,
      sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateTemplateField(
  templateId: string,
  fieldId: string,
  input: unknown,
) {
  await getTemplateById(templateId);
  const data = updateFieldSchema.parse(input);

  const field = await prisma.templateField.findFirst({
    where: { id: fieldId, templateId },
  });

  if (!field) {
    throw new AppError(404, 'Field not found');
  }

  return prisma.templateField.update({
    where: { id: fieldId },
    data,
  });
}

export async function deleteTemplateField(templateId: string, fieldId: string) {
  await getTemplateById(templateId);

  const field = await prisma.templateField.findFirst({
    where: { id: fieldId, templateId },
  });

  if (!field) {
    throw new AppError(404, 'Field not found');
  }

  await prisma.templateField.delete({ where: { id: fieldId } });
}
