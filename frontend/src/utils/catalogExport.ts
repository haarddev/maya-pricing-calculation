import type { TFunction } from 'i18next';
import type { Catalog } from '../types/catalog.types';
import type { PricingMethod } from '../types/template.types';

export type CatalogExportFormat = 'csv' | 'json';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'catalog';
}

function escapeCsv(value: unknown) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function collectFieldKeys(catalogs: Catalog[]) {
  const keys = new Set<string>();
  for (const catalog of catalogs) {
    Object.keys(catalog.fieldValues ?? {}).forEach((key) => keys.add(key));
    catalog.template?.fields?.forEach((field) => keys.add(field.fieldKey));
  }
  return [...keys].sort();
}

function catalogToExportRow(catalog: Catalog, t: TFunction, fieldKeys: string[]) {
  const pricingMethod = catalog.template?.pricingMethod as PricingMethod | undefined;

  const base = {
    id: catalog.id,
    name: catalog.name,
    description: catalog.description,
    status: t(`catalogStatus.${catalog.status}`),
    template: catalog.template?.name ?? '',
    pricingMethod: pricingMethod ? t(`pricingMethod.${pricingMethod}`) : '',
    calculatedPrice: catalog.calculatedPrice ?? '',
    createdAt: catalog.createdAt,
    updatedAt: catalog.updatedAt,
  };

  const dynamic: Record<string, unknown> = {};
  for (const key of fieldKeys) {
    dynamic[key] = catalog.fieldValues?.[key] ?? '';
  }

  return { ...base, ...dynamic };
}

export function buildCatalogsCsv(catalogs: Catalog[], t: TFunction) {
  const fieldKeys = collectFieldKeys(catalogs);
  const headers = [
    'id',
    t('catalogs.name'),
    t('catalogs.description'),
    t('catalogs.status'),
    t('catalogs.template'),
    t('catalogs.type'),
    t('catalogs.calculatedPrice'),
    t('catalogs.createdAt'),
    t('catalogs.updatedAt'),
    ...fieldKeys,
  ];

  const rows = catalogs.map((catalog) => {
    const row = catalogToExportRow(catalog, t, fieldKeys);
    const values = [
      row.id,
      row.name,
      row.description,
      row.status,
      row.template,
      row.pricingMethod,
      row.calculatedPrice,
      row.createdAt,
      row.updatedAt,
      ...fieldKeys.map((key) => row[key as keyof typeof row] ?? ''),
    ];
    return values.map(escapeCsv).join(',');
  });

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

export function buildCatalogJson(catalog: Catalog) {
  return JSON.stringify(catalog, null, 2);
}

export function buildCatalogsJson(catalogs: Catalog[]) {
  return JSON.stringify(catalogs, null, 2);
}

export function downloadCatalog(catalog: Catalog, format: CatalogExportFormat, t: TFunction) {
  const slug = slugify(catalog.name);
  if (format === 'json') {
    downloadBlob(buildCatalogJson(catalog), `${slug}.json`, 'application/json;charset=utf-8');
    return;
  }
  downloadBlob(
    buildCatalogsCsv([catalog], t),
    `${slug}.csv`,
    'text/csv;charset=utf-8',
  );
}

export function downloadCatalogs(catalogs: Catalog[], format: CatalogExportFormat, t: TFunction) {
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'json') {
    downloadBlob(
      buildCatalogsJson(catalogs),
      `maya-catalogs-${date}.json`,
      'application/json;charset=utf-8',
    );
    return;
  }
  downloadBlob(
    buildCatalogsCsv(catalogs, t),
    `maya-catalogs-${date}.csv`,
    'text/csv;charset=utf-8',
  );
}
