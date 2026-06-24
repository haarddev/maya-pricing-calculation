import { FieldType, PricingMethod } from '@prisma/client';

export type FieldValues = Record<string, string | number | boolean>;

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function calculateCatalogPrice(
  pricingMethod: PricingMethod,
  fieldValues: FieldValues,
): number | null {
  switch (pricingMethod) {
    case 'PRICE_BY_DESTINATION':
    case 'PRICE_BY_AREA':
      return toNumber(fieldValues.price);
    case 'PRICE_BY_ROUTE':
      return toNumber(fieldValues.fixed_price);
    case 'PRICE_BY_HOURS': {
      const hours = toNumber(fieldValues.hours);
      const rate = toNumber(fieldValues.price_per_hour);
      if (hours !== null && rate !== null) return hours * rate;
      return rate;
    }
    case 'PRICE_BY_DISTANCE':
      return toNumber(fieldValues.price_per_km);
    default:
      return null;
  }
}

export function validateFieldValues(
  fields: {
    fieldKey: string;
    fieldType: FieldType;
    required: boolean;
    options: unknown;
  }[],
  fieldValues: FieldValues,
): void {
  for (const field of fields) {
    const value = fieldValues[field.fieldKey];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '');

    if (field.required && isEmpty) {
      throw new Error(`Field "${field.fieldKey}" is required`);
    }

    if (isEmpty) continue;

    if (field.fieldType === FieldType.NUMBER && toNumber(value) === null) {
      throw new Error(`Field "${field.fieldKey}" must be a number`);
    }

    if (field.fieldType === FieldType.DROPDOWN && Array.isArray(field.options)) {
      const options = field.options as string[];
      if (!options.includes(String(value))) {
        throw new Error(`Field "${field.fieldKey}" has an invalid option`);
      }
    }
  }
}

export function normalizeFieldValues(
  fields: { fieldKey: string; fieldType: FieldType }[],
  rawValues: Record<string, unknown>,
): FieldValues {
  const normalized: FieldValues = {};

  for (const field of fields) {
    const value = rawValues[field.fieldKey];
    if (value === undefined || value === null || value === '') continue;

    switch (field.fieldType) {
      case FieldType.NUMBER:
        normalized[field.fieldKey] = toNumber(value) ?? 0;
        break;
      case FieldType.BOOLEAN:
        normalized[field.fieldKey] = Boolean(value);
        break;
      default:
        normalized[field.fieldKey] = String(value);
    }
  }

  return normalized;
}
