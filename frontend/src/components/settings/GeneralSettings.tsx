import { Coins, Globe2, Palette, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CurrencyCode } from '../../utils/currency';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '../../utils/currency';
import { formatPrice } from '../../utils/catalogPricing';
import { getAppLocale } from '../../utils/formatDate';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SectionCard } from '../ui/SectionCard';
import { Select } from '../ui/Select';
import { SettingRow } from '../ui/SettingRow';

type GeneralSettingsProps = {
  appName: string;
  currency: CurrencyCode;
  saving: boolean;
  onAppNameChange: (value: string) => void;
  onCurrencyChange: (value: CurrencyCode) => void;
  onSave: () => void;
};

const SAMPLE_PRICE = 1249.5;

export function GeneralSettings({
  appName,
  currency,
  saving,
  onAppNameChange,
  onCurrencyChange,
  onSave,
}: GeneralSettingsProps) {
  const { t, i18n } = useTranslation();
  const locale = getAppLocale(i18n.language);
  const localeTag = locale === 'he' ? 'he-IL' : 'en-US';
  const displayName = appName.trim() || t('settings.general.preview.sampleName');
  const currencySymbol = getCurrencySymbol(currency, localeTag);
  const samplePrice = formatPrice(SAMPLE_PRICE, locale, currency);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-indigo-50/50 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('settings.general.title')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('settings.general.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionCard title={t('settings.general.sections.branding')}>
            <SettingRow
              icon={Globe2}
              title={t('settings.general.appName')}
              hint={t('settings.general.appNameHint')}
            >
              <Input
                label=""
                hideLabel
                value={appName}
                onChange={(e) => onAppNameChange(e.target.value)}
                placeholder={t('settings.general.appNamePlaceholder')}
              />
            </SettingRow>
          </SectionCard>

          <SectionCard title={t('settings.general.sections.pricing')}>
            <SettingRow
              icon={Coins}
              title={t('settings.general.currency')}
              hint={t('settings.general.currencyHint')}
            >
              <Select
                label=""
                hideLabel
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                options={SUPPORTED_CURRENCIES.map((code) => ({
                  value: code,
                  label: t(`settings.currency.${code.toLowerCase()}`),
                }))}
              />
            </SettingRow>
          </SectionCard>
        </div>

        <SectionCard title={t('settings.general.preview.title')} className="h-fit xl:sticky xl:top-24">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Route className="h-4 w-4" />
                  </div>
                  <p className="truncate text-sm font-bold text-slate-900">{displayName}</p>
                </div>
              </div>
              <div className="space-y-2 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('settings.general.preview.header')}
                </p>
                <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                <div className="h-2 w-1/2 rounded-full bg-slate-200" />
              </div>
            </div>

            <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('settings.general.preview.priceLabel')}
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-800">{samplePrice}</p>
              <p className="mt-2 text-xs text-slate-500">
                {t('settings.general.preview.currencyNote', { symbol: currencySymbol, code: currency })}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <Button onClick={onSave} loading={saving} className="w-full sm:w-auto">
          {t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
