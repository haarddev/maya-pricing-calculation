import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as customersApi from '../../api/customers.api';
import { queryKeys } from '../../lib/queryKeys';
import type {
  CreateCustomerInput,
  CustomerStatus,
  UpdateCustomerInput,
} from '../../types/customer.types';
import { showError, showSuccess } from '../../utils/toast';

export function useCustomers(filters: {
  search?: string;
  status?: CustomerStatus;
}) {
  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: () => customersApi.listCustomers(filters),
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ''),
    queryFn: () => customersApi.getCustomer(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customersApi.createCustomer(input),
    onSuccess: async () => {
      showSuccess('toast.customerCreated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
    onError: () => showError(),
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => customersApi.updateCustomer(id, input),
    onSuccess: async () => {
      showSuccess('toast.customerUpdated');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
    },
    onError: () => showError(),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: async () => {
      showSuccess('toast.customerDeleted');
      await queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
    onError: () => showError(),
  });
}
