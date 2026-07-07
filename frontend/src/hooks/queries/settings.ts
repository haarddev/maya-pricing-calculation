import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from '../../api/settings.api';
import { queryKeys } from '../../lib/queryKeys';
import type { AppSettings } from '../../types/settings.types';
import { showError } from '../../utils/toast';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Maya Pricing',
  jwtExpiresIn: '7d',
  loginAttemptLimit: 5,
  lockoutDurationMinutes: 15,
  allowOnlyActiveTemplates: true,
  updatedAt: new Date(0).toISOString(),
};

function readCachedSettings(): AppSettings | undefined {
  try {
    const raw = localStorage.getItem('appSettings');
    return raw ? (JSON.parse(raw) as AppSettings) : undefined;
  } catch {
    return undefined;
  }
}

export function usePublicSettings() {
  return useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: () => settingsApi.getPublicSettings(),
    staleTime: 60_000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingsApi.getSettings(),
    initialData: readCachedSettings,
    staleTime: 30_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<AppSettings>) => settingsApi.updateSettings(input),
    onSuccess: (data) => {
      localStorage.setItem('appSettings', JSON.stringify(data));
      queryClient.setQueryData(queryKeys.settings.all, data);
      queryClient.setQueryData(queryKeys.settings.public, { appName: data.appName });
    },
    onError: () => showError(),
  });
}

export { DEFAULT_SETTINGS };
