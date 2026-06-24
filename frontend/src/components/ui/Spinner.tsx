import { useTranslation } from 'react-i18next';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner />
      <p className="text-sm text-slate-500">{t('common.loading')}</p>
    </div>
  );
}
