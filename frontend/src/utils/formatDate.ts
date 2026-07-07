export type AppLocale = 'he' | 'en';

export function getAppLocale(language: string): AppLocale {
  return language.startsWith('he') ? 'he' : 'en';
}

export function formatDate(date: string, locale: AppLocale): string {
  return new Date(date).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string, locale: AppLocale): string {
  return new Date(date).toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
