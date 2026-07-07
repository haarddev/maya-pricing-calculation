import type { CatalogStatus } from '../types/catalog.types';
import type { LogCategory } from '../types/log.types';
import type { PricingMethod, TemplateStatus } from '../types/template.types';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  settings: {
    all: ['settings'] as const,
    public: ['settings', 'public'] as const,
  },
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: (filters: {
      search?: string;
      status?: TemplateStatus;
      pricingMethod?: PricingMethod;
    }) => [...queryKeys.templates.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.templates.all, id] as const,
  },
  catalogs: {
    all: ['catalogs'] as const,
    lists: () => [...queryKeys.catalogs.all, 'list'] as const,
    list: (filters: {
      search?: string;
      status?: CatalogStatus;
      templateId?: string;
    }) => [...queryKeys.catalogs.lists(), filters] as const,
    templates: () => [...queryKeys.catalogs.all, 'templates'] as const,
    detail: (id: string) => [...queryKeys.catalogs.all, id] as const,
  },
  logs: {
    all: ['logs'] as const,
    stats: () => [...queryKeys.logs.all, 'stats'] as const,
    lists: () => [...queryKeys.logs.all, 'list'] as const,
    list: (filters: { category?: LogCategory; search?: string; limit?: number }) =>
      [...queryKeys.logs.lists(), filters] as const,
  },
  users: {
    all: ['users'] as const,
  },
};
