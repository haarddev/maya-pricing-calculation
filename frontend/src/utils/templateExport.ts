import type { TFunction } from 'i18next';
import * as templatesApi from '../api/templates.api';
import type { PricingMethod, Template } from '../types/template.types';

export type TemplateExportFormat = 'csv' | 'json';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'template';
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

function exportableTemplate(template: Template) {
  const { id, name, description, supplementsAdditions, status, pricingMethod, fields, createdAt, updatedAt } =
    template;

  return {
    id,
    name,
    description,
    supplementsAdditions,
    status,
    pricingMethod,
    fields: fields ?? [],
    createdAt,
    updatedAt,
  };
}

export function buildTemplateJson(template: Template) {
  return JSON.stringify(exportableTemplate(template), null, 2);
}

export function buildTemplatesJson(templates: Template[]) {
  return JSON.stringify(templates.map(exportableTemplate), null, 2);
}

export function buildTemplatesCsv(templates: Template[], t: TFunction) {
  const headers = [
    'id',
    t('templates.name'),
    t('templates.description'),
    t('templates.supplementsAdditions'),
    t('templates.status'),
    t('templates.type'),
    t('templates.fieldKey'),
    t('templates.labelEn'),
    t('templates.labelHe'),
    t('templates.fieldType'),
    t('templates.required'),
    t('templates.options'),
    'sort_order',
    t('templates.createdAt'),
    t('templates.updatedAt'),
  ];

  const rows: string[] = [];

  for (const template of templates) {
    const pricingMethod = template.pricingMethod as PricingMethod;
    const base = [
      template.id,
      template.name,
      template.description,
      template.supplementsAdditions,
      t(`status.${template.status}`),
      t(`pricingMethod.${pricingMethod}`),
    ];

    const fields = template.fields ?? [];

    if (fields.length === 0) {
      rows.push(
        [
          ...base,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          template.createdAt,
          template.updatedAt,
        ]
          .map(escapeCsv)
          .join(','),
      );
      continue;
    }

    for (const field of fields) {
      rows.push(
        [
          ...base,
          field.fieldKey,
          field.labelEn,
          field.labelHe,
          t(`fieldType.${field.fieldType}`),
          field.required ? t('common.yes') : t('common.no'),
          field.options?.join(', ') ?? '',
          field.sortOrder,
          template.createdAt,
          template.updatedAt,
        ]
          .map(escapeCsv)
          .join(','),
      );
    }
  }

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}

export function downloadTemplate(template: Template, format: TemplateExportFormat, t: TFunction) {
  const slug = slugify(template.name);
  if (format === 'json') {
    downloadBlob(buildTemplateJson(template), `${slug}.json`, 'application/json;charset=utf-8');
    return;
  }
  downloadBlob(buildTemplatesCsv([template], t), `${slug}.csv`, 'text/csv;charset=utf-8');
}

export function downloadTemplates(templates: Template[], format: TemplateExportFormat, t: TFunction) {
  const date = new Date().toISOString().slice(0, 10);
  if (format === 'json') {
    downloadBlob(
      buildTemplatesJson(templates),
      `maya-templates-${date}.json`,
      'application/json;charset=utf-8',
    );
    return;
  }
  downloadBlob(
    buildTemplatesCsv(templates, t),
    `maya-templates-${date}.csv`,
    'text/csv;charset=utf-8',
  );
}

export async function downloadTemplateById(
  id: string,
  format: TemplateExportFormat,
  t: TFunction,
) {
  const template = await templatesApi.getTemplate(id);
  downloadTemplate(template, format, t);
}

export async function downloadAllTemplates(
  templates: Template[],
  format: TemplateExportFormat,
  t: TFunction,
) {
  const fullTemplates = await Promise.all(templates.map((template) => templatesApi.getTemplate(template.id)));
  downloadTemplates(fullTemplates, format, t);
}
