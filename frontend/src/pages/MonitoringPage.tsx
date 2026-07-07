import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as logsApi from '../api/logs.api';
import { ALL_CATEGORIES, LogTable } from '../components/monitoring/LogTable';
import { LogStatsCards } from '../components/monitoring/LogStatsCards';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { showError } from '../utils/toast';
import type { LogCategory, LogStats, SystemLog } from '../types/log.types';

export function MonitoringPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<LogStats | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | ''>('');

  const loadData = useCallback(async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        logsApi.getLogStats(),
        logsApi.listLogs({
          category: categoryFilter || undefined,
          search: search || undefined,
          limit: 100,
        }),
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch {
      showError();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  if (loading && !stats) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            <Activity className="h-4 w-4" />
            {t('logs.badge')}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t('logs.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('logs.subtitle')}</p>
        </div>
        <Button onClick={handleRefresh} loading={refreshing} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          {t('logs.refresh')}
        </Button>
      </div>

      {stats && <LogStatsCards stats={stats} />}

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('logs.search')}
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('logs.searchPlaceholder')}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t('logs.filterCategory')}
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as LogCategory | '')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">{t('logs.allCategories')}</option>
              {ALL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`logs.categories.${category}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <LogTable logs={logs} loading={loading && !refreshing} />
    </div>
  );
}
