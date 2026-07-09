export const SUPPORTED_CURRENCIES = [
  'USD',
  'ILS',
  'INR',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'ILS';

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode);
}

export function isPriceFieldKey(fieldKey: string) {
  return /price|cost|rate|fee|amount/i.test(fieldKey);
}

export function getCurrencySymbol(currency: string, locale = 'en-US') {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}
