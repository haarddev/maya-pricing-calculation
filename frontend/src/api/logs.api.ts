import type { ApiResponse, LogCategory, LogStats, SystemLog } from '../types/log.types';
import { apiClient } from './client';

export async function getLogStats() {
  const { data } = await apiClient.get<ApiResponse<LogStats>>('/api/logs/stats');
  return data.data!;
}

export async function listLogs(filters?: {
  category?: LogCategory;
  search?: string;
  isDummy?: boolean;
  limit?: number;
}) {
  const { data } = await apiClient.get<ApiResponse<SystemLog[]>>('/api/logs', { params: filters });
  return data.data ?? [];
}
