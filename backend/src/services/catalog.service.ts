import { TemplateStatus, Prisma, CatalogStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { logPricingResult } from './log.service.js';
import { shouldRequireActiveTemplate } from './settings.service.js';
import { AppError } from '../utils/errors.js';
import {
  calculateCatalogPrice,
  normalizeFieldValues,
  validateFieldValues,
  type FieldValues,
} from '../utils/catalog-pricing.js';

const createCatalogSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(CatalogStatus).optional(),
  templateId: z.string().uuid(),
  fieldValues: z.record(z.unknown()),
});

const updateCatalogSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(CatalogStatus).optional(),
  fieldValues: z.record(z.unknown()).optional(),
});

const catalogInclude = {
  template: {
    select: {
      id: true,
      name: true,
      pricingMethod: true,
      status: true,
      fields: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
};

async function getTemplateForCatalog(templateId: string) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: { fields: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!template) {
    throw new AppError(404, 'Template not found');
  }

  const requireActive = await shouldRequireActiveTemplate();
  if (requireActive && template.status !== TemplateStatus.ACTIVE) {
    throw new AppError(400, 'Only active templates can be used for catalogs');
  }

  return template;
}

export async function listCatalogs(filters: {
  status?: CatalogStatus;
  templateId?: string;
  search?: string;
}) {
  const where: {
    status?: CatalogStatus;
    templateId?: string;
    name?: { contains: string; mode: 'insensitive' };
  } = {};

  if (filters.status) where.status = filters.status;
  if (filters.templateId) where.templateId = filters.templateId;
  if (filters.search) where.name = { contains: filters.search, mode: 'insensitive' };

  return prisma.catalog.findMany({
    where,
    include: catalogInclude,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getCatalogById(id: string) {
  const catalog = await prisma.catalog.findUnique({
    where: { id },
    include: catalogInclude,
  });

  if (!catalog) {
    throw new AppError(404, 'Catalog not found');
  }

  return catalog;
}

export async function createCatalog(input: unknown, userId: string) {
  const data = createCatalogSchema.parse(input);
  const template = await getTemplateForCatalog(data.templateId);

  const fieldValues = normalizeFieldValues(template.fields, data.fieldValues);
  validateFieldValues(template.fields, fieldValues);

  const calcStart = Date.now();
  const calculatedPrice = calculateCatalogPrice(template.pricingMethod, fieldValues);
  const durationMs = Date.now() - calcStart;

  void logPricingResult({
    pricingMethod: template.pricingMethod,
    fieldValues,
    calculatedPrice,
    durationMs,
    userId,
  });

  return prisma.catalog.create({
    data: {
      name: data.name,
      description: data.description ?? '',
      status: data.status ?? CatalogStatus.DRAFT,
      templateId: data.templateId,
      fieldValues: fieldValues as Prisma.InputJsonValue,
      calculatedPrice,
      createdById: userId,
    },
    include: catalogInclude,
  });
}

export async function updateCatalog(id: string, input: unknown) {
  const data = updateCatalogSchema.parse(input);
  const existing = await getCatalogById(id);

  let fieldValues = existing.fieldValues as FieldValues;
  let calculatedPrice: number | null = existing.calculatedPrice
    ? Number(existing.calculatedPrice)
    : null;

  if (data.fieldValues) {
    fieldValues = normalizeFieldValues(existing.template.fields, data.fieldValues);
    validateFieldValues(existing.template.fields, fieldValues);
    const calcStart = Date.now();
    calculatedPrice = calculateCatalogPrice(existing.template.pricingMethod, fieldValues);
    const durationMs = Date.now() - calcStart;

    void logPricingResult({
      pricingMethod: existing.template.pricingMethod,
      fieldValues,
      calculatedPrice,
      durationMs,
      source: 'catalog-update',
    });
  }

  return prisma.catalog.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      fieldValues: fieldValues as Prisma.InputJsonValue,
      calculatedPrice,
    },
    include: catalogInclude,
  });
}

export async function deleteCatalog(id: string) {
  await getCatalogById(id);
  await prisma.catalog.delete({ where: { id } });
}

export async function listTemplatesForCatalog() {
  const requireActive = await shouldRequireActiveTemplate();

  return prisma.template.findMany({
    where: requireActive ? { status: TemplateStatus.ACTIVE } : undefined,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      pricingMethod: true,
    },
  });
}

export async function previewCatalogPrice(templateId: string, fieldValues: Record<string, unknown>) {
  const template = await getTemplateForCatalog(templateId);
  const normalized = normalizeFieldValues(template.fields, fieldValues);
  validateFieldValues(template.fields, normalized);

  const calcStart = Date.now();
  const calculatedPrice = calculateCatalogPrice(template.pricingMethod, normalized);
  const durationMs = Date.now() - calcStart;

  void logPricingResult({
    pricingMethod: template.pricingMethod,
    fieldValues: normalized,
    calculatedPrice,
    durationMs,
    source: 'catalog-preview',
  });

  return {
    calculatedPrice,
    fieldValues: normalized,
  };
}
