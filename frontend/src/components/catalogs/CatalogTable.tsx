import { Eye, Pencil, Trash2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Catalog, CatalogStatus } from '../../types/catalog.types';
import type { PricingMethod } from '../../types/template.types';
import { downloadCatalog } from '../../utils/catalogExport';
import { formatPrice } from '../../utils/catalogPricing';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const catalogStatusMap: Record<CatalogStatus, 'ACTIVE' | 'DISABLED' | 'DRAFT'> = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  DRAFT: 'DRAFT',
};

type CatalogTableProps = {
  catalogs: Catalog[];
  onDelete: (catalog: Catalog) => void;
};

export function CatalogTable({ catalogs, onDelete }: CatalogTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isHebrew = i18n.language.startsWith('he');

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(isHebrew ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const priceOf = (catalog: Catalog) => {
    const num =
      catalog.calculatedPrice === null || catalog.calculatedPrice === undefined
        ? null
        : Number(catalog.calculatedPrice);
    return formatPrice(Number.isNaN(num) ? null : num, isHebrew ? 'he' : 'en');
  };

  if (catalogs.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-slate-500">{t('catalogs.noResults')}</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4 lg:hidden">
        {catalogs.map((catalog) => (
          <Card key={catalog.id} className="transition hover:shadow-md">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">{catalog.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{catalog.template?.name}</p>
              </div>
              <StatusBadge
                label={t(`catalogStatus.${catalog.status}`)}
                status={catalogStatusMap[catalog.status]}
              />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('catalogs.calculatedPrice')}
                </p>
                <p className="mt-0.5 font-semibold text-brand-700">{priceOf(catalog)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('catalogs.updatedAt')}
                </p>
                <p className="mt-0.5 text-slate-700">{formatDate(catalog.updatedAt)}</p>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <Button
                variant="secondary"
                className="flex-1 !py-2"
                onClick={() => navigate(`/catalogs/${catalog.id}`)}
              >
                <Eye className="h-4 w-4" />
                {t('catalogs.view')}
              </Button>
              <Button variant="ghost" className="!px-3" onClick={() => navigate(`/catalogs/${catalog.id}`)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <button
                type="button"
                title={t('catalogs.downloadCsv')}
                onClick={() => downloadCatalog(catalog, 'csv', t)}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-slate-600 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
              </button>
              <Button variant="danger" className="!px-3" onClick={() => onDelete(catalog)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="hidden overflow-hidden !p-0 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-start">
                <th className="px-5 py-3 font-semibold text-slate-600">{t('catalogs.name')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('catalogs.template')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('catalogs.type')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('catalogs.calculatedPrice')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('catalogs.status')}</th>
                <th className="px-5 py-3 font-semibold text-slate-600">{t('catalogs.updatedAt')}</th>
                <th className="px-5 py-3 text-center font-semibold text-slate-600">{t('catalogs.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {catalogs.map((catalog) => (
                <tr key={catalog.id} className="border-b border-slate-100 hover:bg-slate-50/60 last:border-0">
                  <td className="px-5 py-4 font-medium text-slate-900">{catalog.name}</td>
                  <td className="px-5 py-4 text-slate-600">{catalog.template?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {catalog.template?.pricingMethod
                      ? t(`pricingMethod.${catalog.template.pricingMethod as PricingMethod}`)
                      : '—'}
                  </td>
                  <td className="px-5 py-4 font-semibold text-brand-700">{priceOf(catalog)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={t(`catalogStatus.${catalog.status}`)}
                      status={catalogStatusMap[catalog.status]}
                    />
                  </td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(catalog.updatedAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title={t('catalogs.view')}
                        onClick={() => navigate(`/catalogs/${catalog.id}`)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('catalogs.edit')}
                        onClick={() => navigate(`/catalogs/${catalog.id}`)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('catalogs.download')}
                        onClick={() => downloadCatalog(catalog, 'csv', t)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={t('catalogs.delete')}
                        onClick={() => onDelete(catalog)}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
