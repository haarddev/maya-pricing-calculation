import { useCallback, useMemo, useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LogCategory, SystemLog } from '../../types/log.types';
import { formatPrice } from '../../utils/catalogPricing';
import { formatDateTime, getAppLocale } from '../../utils/formatDate';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { LabelBadge } from '../ui/LabelBadge';
import { ResponsiveDataView } from '../ui/ResponsiveDataView';
import { RowDetailPanel } from '../ui/RowDetailPanel';

type LogTableProps = {
  logs: SystemLog[];
  loading?: boolean;
};

const ALL_CATEGORIES: LogCategory[] = [
  'INCOMING_REQUEST',
  'OUTGOING_RESPONSE',
  'PRICING_RESULT',
  'EXTERNAL_CALLBACK',
  'ERROR',
];

const columnHelper = createColumnHelper<SystemLog>();

function formatJson(value: unknown) {
  if (!value) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function LogTable({ logs, loading }: LogTableProps) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const locale = getAppLocale(i18n.language);

  const toggleRow = useCallback((log: SystemLog) => {
    setExpandedId((current) => (current === log.id ? null : log.id));
  }, []);

  const closePanel = useCallback(() => setExpandedId(null), []);

  const priceOf = (log: SystemLog) => {
    if (log.calculatedPrice === null || log.calculatedPrice === undefined) return '—';
    const num = Number(log.calculatedPrice);
    return Number.isNaN(num) ? '—' : formatPrice(num, locale);
  };

  const renderDetailPanel = (log: SystemLog) => (
    <RowDetailPanel
      title={t('logs.detailsTitle')}
      closeLabel={t('common.close')}
      onClose={closePanel}
    >
      <LogDetailPanels log={log} t={t} />
    </RowDetailPanel>
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('category', {
        header: () => t('logs.columns.category'),
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <LabelBadge variant="brand">{t(`logs.categories.${row.original.category}`)}</LabelBadge>
            {row.original.isDummy && (
              <LabelBadge variant="warning">{t('logs.sampleData')}</LabelBadge>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('statusCode', {
        header: () => t('logs.columns.status'),
        cell: ({ row }) =>
          row.original.statusCode !== null ? (
            <LabelBadge variant="http" statusCode={row.original.statusCode}>
              {row.original.statusCode}
            </LabelBadge>
          ) : (
            '—'
          ),
      }),
      columnHelper.accessor('method', {
        header: () => t('logs.columns.method'),
        cell: (info) => <span className="text-slate-600">{info.getValue() ?? '—'}</span>,
      }),
      columnHelper.accessor('path', {
        header: () => t('logs.columns.path'),
        cell: (info) => (
          <span className="block max-w-[200px] truncate font-medium text-slate-800" title={info.getValue() ?? ''}>
            {info.getValue() ?? '—'}
          </span>
        ),
      }),
      columnHelper.accessor('durationMs', {
        header: () => t('logs.columns.duration'),
        cell: (info) => (
          <span className="text-slate-600">
            {info.getValue() !== null ? `${info.getValue()}ms` : '—'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'price',
        header: () => t('logs.columns.price'),
        cell: ({ row }) => <span className="font-medium text-brand-700">{priceOf(row.original)}</span>,
      }),
      columnHelper.accessor('createdAt', {
        header: () => t('logs.columns.time'),
        cell: (info) => (
          <span className="text-slate-500">{formatDateTime(info.getValue(), locale)}</span>
        ),
      }),
      columnHelper.display({
        id: 'expand',
        header: () => '',
        meta: { align: 'center' as const },
        cell: ({ row }) => {
          const expanded = expandedId === row.original.id;
          return (
            <span className="inline-flex text-slate-400">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          );
        },
      }),
    ],
    [expandedId, locale, priceOf, t],
  );

  if (loading) {
    return <EmptyState message={t('common.loading')} />;
  }

  return (
    <ResponsiveDataView
      data={logs}
      columns={columns}
      emptyMessage={t('logs.noResults')}
      minWidth="1100px"
      getRowId={(row) => row.id}
      expandedRowId={expandedId}
      onRowClick={toggleRow}
      renderExpandedRow={renderDetailPanel}
      renderMobileCard={(log) => {
        const expanded = expandedId === log.id;
        return (
          <Card key={log.id} className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleRow(log)}
              className={`flex w-full cursor-pointer items-start gap-3 p-4 text-start transition hover:bg-slate-50 ${
                expanded ? 'bg-brand-50/40' : ''
              }`}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <LabelBadge variant="brand">{t(`logs.categories.${log.category}`)}</LabelBadge>
                  {log.isDummy && <LabelBadge variant="warning">{t('logs.sampleData')}</LabelBadge>}
                  {log.statusCode !== null && (
                    <LabelBadge variant="http" statusCode={log.statusCode}>
                      {log.statusCode}
                    </LabelBadge>
                  )}
                  {log.method && (
                    <span className="text-xs font-medium text-slate-500">{log.method}</span>
                  )}
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">{t('logs.columns.path')}</p>
                    <p className="truncate font-medium text-slate-800">{log.path ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t('logs.columns.duration')}</p>
                    <p className="font-medium text-slate-800">
                      {log.durationMs !== null ? `${log.durationMs}ms` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t('logs.columns.price')}</p>
                    <p className="font-medium text-brand-700">{priceOf(log)}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{formatDateTime(log.createdAt, locale)}</p>
              </div>

              <div className="shrink-0 pt-1 text-slate-400">
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {expanded && (
              <div className="border-t border-slate-100 bg-slate-50/80 p-2">
                {renderDetailPanel(log)}
              </div>
            )}
          </Card>
        );
      }}
    />
  );
}

function LogDetailPanels({
  log,
  t,
}: {
  log: SystemLog;
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('logs.columns.requestBody')}
        </p>
        <pre className="max-h-48 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          {formatJson(log.requestBody)}
        </pre>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t('logs.columns.responseBody')}
        </p>
        <pre className="max-h-48 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          {formatJson(log.responseBody)}
        </pre>
      </div>
      {(log.pricingMethod || log.externalId || log.errorMessage) && (
        <div className="lg:col-span-2 flex flex-wrap gap-3 text-xs text-slate-500">
          {log.pricingMethod && (
            <span>
              {t('logs.columns.pricingMethod')}: {log.pricingMethod}
            </span>
          )}
          {log.externalId && (
            <span>
              {t('logs.columns.externalId')}: {log.externalId}
            </span>
          )}
          {log.errorMessage && (
            <span className="text-red-600">
              {t('logs.columns.error')}: {log.errorMessage}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export { ALL_CATEGORIES };
