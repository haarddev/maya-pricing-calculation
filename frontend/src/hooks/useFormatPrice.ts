import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '../context/SettingsContext';
import { formatPrice } from '../utils/catalogPricing';
import { DEFAULT_CURRENCY } from '../utils/currency';
import { getAppLocale } from '../utils/formatDate';

export function useFormatPrice() {
  const { i18n } = useTranslation();
  const { currency } = useAppSettings();
  const locale = getAppLocale(i18n.language);

  return useCallback(
    (value: number | null) => formatPrice(value, locale, currency ?? DEFAULT_CURRENCY),
    [currency, locale],
  );
}
