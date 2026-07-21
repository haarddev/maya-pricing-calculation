import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as catalogsApi from '../../api/catalogs.api';
import * as templatesApi from '../../api/templates.api';
import { queryKeys } from '../../lib/queryKeys';
import type { CreateCatalogInput, CatalogStatus, UpdateCatalogInput } from '../../types/catalog.types';
import { showError, showSuccess } from '../../utils/toast';

export function useCatalogs(filters: {
  search?: string;
  status?: CatalogStatus;
  templateId?: string;
  customerId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.catalogs.list(filters),
    queryFn: () => catalogsApi.listCatalogs(filters),
  });
}

export function useCatalogTemplates() {
  return useQuery({
    queryKey: queryKeys.catalogs.templates(),
    queryFn: () => catalogsApi.listActiveTemplates(),
  });
}

export function useCatalog(id?: string) {
  return useQuery({
    queryKey: queryKeys.catalogs.detail(id ?? ''),
    queryFn: () => catalogsApi.getCatalog(id!),
    enabled: Boolean(id),
  });
}

export function useTemplateForCatalog(templateId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.templates.detail(templateId ?? ''),
    queryFn: () => templatesApi.getTemplate(templateId!),
    enabled: Boolean(templateId) && enabled,
  });
}

export function useDeleteCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => catalogsApi.deleteCatalog(id),
    onSuccess: async () => {
      showSuccess('toast.catalogDeleted');
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.all });
    },
    onError: () => showError(),
  });
}

export function useCreateCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCatalogInput) => catalogsApi.createCatalog(input),
    onSuccess: async () => {
      showSuccess('toast.catalogCreated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.all });
    },
    onError: () => showError(),
  });
}

export function useUpdateCatalog(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCatalogInput) => catalogsApi.updateCatalog(id, input),
    onSuccess: async () => {
      showSuccess('toast.catalogUpdated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.catalogs.detail(id) });
    },
    onError: () => showError(),
  });
}
