import { useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { PricingMethod, Template } from '../../types/template.types';
import { formatDate, getAppLocale } from '../../utils/formatDate';
import { downloadTemplateById } from '../../utils/templateExport';
import { showError } from '../../utils/toast';
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (template: Template) => {
    setDownloadingId(template.id);
    try {
      await downloadTemplateById(template.id, 'json', t);
    } catch {
      showError();
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: () => t('templates.name'),
        cell: (info) => (
          <span className="block min-w-[180px] whitespace-normal break-words font-medium text-slate-900">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: () => t('templates.description'),
        cell: (info) => (
          <span className="block min-w-[220px] whitespace-normal break-words text-slate-600">
            {info.getValue() || '—'}
          </span>
        ),
      }),
      columnHelper.accessor('supplementsAdditions', {
        header: () => t('templates.supplementsAdditions'),
        cell: (info) => (
          <span className="block min-w-[220px] whitespace-normal break-words text-slate-600">
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
          <span className="block min-w-[140px] whitespace-normal break-words text-slate-600">
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
        enableSorting: false,
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
              icon={Download}
              title={t('templates.download')}
              disabled={downloadingId === row.original.id}
              onClick={() => void handleDownload(row.original)}
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
    [downloadingId, locale, navigate, onDelete, t],
  );

  return (
    <ResponsiveDataView
      data={templates}
      columns={columns}
      emptyMessage={t('templates.noResults')}
      minWidth="1100px"
      getRowId={(row) => row.id}
      renderMobileCard={(template) => (
        <MobileEntityCard
          key={template.id}
          title={template.name}
          subtitle={
            [template.description, template.supplementsAdditions].filter(Boolean).join(' · ') || '—'
          }
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
              <Button
                variant="secondary"
                className="!px-3"
                disabled={downloadingId === template.id}
                onClick={() => void handleDownload(template)}
              >
                <Download className="h-4 w-4" />
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
