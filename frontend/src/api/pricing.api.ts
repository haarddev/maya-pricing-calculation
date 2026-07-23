import type { ApiResponse } from '../types/template.types';
import type {
  CalculatePriceInput,
  CalculatePriceResult,
  PricingMethod,
  PricingMethodInfo,
  ReportValidationResult,
} from '../types/pricing.types';
import { apiClient } from './client';

export async function calculatePrice(input: CalculatePriceInput) {
  const { data } = await apiClient.post<ApiResponse<CalculatePriceResult>>(
    '/api/pricing/calculate',
    input,
  );
  return data.data;
}

export async function validateReport(method?: PricingMethod | 'KIVUNIM') {
  const { data } = await apiClient.get<ApiResponse<ReportValidationResult>>('/api/pricing/validate-report', {
    params: method ? { method } : undefined,
  });
  return data.data;
}

export async function listPricingMethods() {
  const { data } = await apiClient.get<ApiResponse<PricingMethodInfo[]>>('/api/pricing/methods');
  return data.data;
}
