import type { ApiResponse, AppSettings, PublicSettings } from '../types/settings.types';
import { apiClient } from './client';

export async function getPublicSettings() {
  const { data } = await apiClient.get<ApiResponse<PublicSettings>>('/api/settings/public');
  return data.data!;
}

export async function getSettings() {
  const { data } = await apiClient.get<ApiResponse<AppSettings>>('/api/settings');
  return data.data!;
}

export async function updateSettings(input: Partial<AppSettings>) {
  const { data } = await apiClient.put<ApiResponse<AppSettings>>('/api/settings', input);
  return data.data!;
}
