import type { ApiResponse, LoginResponse, User } from '../types/template.types';
import { apiClient } from './client';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function getMe() {
  const { data } = await apiClient.get<ApiResponse<User>>('/api/auth/me');
  return data.data;
}

export async function updateProfile(input: { name?: string; email?: string }) {
  const { data } = await apiClient.put<ApiResponse<User>>('/api/auth/profile', input);
  return data.data;
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  await apiClient.put('/api/auth/password', input);
}
