import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { usePublicSettings, useSettings, useUpdateSettings } from '../hooks/queries/settings';
import type { AppSettings } from '../types/settings.types';

type SettingsContextValue = {
  settings: AppSettings | undefined;
  appName: string;
  loading: boolean;
  updateAppSettings: (input: Partial<AppSettings>) => Promise<AppSettings>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const DEFAULT_APP_NAME = 'Maya Pricing';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const hasToken = Boolean(localStorage.getItem('token'));
  const settingsQuery = useSettings();
  const publicQuery = usePublicSettings();
  const updateMutation = useUpdateSettings();

  const settings = hasToken ? settingsQuery.data : undefined;
  const appName = settings?.appName ?? publicQuery.data?.appName ?? DEFAULT_APP_NAME;
  const loading = hasToken ? settingsQuery.isLoading && !settingsQuery.data : publicQuery.isLoading;

  const value = useMemo(
    () => ({
      settings,
      appName,
      loading,
      updateAppSettings: (input: Partial<AppSettings>) => updateMutation.mutateAsync(input),
    }),
    [settings, appName, loading, updateMutation],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within SettingsProvider');
  }
  return context;
}

// Backward-compatible alias
export const useSettingsContext = useAppSettings;
