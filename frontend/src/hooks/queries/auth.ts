import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../../api/auth.api';
import { queryKeys } from '../../lib/queryKeys';
import type { User } from '../../types/template.types';
import { showError } from '../../utils/toast';

function readCachedUser(): User | undefined {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : undefined;
  } catch {
    return undefined;
  }
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authApi.getMe(),
    enabled: enabled && Boolean(localStorage.getItem('token')),
    initialData: readCachedUser,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
    onError: () => showError(),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onError: () => showError('settings.errors.currentPassword'),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (result) => {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      queryClient.setQueryData(queryKeys.auth.me, result.user);
    },
    onError: () => showError('auth.loginError'),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('appSettings');
    queryClient.clear();
  };
}
