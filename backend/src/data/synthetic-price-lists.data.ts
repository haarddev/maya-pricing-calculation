/**
 * Synthetic price lists + trip reports for every pricing method (except the
 * real Kivunim PRICE_BY_ROUTE data, which already exists).
 *
 * Shape mirrors the client's two Excels:
 *   - priceListRows  → "price list" Excel
 *   - trips          → "monthly report" Excel (billed amounts must match engine)
 */

import type { PricingMethod } from '@prisma/client';

export type SyntheticCatalogRow = {
  name: string;
  fieldValues: Record<string, string | number>;
};

export type SyntheticTrip = {
  date: string;
  start_time: string;
  description: string;
  /** Values used to look up / calculate the price. */
  request: Record<string, string | number>;
  /** Expected billed amount (excl. VAT) — must equal engine output. */
  billed_price: number;
  /** Optional: mark as custom quote (no catalog match expected). */
  custom?: boolean;
};

export type SyntheticMethodFixture = {
  method: PricingMethod;
  /** Unique template name (idempotent seed key). */
  templateName: string;
  description: string;
  /** Extra template fields beyond the method defaults. */
  extraFields?: Array<{
    fieldKey: string;
    labelEn: string;
    labelHe: string;
    fieldType: 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'BOOLEAN' | 'DATE' | 'TIME';
    options?: string[];
    required?: boolean;
    sortOrder: number;
  }>;
  priceListRows: SyntheticCatalogRow[];
  trips: SyntheticTrip[];
  /** Column headers for the generated price-list Excel. */
  priceListColumns: Array<{ key: string; header: string }>;
  /** Column headers for the generated trips Excel. */
  tripColumns: Array<{ key: string; header: string }>;
};

export const SYNTHETIC_FIXTURES: SyntheticMethodFixture[] = [
  // ─── 1. PRICE_BY_DESTINATION ─────────────────────────────────────────────
  {
    method: 'PRICE_BY_DESTINATION',
    templateName: 'Demo Price List - Destination & Vehicle',
    description: 'Fixed price by destination and vehicle type (excl. VAT).',
    priceListRows: [
      { name: 'Tel Aviv - Bus', fieldValues: { destination: 'Tel Aviv', vehicle_type: 'Bus', price: 1860 } },
      { name: 'Tel Aviv - Minibus', fieldValues: { destination: 'Tel Aviv', vehicle_type: 'Minibus', price: 1240 } },
      { name: 'Tel Aviv - Van', fieldValues: { destination: 'Tel Aviv', vehicle_type: 'Van', price: 980 } },
      { name: 'Jerusalem - Bus', fieldValues: { destination: 'Jerusalem', vehicle_type: 'Bus', price: 1650 } },
      { name: 'Jerusalem - Minibus', fieldValues: { destination: 'Jerusalem', vehicle_type: 'Minibus', price: 1100 } },
      { name: 'Jerusalem - Van', fieldValues: { destination: 'Jerusalem', vehicle_type: 'Van', price: 890 } },
      { name: 'Haifa - Bus', fieldValues: { destination: 'Haifa', vehicle_type: 'Bus', price: 2100 } },
      { name: 'Haifa - Minibus', fieldValues: { destination: 'Haifa', vehicle_type: 'Minibus', price: 1400 } },
      { name: 'Eilat - Bus', fieldValues: { destination: 'Eilat', vehicle_type: 'Bus', price: 3200 } },
      { name: 'Eilat - Minibus', fieldValues: { destination: 'Eilat', vehicle_type: 'Minibus', price: 2100 } },
    ],
    trips: [
      { date: '2026-06-02', start_time: '08:00', description: 'School group to Tel Aviv museum', request: { destination: 'Tel Aviv', vehicle_type: 'Bus' }, billed_price: 1860 },
      { date: '2026-06-03', start_time: '09:30', description: 'Staff transfer to Jerusalem', request: { destination: 'Jerusalem', vehicle_type: 'Minibus' }, billed_price: 1100 },
      { date: '2026-06-05', start_time: '07:00', description: 'Airport run to Haifa', request: { destination: 'Haifa', vehicle_type: 'Bus' }, billed_price: 2100 },
      { date: '2026-06-08', start_time: '06:00', description: 'Tour group to Eilat', request: { destination: 'Eilat', vehicle_type: 'Bus' }, billed_price: 3200 },
      { date: '2026-06-10', start_time: '14:00', description: 'Van to Tel Aviv office', request: { destination: 'Tel Aviv', vehicle_type: 'Van' }, billed_price: 980 },
      { date: '2026-06-12', start_time: '10:00', description: 'Minibus to Eilat hotel', request: { destination: 'Eilat', vehicle_type: 'Minibus' }, billed_price: 2100 },
      { date: '2026-06-15', start_time: '11:00', description: 'Custom VIP Tel Aviv (quoted)', request: { destination: 'Tel Aviv', vehicle_type: 'Bus' }, billed_price: 2500, custom: true },
    ],
    priceListColumns: [
      { key: 'destination', header: 'Destination' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'price', header: 'Price (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'destination', header: 'Destination' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 2. PRICE_BY_AREA ────────────────────────────────────────────────────
  {
    method: 'PRICE_BY_AREA',
    templateName: 'Demo Price List - Area & Vehicle',
    description: 'Fixed price by geographic area and vehicle type (excl. VAT).',
    priceListRows: [
      { name: 'Center - Bus', fieldValues: { area_name: 'Center', vehicle_type: 'Bus', price: 900 } },
      { name: 'Center - Minibus', fieldValues: { area_name: 'Center', vehicle_type: 'Minibus', price: 620 } },
      { name: 'Center - Van', fieldValues: { area_name: 'Center', vehicle_type: 'Van', price: 480 } },
      { name: 'North - Bus', fieldValues: { area_name: 'North', vehicle_type: 'Bus', price: 1400 } },
      { name: 'North - Minibus', fieldValues: { area_name: 'North', vehicle_type: 'Minibus', price: 950 } },
      { name: 'South - Bus', fieldValues: { area_name: 'South', vehicle_type: 'Bus', price: 1100 } },
      { name: 'South - Minibus', fieldValues: { area_name: 'South', vehicle_type: 'Minibus', price: 750 } },
      { name: 'Jerusalem Corridor - Bus', fieldValues: { area_name: 'Jerusalem Corridor', vehicle_type: 'Bus', price: 1200 } },
      { name: 'Jerusalem Corridor - Van', fieldValues: { area_name: 'Jerusalem Corridor', vehicle_type: 'Van', price: 650 } },
    ],
    trips: [
      { date: '2026-06-01', start_time: '08:00', description: 'Center area school run', request: { area_name: 'Center', vehicle_type: 'Bus' }, billed_price: 900 },
      { date: '2026-06-04', start_time: '09:00', description: 'North region tour', request: { area_name: 'North', vehicle_type: 'Minibus' }, billed_price: 950 },
      { date: '2026-06-07', start_time: '07:30', description: 'South logistics', request: { area_name: 'South', vehicle_type: 'Bus' }, billed_price: 1100 },
      { date: '2026-06-09', start_time: '13:00', description: 'Jerusalem Corridor shuttle', request: { area_name: 'Jerusalem Corridor', vehicle_type: 'Bus' }, billed_price: 1200 },
      { date: '2026-06-11', start_time: '10:00', description: 'Center van transfer', request: { area_name: 'Center', vehicle_type: 'Van' }, billed_price: 480 },
      { date: '2026-06-14', start_time: '16:00', description: 'Custom North weekend (quoted)', request: { area_name: 'North', vehicle_type: 'Bus' }, billed_price: 1800, custom: true },
    ],
    priceListColumns: [
      { key: 'area_name', header: 'Area Name' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'price', header: 'Price (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'area_name', header: 'Area' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 3. PRICE_BY_PASSENGERS ──────────────────────────────────────────────
  {
    method: 'PRICE_BY_PASSENGERS',
    templateName: 'Demo Price List - Passenger Tier & Vehicle',
    description: 'Fixed price by passenger tier and vehicle type (excl. VAT).',
    priceListRows: [
      { name: 'Up to 2 - Sedan', fieldValues: { passenger_tier: 'Up to 2', vehicle_type: 'Sedan', price: 220 } },
      { name: 'Up to 2 - Van', fieldValues: { passenger_tier: 'Up to 2', vehicle_type: 'Van', price: 280 } },
      { name: 'Up to 4 - Sedan', fieldValues: { passenger_tier: 'Up to 4', vehicle_type: 'Sedan', price: 320 } },
      { name: 'Up to 4 - Van', fieldValues: { passenger_tier: 'Up to 4', vehicle_type: 'Van', price: 380 } },
      { name: 'Larger group - Minibus', fieldValues: { passenger_tier: 'Larger group', vehicle_type: 'Minibus', price: 650 } },
      { name: 'Larger group - Bus', fieldValues: { passenger_tier: 'Larger group', vehicle_type: 'Bus', price: 980 } },
    ],
    trips: [
      { date: '2026-06-02', start_time: '09:00', description: '2 pax airport sedan', request: { passenger_tier: 'Up to 2', vehicle_type: 'Sedan' }, billed_price: 220 },
      { date: '2026-06-03', start_time: '10:00', description: '4 pax city van', request: { passenger_tier: 'Up to 4', vehicle_type: 'Van' }, billed_price: 380 },
      { date: '2026-06-06', start_time: '08:00', description: 'Class trip minibus', request: { passenger_tier: 'Larger group', vehicle_type: 'Minibus' }, billed_price: 650 },
      { date: '2026-06-08', start_time: '07:00', description: 'Full bus group', request: { passenger_tier: 'Larger group', vehicle_type: 'Bus' }, billed_price: 980 },
      { date: '2026-06-10', start_time: '12:00', description: 'Couple sedan transfer', request: { passenger_tier: 'Up to 2', vehicle_type: 'Van' }, billed_price: 280 },
    ],
    priceListColumns: [
      { key: 'passenger_tier', header: 'Passenger Tier' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'price', header: 'Price (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'passenger_tier', header: 'Passenger Tier' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 4. PRICE_BY_SKU ─────────────────────────────────────────────────────
  {
    method: 'PRICE_BY_SKU',
    templateName: 'Demo Price List - SKU Catalog',
    description: 'Fixed price by SKU / catalog number (excl. VAT).',
    priceListRows: [
      { name: 'SKU-CITY-01', fieldValues: { sku: 'SKU-CITY-01', price: 150 } },
      { name: 'SKU-CITY-02', fieldValues: { sku: 'SKU-CITY-02', price: 210 } },
      { name: 'SKU-INTERCITY-01', fieldValues: { sku: 'SKU-INTERCITY-01', price: 890 } },
      { name: 'SKU-INTERCITY-02', fieldValues: { sku: 'SKU-INTERCITY-02', price: 1250 } },
      { name: 'SKU-TOUR-DAY', fieldValues: { sku: 'SKU-TOUR-DAY', price: 2400 } },
      { name: 'SKU-SHUTTLE-EVT', fieldValues: { sku: 'SKU-SHUTTLE-EVT', price: 680 } },
    ],
    trips: [
      { date: '2026-06-01', start_time: '08:30', description: 'City hop A', request: { sku: 'SKU-CITY-01' }, billed_price: 150 },
      { date: '2026-06-02', start_time: '09:00', description: 'City hop B', request: { sku: 'SKU-CITY-02' }, billed_price: 210 },
      { date: '2026-06-04', start_time: '07:00', description: 'Intercity A', request: { sku: 'SKU-INTERCITY-01' }, billed_price: 890 },
      { date: '2026-06-05', start_time: '06:30', description: 'Intercity B', request: { sku: 'SKU-INTERCITY-02' }, billed_price: 1250 },
      { date: '2026-06-07', start_time: '08:00', description: 'Full day tour', request: { sku: 'SKU-TOUR-DAY' }, billed_price: 2400 },
      { date: '2026-06-09', start_time: '18:00', description: 'Event shuttle', request: { sku: 'SKU-SHUTTLE-EVT' }, billed_price: 680 },
      { date: '2026-06-12', start_time: '11:00', description: 'One-off SKU quote', request: { sku: 'SKU-CITY-01' }, billed_price: 300, custom: true },
    ],
    priceListColumns: [
      { key: 'sku', header: 'SKU / Catalog Number' },
      { key: 'price', header: 'Price (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'sku', header: 'SKU' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 5. PRICE_BY_HOURS ───────────────────────────────────────────────────
  {
    method: 'PRICE_BY_HOURS',
    templateName: 'Demo Price List - Hourly Rates',
    description: 'Hourly charter rates by vehicle type. Trip total = hours × rate.',
    extraFields: [
      {
        fieldKey: 'vehicle_type',
        labelEn: 'Vehicle Type',
        labelHe: 'סוג רכב',
        fieldType: 'DROPDOWN',
        options: ['Sedan', 'Van', 'Bus', 'Minibus'],
        required: true,
        sortOrder: 0,
      },
    ],
    priceListRows: [
      // hours=1 stored as unit; calculated_price = rate when hours missing in calc,
      // but we store hours=1 so catalog calculated_price = price_per_hour
      { name: 'Bus hourly', fieldValues: { vehicle_type: 'Bus', hours: 1, price_per_hour: 280 } },
      { name: 'Minibus hourly', fieldValues: { vehicle_type: 'Minibus', hours: 1, price_per_hour: 190 } },
      { name: 'Van hourly', fieldValues: { vehicle_type: 'Van', hours: 1, price_per_hour: 150 } },
      { name: 'Sedan hourly', fieldValues: { vehicle_type: 'Sedan', hours: 1, price_per_hour: 120 } },
    ],
    trips: [
      { date: '2026-06-02', start_time: '08:00', description: '4h bus charter', request: { vehicle_type: 'Bus', hours: 4 }, billed_price: 1120 },
      { date: '2026-06-03', start_time: '09:00', description: '3h minibus', request: { vehicle_type: 'Minibus', hours: 3 }, billed_price: 570 },
      { date: '2026-06-05', start_time: '10:00', description: '2h van', request: { vehicle_type: 'Van', hours: 2 }, billed_price: 300 },
      { date: '2026-06-08', start_time: '07:00', description: '6h sedan VIP', request: { vehicle_type: 'Sedan', hours: 6 }, billed_price: 720 },
      { date: '2026-06-10', start_time: '14:00', description: '8h bus tour', request: { vehicle_type: 'Bus', hours: 8 }, billed_price: 2240 },
      { date: '2026-06-13', start_time: '11:00', description: 'Custom 5h bus quote', request: { vehicle_type: 'Bus', hours: 5 }, billed_price: 1600, custom: true },
    ],
    priceListColumns: [
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'price_per_hour', header: 'Price per Hour (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'hours', header: 'Hours' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 6. PRICE_BY_MINUTES ─────────────────────────────────────────────────
  {
    method: 'PRICE_BY_MINUTES',
    templateName: 'Demo Price List - Per-Minute Rates',
    description: 'Per-minute waiting / idle rates by vehicle. Trip total = minutes × rate.',
    extraFields: [
      {
        fieldKey: 'vehicle_type',
        labelEn: 'Vehicle Type',
        labelHe: 'סוג רכב',
        fieldType: 'DROPDOWN',
        options: ['Sedan', 'Van', 'Bus', 'Minibus'],
        required: true,
        sortOrder: 0,
      },
    ],
    priceListRows: [
      { name: 'Bus per minute', fieldValues: { vehicle_type: 'Bus', minutes: 1, price_per_minute: 4.5 } },
      { name: 'Minibus per minute', fieldValues: { vehicle_type: 'Minibus', minutes: 1, price_per_minute: 3.2 } },
      { name: 'Van per minute', fieldValues: { vehicle_type: 'Van', minutes: 1, price_per_minute: 2.5 } },
      { name: 'Sedan per minute', fieldValues: { vehicle_type: 'Sedan', minutes: 1, price_per_minute: 2.0 } },
    ],
    trips: [
      { date: '2026-06-02', start_time: '08:00', description: '30 min bus wait', request: { vehicle_type: 'Bus', minutes: 30 }, billed_price: 135 },
      { date: '2026-06-04', start_time: '09:00', description: '45 min minibus idle', request: { vehicle_type: 'Minibus', minutes: 45 }, billed_price: 144 },
      { date: '2026-06-06', start_time: '10:00', description: '20 min van wait', request: { vehicle_type: 'Van', minutes: 20 }, billed_price: 50 },
      { date: '2026-06-09', start_time: '11:00', description: '60 min sedan stand-by', request: { vehicle_type: 'Sedan', minutes: 60 }, billed_price: 120 },
      { date: '2026-06-11', start_time: '15:00', description: '90 min bus hold', request: { vehicle_type: 'Bus', minutes: 90 }, billed_price: 405 },
    ],
    priceListColumns: [
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'price_per_minute', header: 'Price per Minute (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'minutes', header: 'Minutes' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 7. PRICE_BY_DISTANCE ────────────────────────────────────────────────
  {
    method: 'PRICE_BY_DISTANCE',
    templateName: 'Demo Price List - Distance (per km by line)',
    description: 'Per-km rate by route/line number. Trip total = km × rate.',
    priceListRows: [
      { name: 'Line 5', fieldValues: { route_number: '5', price_per_km: 4.5 } },
      { name: 'Line 12', fieldValues: { route_number: '12', price_per_km: 5.2 } },
      { name: 'Line 21', fieldValues: { route_number: '21', price_per_km: 3.8 } },
      { name: 'Line 40', fieldValues: { route_number: '40', price_per_km: 6.0 } },
      { name: 'Line 100', fieldValues: { route_number: '100', price_per_km: 7.5 } },
    ],
    trips: [
      { date: '2026-06-01', start_time: '08:00', description: 'Line 5 — 40 km', request: { route_number: '5', km: 40 }, billed_price: 180 },
      { date: '2026-06-03', start_time: '09:00', description: 'Line 12 — 25 km', request: { route_number: '12', km: 25 }, billed_price: 130 },
      { date: '2026-06-05', start_time: '07:30', description: 'Line 21 — 60 km', request: { route_number: '21', km: 60 }, billed_price: 228 },
      { date: '2026-06-08', start_time: '06:00', description: 'Line 40 — 80 km', request: { route_number: '40', km: 80 }, billed_price: 480 },
      { date: '2026-06-10', start_time: '10:00', description: 'Line 100 — 120 km', request: { route_number: '100', km: 120 }, billed_price: 900 },
      { date: '2026-06-14', start_time: '12:00', description: 'Line 5 custom quote', request: { route_number: '5', km: 40 }, billed_price: 250, custom: true },
    ],
    priceListColumns: [
      { key: 'route_number', header: 'Route / Line Number' },
      { key: 'price_per_km', header: 'Price per Kilometer (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'route_number', header: 'Route / Line Number' },
      { key: 'km', header: 'Kilometers' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },

  // ─── 8. PRICE_BY_KM_AND_HOURS ────────────────────────────────────────────
  {
    method: 'PRICE_BY_KM_AND_HOURS',
    templateName: 'Demo Price List - Km + Hours Combined',
    description: 'Combined km + hourly rates by vehicle. Trip total = km×kmRate + hours×hourRate.',
    extraFields: [
      {
        fieldKey: 'vehicle_type',
        labelEn: 'Vehicle Type',
        labelHe: 'סוג רכב',
        fieldType: 'DROPDOWN',
        options: ['Sedan', 'Van', 'Bus', 'Minibus'],
        required: true,
        sortOrder: 0,
      },
    ],
    priceListRows: [
      // Catalog stores unit rates (km=1, hours=1) so calculated_price = sum of rates
      { name: 'Bus km+hours', fieldValues: { vehicle_type: 'Bus', km: 1, hours: 1, price_per_km: 3.5, price_per_hour: 200 } },
      { name: 'Minibus km+hours', fieldValues: { vehicle_type: 'Minibus', km: 1, hours: 1, price_per_km: 2.8, price_per_hour: 150 } },
      { name: 'Van km+hours', fieldValues: { vehicle_type: 'Van', km: 1, hours: 1, price_per_km: 2.2, price_per_hour: 120 } },
      { name: 'Sedan km+hours', fieldValues: { vehicle_type: 'Sedan', km: 1, hours: 1, price_per_km: 1.8, price_per_hour: 100 } },
    ],
    trips: [
      // Bus: 50*3.5 + 3*200 = 175 + 600 = 775
      { date: '2026-06-02', start_time: '08:00', description: 'Bus 50km / 3h', request: { vehicle_type: 'Bus', km: 50, hours: 3 }, billed_price: 775 },
      // Minibus: 30*2.8 + 2*150 = 84 + 300 = 384
      { date: '2026-06-04', start_time: '09:00', description: 'Minibus 30km / 2h', request: { vehicle_type: 'Minibus', km: 30, hours: 2 }, billed_price: 384 },
      // Van: 20*2.2 + 4*120 = 44 + 480 = 524
      { date: '2026-06-07', start_time: '10:00', description: 'Van 20km / 4h', request: { vehicle_type: 'Van', km: 20, hours: 4 }, billed_price: 524 },
      // Sedan: 100*1.8 + 5*100 = 180 + 500 = 680
      { date: '2026-06-09', start_time: '07:00', description: 'Sedan 100km / 5h', request: { vehicle_type: 'Sedan', km: 100, hours: 5 }, billed_price: 680 },
      // Bus: 80*3.5 + 6*200 = 280 + 1200 = 1480
      { date: '2026-06-12', start_time: '06:00', description: 'Bus 80km / 6h day tour', request: { vehicle_type: 'Bus', km: 80, hours: 6 }, billed_price: 1480 },
    ],
    priceListColumns: [
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'price_per_km', header: 'Price per Km (excl. VAT)' },
      { key: 'price_per_hour', header: 'Price per Hour (excl. VAT)' },
    ],
    tripColumns: [
      { key: 'date', header: 'Date' },
      { key: 'start_time', header: 'Start Time' },
      { key: 'description', header: 'Description' },
      { key: 'vehicle_type', header: 'Vehicle Type' },
      { key: 'km', header: 'Kilometers' },
      { key: 'hours', header: 'Hours' },
      { key: 'billed_price', header: 'Total per customer - before VAT' },
    ],
  },
];

export function getFixtureByMethod(method: PricingMethod) {
  return SYNTHETIC_FIXTURES.find((f) => f.method === method);
}

export function getFixtureByTemplateName(name: string) {
  return SYNTHETIC_FIXTURES.find((f) => f.templateName === name);
}
