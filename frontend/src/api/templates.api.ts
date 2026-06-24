import type {
  ApiResponse,
  CreateFieldInput,
  CreateTemplateInput,
  PricingMethod,
  Template,
  TemplateStatus,
  UpdateTemplateInput,
} from '../types/template.types';
import { apiClient } from './client';

export async function listTemplates(filters?: {
  status?: TemplateStatus;
  pricingMethod?: PricingMethod;
  search?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<Template[]>>('/api/templates', {
    params: filters,
  });
  return data.data;
}

export async function getTemplate(id: string) {
  const { data } = await apiClient.get<ApiResponse<Template>>(`/api/templates/${id}`);
  return data.data;
}

export async function createTemplate(input: CreateTemplateInput) {
  const { data } = await apiClient.post<ApiResponse<Template>>('/api/templates', input);
  return data.data;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput) {
  const { data } = await apiClient.put<ApiResponse<Template>>(`/api/templates/${id}`, input);
  return data.data;
}

export async function deleteTemplate(id: string) {
  await apiClient.delete(`/api/templates/${id}`);
}

export async function addTemplateField(templateId: string, input: CreateFieldInput) {
  const { data } = await apiClient.post(`/api/templates/${templateId}/fields`, input);
  return data.data;
}

export async function deleteTemplateField(templateId: string, fieldId: string) {
  await apiClient.delete(`/api/templates/${templateId}/fields/${fieldId}`);
}
