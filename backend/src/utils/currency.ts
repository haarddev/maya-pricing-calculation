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
