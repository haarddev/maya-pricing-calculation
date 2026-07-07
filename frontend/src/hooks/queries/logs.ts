import { useQuery } from '@tanstack/react-query';
import * as logsApi from '../../api/logs.api';
import { queryKeys } from '../../lib/queryKeys';
import type { LogCategory } from '../../types/log.types';

export function useLogStats() {
  return useQuery({
    queryKey: queryKeys.logs.stats(),
    queryFn: () => logsApi.getLogStats(),
  });
}

export function useLogs(filters: {
  category?: LogCategory;
  search?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.logs.list(filters),
    queryFn: () => logsApi.listLogs(filters),
  });
}
