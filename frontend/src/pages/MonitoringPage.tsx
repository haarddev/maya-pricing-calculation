import { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { ALL_CATEGORIES, LogTable } from '../components/monitoring/LogTable';
import { LogStatsCards } from '../components/monitoring/LogStatsCards';
import { Button } from '../components/ui/Button';
import { FetchingWrapper } from '../components/ui/FetchingWrapper';
import { FilterBar } from '../components/ui/FilterBar';
import { PageBadge } from '../components/ui/PageBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { SearchInput } from '../components/ui/SearchInput';
import { Select } from '../components/ui/Select';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLogStats, useLogs } from '../hooks/queries/logs';
import { queryKeys } from '../lib/queryKeys';
import type { LogCategory } from '../types/log.types';

export function MonitoringPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | ''>('');
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const logFilters = {
    category: categoryFilter || undefined,
    search: debouncedSearch || undefined,
    limit: 100,
  };

  const { data: stats, isLoading: statsLoading } = useLogStats();
  const { data: logs = [], isLoading: logsLoading, isFetching } = useLogs(logFilters);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.logs.stats() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.logs.lists() }),
    ]);
    setRefreshing(false);
  };

  const loading = statsLoading && !stats;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<PageBadge icon={Activity} label={t('logs.badge')} />}
        title={t('logs.title')}
        subtitle={t('logs.subtitle')}
        actions={
          <Button onClick={() => void handleRefresh()} loading={refreshing} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4" />
            {t('logs.refresh')}
          </Button>
        }
      />

      {stats && <LogStatsCards stats={stats} />}

      <FilterBar columns={2}>
        <SearchInput
          label={t('logs.search')}
          value={search}
          onChange={setSearch}
          placeholder={t('logs.searchPlaceholder')}
        />
        <Select
          label={t('logs.filterCategory')}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as LogCategory | '')}
          options={[
            { value: '', label: t('logs.allCategories') },
            ...ALL_CATEGORIES.map((category) => ({
              value: category,
              label: t(`logs.categories.${category}`),
            })),
          ]}
        />
      </FilterBar>

      <FetchingWrapper isFetching={isFetching && !logsLoading}>
        <LogTable logs={logs} loading={logsLoading && !refreshing} />
      </FetchingWrapper>
    </div>
  );
}
