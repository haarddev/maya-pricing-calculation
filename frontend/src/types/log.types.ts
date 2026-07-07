export type LogCategory =
  | 'INCOMING_REQUEST'
  | 'OUTGOING_RESPONSE'
  | 'PRICING_RESULT'
  | 'EXTERNAL_CALLBACK'
  | 'ERROR';

export type SystemLog = {
  id: string;
  category: LogCategory;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  source: string | null;
  externalId: string | null;
  pricingMethod: string | null;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  calculatedPrice: string | number | null;
  durationMs: number | null;
  errorMessage: string | null;
  isDummy: boolean;
  userId: string | null;
  createdAt: string;
};

export type LogStats = {
  categoryCounts: Partial<Record<LogCategory, number>>;
  avgCalculationMs: number;
  pricingCalculations: number;
  errorCount: number;
  requestsLast24h: number;
  successRate: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
