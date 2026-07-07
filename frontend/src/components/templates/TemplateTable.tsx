import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { PricingMethod, Template } from '../../types/template.types';
import { formatDate, getAppLocale } from '../../utils/formatDate';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { MobileEntityCard } from '../ui/MobileEntityCard';
import { ResponsiveDataView } from '../ui/ResponsiveDataView';
import { StatusBadge } from '../ui/StatusBadge';
import { TableIconButton } from '../ui/TableIconButton';

type TemplateTableProps = {
  templates: Template[];
  onDelete: (template: Template) => void;
};

const columnHelper = createColumnHelper<Template>();

export function TemplateTable({ templates, onDelete }: TemplateTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = getAppLocale(i18n.language);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => t('templates.name'),
        cell: (info) => <span className="font-medium text-slate-900">{info.getValue()}</span>,
      }),
      columnHelper.accessor('description', {
        header: () => t('templates.description'),
        cell: (info) => (
          <span className="block max-w-[220px] truncate text-slate-600" title={info.getValue()}>
            {info.getValue() || '—'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: () => t('templates.status'),
        cell: (info) => (
          <StatusBadge label={t(`status.${info.getValue()}`)} status={info.getValue()} />
        ),
      }),
      columnHelper.accessor('pricingMethod', {
        header: () => t('templates.type'),
        cell: (info) => (
          <span className="text-slate-600">
            {t(`pricingMethod.${info.getValue() as PricingMethod}`)}
          </span>
        ),
      }),
      columnHelper.accessor('fieldCount', {
        header: () => t('templates.fieldCount'),
        meta: { align: 'center' as const },
        cell: (info) => <span className="text-slate-600">{info.getValue() ?? 0}</span>,
      }),
      columnHelper.accessor('updatedAt', {
        header: () => t('templates.updatedAt'),
        cell: (info) => <span className="text-slate-600">{formatDate(info.getValue(), locale)}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => t('templates.actions'),
        meta: { align: 'center' as const },
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <TableIconButton
              icon={Eye}
              title={t('templates.view')}
              onClick={() => navigate(`/templates/${row.original.id}`)}
            />
            <TableIconButton
              icon={Pencil}
              title={t('templates.edit')}
              onClick={() => navigate(`/templates/${row.original.id}`)}
            />
            <TableIconButton
              icon={Trash2}
              title={t('templates.delete')}
              variant="danger"
              onClick={() => onDelete(row.original)}
            />
          </div>
        ),
      }),
    ],
    [locale, navigate, onDelete, t],
  );

  return (
    <ResponsiveDataView
      data={templates}
      columns={columns}
      emptyMessage={t('templates.noResults')}
      minWidth="900px"
      getRowId={(row) => row.id}
      renderMobileCard={(template) => (
        <MobileEntityCard
          key={template.id}
          title={template.name}
          subtitle={template.description || '—'}
          badge={<StatusBadge label={t(`status.${template.status}`)} status={template.status} />}
          stats={[
            {
              label: t('templates.type'),
              value: t(`pricingMethod.${template.pricingMethod as PricingMethod}`),
            },
            {
              label: t('templates.fieldCount'),
              value: template.fieldCount ?? 0,
            },
          ]}
          actions={
            <>
              <Button
                variant="secondary"
                className="flex-1 !py-2"
                onClick={() => navigate(`/templates/${template.id}`)}
              >
                <Eye className="h-4 w-4" />
                {t('templates.view')}
              </Button>
              <Button variant="danger" className="!px-3" onClick={() => onDelete(template)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          }
        />
      )}
    />
  );
}

export function EmptyTemplatesCTA({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      message={t('templates.noResults')}
      icon={Plus}
      action={{ label: t('templates.create'), onClick: onCreate }}
    />
  );
}
