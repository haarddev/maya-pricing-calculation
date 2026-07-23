export type PricingMethod =
  | 'PRICE_BY_DESTINATION'
  | 'PRICE_BY_HOURS'
  | 'PRICE_BY_ROUTE'
  | 'PRICE_BY_DISTANCE'
  | 'PRICE_BY_AREA'
  | 'PRICE_BY_PASSENGERS'
  | 'PRICE_BY_SKU'
  | 'PRICE_BY_MINUTES'
  | 'PRICE_BY_KM_AND_HOURS';

export type CalculatePriceInput = {
  customer_id: string;
  pricing_method?: PricingMethod;
  template_id?: string;
  values?: Record<string, string | number | boolean>;
  route_name?: string;
  vehicle_type?: string;
  start_time?: string;
  quantity?: number;
};

export type CalculatePriceResult = {
  customer_id: string;
  customer_name: string;
  catalog_id: string;
  catalog_name: string;
  template_id: string;
  template_name: string;
  pricing_method: PricingMethod;
  matched_fields: Record<string, unknown>;
  unit_price: number;
  quantity: number;
  total_price: number;
  route_name: string | null;
  route_name_en: string | null;
  vehicle_type: string | null;
};

export type ReportTripStatus = 'match' | 'mismatch' | 'custom';

export type ReportValidationRow = {
  date: string;
  startTime: string | null;
  description: string;
  vehicleRaw: string;
  vehicle: string | null;
  billedPrice: number;
  enginePrice: number | null;
  catalogName: string | null;
  status: ReportTripStatus;
  request?: Record<string, string | number | boolean>;
};

export type ReportValidationResult = {
  source: string;
  summary: {
    total: number;
    covered: number;
    matched: number;
    mismatched: number;
    custom: number;
  };
  trips: ReportValidationRow[];
};

export type PricingMethodInfo = {
  method: PricingMethod | 'KIVUNIM';
  label: string;
  hasKivunim: boolean;
};
