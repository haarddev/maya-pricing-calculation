import type { PricingMethod } from '../types/template.types';
import type { FieldValues } from '../types/catalog.types';

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

export function formatPrice(value: number | null, locale: string) {
  if (value === null) return '—';
  return new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 2,
  }).format(value);
}
