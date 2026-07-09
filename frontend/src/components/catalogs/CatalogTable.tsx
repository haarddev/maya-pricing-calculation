import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Download, Eye, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Catalog, CatalogStatus } from '../../types/catalog.types';
import type { PricingMethod } from '../../types/template.types';
import { downloadCatalog } from '../../utils/catalogExport';
import { useFormatPrice } from '../../hooks/useFormatPrice';
import { formatDate, getAppLocale } from '../../utils/formatDate';
import { Button } from '../ui/Button';
import { MobileEntityCard } from '../ui/MobileEntityCard';
import { ResponsiveDataView } from '../ui/ResponsiveDataView';
import { StatusBadge } from '../ui/StatusBadge';
import { TableIconButton } from '../ui/TableIconButton';

const catalogStatusMap: Record<CatalogStatus, 'ACTIVE' | 'DISABLED' | 'DRAFT'> = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  DRAFT: 'DRAFT',
};

type CatalogTableProps = {
  catalogs: Catalog[];
  onDelete: (catalog: Catalog) => void;
};

const columnHelper = createColumnHelper<Catalog>();

export function CatalogTable({ catalogs, onDelete }: CatalogTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = getAppLocale(i18n.language);
  const formatPriceValue = useFormatPrice();

  const priceOf = (catalog: Catalog) => {
    const num =
      catalog.calculatedPrice === null || catalog.calculatedPrice === undefined
        ? null
        : Number(catalog.calculatedPrice);
    return formatPriceValue(Number.isNaN(num) ? null : num);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => t('catalogs.name'),
        cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.template?.name ?? '—', {
        id: 'template',
        header: () => t('catalogs.template'),
        cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.template?.pricingMethod, {
        id: 'pricingMethod',
        header: () => t('catalogs.type'),
        cell: (info) => (
          <span className="text-slate-600">
            {info.getValue() ? t(`pricingMethod.${info.getValue() as PricingMethod}`) : '—'}
          </span>
        ),
      }),
      columnHelper.accessor('calculatedPrice', {
        header: () => t('catalogs.calculatedPrice'),
        cell: (info) => (
          <span className="font-semibold text-brand-700">{priceOf(info.row.original)}</span>
        ),
      }),
      columnHelper.accessor('status', {
        header: () => t('catalogs.status'),
        cell: (info) => (
          <StatusBadge
            label={t(`catalogStatus.${info.getValue()}`)}
            status={catalogStatusMap[info.getValue()]}
          />
        ),
      }),
      columnHelper.accessor('updatedAt', {
        header: () => t('catalogs.updatedAt'),
        cell: (info) => <span className="text-slate-600">{formatDate(info.getValue(), locale)}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => t('catalogs.actions'),
        meta: { align: 'center' as const },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <TableIconButton
              icon={Eye}
              title={t('catalogs.view')}
              onClick={() => navigate(`/catalogs/${row.original.id}`)}
            />
            <TableIconButton
              icon={Pencil}
              title={t('catalogs.edit')}
              onClick={() => navigate(`/catalogs/${row.original.id}`)}
            />
            <TableIconButton
              icon={Download}
              title={t('catalogs.download')}
              onClick={() => downloadCatalog(row.original, 'csv', t)}
            />
            <TableIconButton
              icon={Trash2}
              title={t('catalogs.delete')}
              variant="danger"
              onClick={() => onDelete(row.original)}
            />
          </div>
        ),
      }),
    ],
    [locale, navigate, onDelete, priceOf, t],
  );

  return (
    <ResponsiveDataView
      data={catalogs}
      columns={columns}
      emptyMessage={t('catalogs.noResults')}
      minWidth="960px"
      getRowId={(row) => row.id}
      renderMobileCard={(catalog) => (
        <MobileEntityCard
          key={catalog.id}
          title={catalog.name}
          subtitle={catalog.template?.name}
          badge={
            <StatusBadge
              label={t(`catalogStatus.${catalog.status}`)}
              status={catalogStatusMap[catalog.status]}
            />
          }
          stats={[
            {
              label: t('catalogs.calculatedPrice'),
              value: <span className="font-semibold text-brand-700">{priceOf(catalog)}</span>,
            },
            {
              label: t('catalogs.updatedAt'),
              value: formatDate(catalog.updatedAt, locale),
            },
          ]}
          actions={
            <>
              <Button
                variant="secondary"
                className="flex-1 !py-2"
                onClick={() => navigate(`/catalogs/${catalog.id}`)}
              >
                <Eye className="h-4 w-4" />
                {t('catalogs.view')}
              </Button>
              <Button variant="danger" className="!px-3" onClick={() => onDelete(catalog)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          }
        />
      )}
    />
  );
}
