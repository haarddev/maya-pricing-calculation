import type { ApiResponse } from '../types/template.types';
import type {
  CreateCustomerInput,
  Customer,
  CustomerStatus,
  UpdateCustomerInput,
} from '../types/customer.types';
import { apiClient } from './client';

export async function listCustomers(filters?: {
  status?: CustomerStatus;
  search?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<Customer[]>>('/api/customers', {
    params: filters,
  });
  return data.data;
}

export async function getCustomer(id: string) {
  const { data } = await apiClient.get<ApiResponse<Customer>>(`/api/customers/${id}`);
  return data.data;
}

export async function createCustomer(input: CreateCustomerInput) {
  const { data } = await apiClient.post<ApiResponse<Customer>>('/api/customers', input);
  return data.data;
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const { data } = await apiClient.put<ApiResponse<Customer>>(`/api/customers/${id}`, input);
  return data.data;
}

export async function deleteCustomer(id: string) {
  await apiClient.delete(`/api/customers/${id}`);
}
