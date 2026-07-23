export type IturanVerifyTripInput = {
  travel_code: string;
  date: string;
  start_time?: string;
  driver_name: string;
  vehicle_number: string;
  billed_total?: number;
  description?: string;
  duration?: string;
};

export type IturanVehiclePrice = {
  vehicle_type: 'Bus' | 'Minibus' | 'Van';
  total_price: number | null;
  catalog_name: string | null;
  error: string | null;
};

export type IturanMethodPriceGroup = {
  key: string;
  pricing_method: string;
  label: string;
  inputs: Record<string, string | number | null>;
  customer_id: string;
  prices: IturanVehiclePrice[];
  closest_delta: number | null;
  matched_billed: boolean;
};

export type IturanVerifiedTrip = {
  travel_code: string;
  date: string;
  start_time: string | null;
  driver_name: string;
  vehicle_number: string;
  description: string | null;
  duration: string | null;
  billed_total: number | null;
  ituran_from: string | null;
  ituran_to: string | null;
  ituran_trip_count: number;
  matched: boolean;
  match_error: string | null;
  matched_trip: {
    trip_id: number;
    driver_name: string | null;
    distance: number;
    idle_mins: number;
    duration_second: number | null;
    start_timestamp: string | null;
  } | null;
  km: number | null;
  hours: number | null;
  excel_hours: number | null;
  ituran_hours: number | null;
  prices: IturanVehiclePrice[];
  method_prices: IturanMethodPriceGroup[];
  best_method: IturanMethodPriceGroup | null;
};

export type IturanVerifyResult = {
  customer_id: string;
  route_customer_id: string;
  results: IturanVerifiedTrip[];
};
