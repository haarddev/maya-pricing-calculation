import type {
  ApiResponse,
  Template,
} from '../types/template.types';
import type {
  Catalog,
  CatalogPreview,
  CreateCatalogInput,
  UpdateCatalogInput,
  CatalogStatus,
} from '../types/catalog.types';
import { apiClient } from './client';

export async function listCatalogs(filters?: {
  status?: CatalogStatus;
  templateId?: string;
  customerId?: string;
  search?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<Catalog[]>>('/api/catalogs', { params: filters });
  return data.data;
}

export async function getCatalog(id: string) {
  const { data } = await apiClient.get<ApiResponse<Catalog>>(`/api/catalogs/${id}`);
  return data.data;
}

export async function createCatalog(input: CreateCatalogInput) {
  const { data } = await apiClient.post<ApiResponse<Catalog>>('/api/catalogs', input);
  return data.data;
}

export async function updateCatalog(id: string, input: UpdateCatalogInput) {
  const { data } = await apiClient.put<ApiResponse<Catalog>>(`/api/catalogs/${id}`, input);
  return data.data;
}

export async function deleteCatalog(id: string) {
  await apiClient.delete(`/api/catalogs/${id}`);
}

export async function previewCatalog(templateId: string, fieldValues: Record<string, unknown>) {
  const { data } = await apiClient.post<ApiResponse<CatalogPreview>>('/api/catalogs/preview', {
    templateId,
    fieldValues,
  });
  return data.data;
}

export async function listActiveTemplates() {
  const { data } = await apiClient.get<ApiResponse<Template[]>>('/api/catalogs/templates');
  return data.data;
}
