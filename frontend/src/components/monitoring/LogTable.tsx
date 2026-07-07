import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LogCategory, SystemLog } from '../../types/log.types';
import { Card } from '../ui/Card';
import { formatPrice } from '../../utils/catalogPricing';

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

function statusColor(code: number | null) {
  if (!code) return 'bg-slate-100 text-slate-700';
  if (code >= 500) return 'bg-red-100 text-red-800';
  if (code >= 400) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

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
  const isHebrew = i18n.language.startsWith('he');

  const formatDate = (date: string) =>
    new Date(date).toLocaleString(isHebrew ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const priceOf = (log: SystemLog) => {
    if (log.calculatedPrice === null || log.calculatedPrice === undefined) return '—';
    const num = Number(log.calculatedPrice);
    return Number.isNaN(num) ? '—' : formatPrice(num, isHebrew ? 'he' : 'en');
  };

  if (loading) {
    return (
      <Card className="py-16 text-center">
        <p className="text-slate-500">{t('common.loading')}</p>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="py-16 text-center">
        <p className="text-slate-500">{t('logs.noResults')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const expanded = expandedId === log.id;
        return (
          <Card key={log.id} className="!p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : log.id)}
              className="flex w-full items-start gap-3 p-4 text-start transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700">
                    {t(`logs.categories.${log.category}`)}
                  </span>
                  {log.isDummy && (
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      {t('logs.sampleData')}
                    </span>
                  )}
                  {log.statusCode !== null && (
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusColor(log.statusCode)}`}
                    >
                      {log.statusCode}
                    </span>
                  )}
                  {log.method && (
                    <span className="text-xs font-medium text-slate-500">{log.method}</span>
                  )}
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">{t('logs.columns.path')}</p>
                    <p className="truncate font-medium text-slate-800">{log.path ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t('logs.columns.source')}</p>
                    <p className="truncate font-medium text-slate-800">{log.source ?? '—'}</p>
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

                {(log.pricingMethod || log.externalId || log.errorMessage) && (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
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

                <p className="text-xs text-slate-400">{formatDate(log.createdAt)}</p>
              </div>

              <div className="shrink-0 pt-1 text-slate-400">
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </button>

            {expanded && (
              <div className="border-t border-slate-100 bg-slate-50 p-4">
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
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export { ALL_CATEGORIES };
