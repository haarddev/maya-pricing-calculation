import type { ApiResponse, ManagedUser, User, UserRole, UserStatus } from '../types/settings.types';
import { apiClient } from './client';

export async function listUsers() {
  const { data } = await apiClient.get<ApiResponse<ManagedUser[]>>('/api/users');
  return data.data ?? [];
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}) {
  const { data } = await apiClient.post<ApiResponse<User>>('/api/users', input);
  return data.data!;
}

export async function updateUser(
  id: string,
  input: {
    email?: string;
    name?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
  },
) {
  const { data } = await apiClient.put<ApiResponse<User>>(`/api/users/${id}`, input);
  return data.data!;
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/api/users/${id}`);
}
