import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../../api/users.api';
import { queryKeys } from '../../lib/queryKeys';
import type { UserRole, UserStatus } from '../../types/settings.types';
import { showError, showSuccess } from '../../utils/toast';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersApi.listUsers(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: async () => {
      showSuccess('settings.toast.userCreated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: () => showError(),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: {
        email?: string;
        name?: string;
        role?: UserRole;
        status?: UserStatus;
        password?: string;
      };
    }) => usersApi.updateUser(id, input),
    onSuccess: async () => {
      showSuccess('settings.toast.userUpdated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: () => showError(),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: async () => {
      showSuccess('settings.toast.userDeleted');
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: () => showError(),
  });
}
