import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as templatesApi from '../../api/templates.api';
import { queryKeys } from '../../lib/queryKeys';
import type { CreateFieldInput, CreateTemplateInput, PricingMethod, TemplateStatus, UpdateTemplateInput } from '../../types/template.types';
import { showError, showSuccess } from '../../utils/toast';

export function useTemplates(filters: {
  search?: string;
  status?: TemplateStatus;
  pricingMethod?: PricingMethod;
}) {
  return useQuery({
    queryKey: queryKeys.templates.list(filters),
    queryFn: () => templatesApi.listTemplates(filters),
  });
}

export function useTemplate(id?: string) {
  return useQuery({
    queryKey: queryKeys.templates.detail(id ?? ''),
    queryFn: () => templatesApi.getTemplate(id!),
    enabled: Boolean(id),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templatesApi.deleteTemplate(id),
    onSuccess: async () => {
      showSuccess('toast.templateDeleted');
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
    onError: () => showError(),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTemplateInput) => templatesApi.createTemplate(input),
    onSuccess: async () => {
      showSuccess('toast.templateCreated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
    onError: () => showError(),
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => templatesApi.updateTemplate(id, input),
    onSuccess: async () => {
      showSuccess('toast.templateUpdated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(id) });
    },
    onError: () => showError(),
  });
}

export function useAddTemplateField(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFieldInput) => templatesApi.addTemplateField(templateId, input),
    onSuccess: async () => {
      showSuccess('toast.templateFieldAdded');
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(templateId) });
    },
    onError: () => showError(),
  });
}

export function useDeleteTemplateField(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fieldId: string) => templatesApi.deleteTemplateField(templateId, fieldId),
    onSuccess: async () => {
      showSuccess('toast.templateFieldDeleted');
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(templateId) });
    },
    onError: () => showError(),
  });
}
