import type { ApiResponse } from '../types/template.types';
import type { IturanVerifyResult, IturanVerifyTripInput } from '../types/ituran.types';
import { apiClient } from './client';

export async function verifyTrips(input: {
  customer_id?: string;
  trips: IturanVerifyTripInput[];
}) {
  const { data } = await apiClient.post<ApiResponse<IturanVerifyResult>>(
    '/api/ituran/verify-trips',
    input,
  );
  return data.data;
}
