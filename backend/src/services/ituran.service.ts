import { LogCategory } from '@prisma/client';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { createLog } from './log.service.js';

export type IturanTripLocation = {
  location?: {
    point?: { lat?: number; lon?: number };
    address?: { location?: string; speedlimit?: number };
  };
  odometer?: number;
  timestamp?: string;
};

export type IturanTrip = {
  trip_id: number;
  license_plate: string;
  driver_code?: number;
  driver_name?: string;
  driver_source?: number;
  start_location?: IturanTripLocation;
  end_location?: IturanTripLocation;
  duration_second?: number;
  distance?: number;
  top_speed?: number;
  idle_mins?: number;
};

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
};

type TripsResponse = {
  meta?: {
    pagination?: {
      page_number: number;
      page_size: number;
      total_count: number;
      page_count: number;
    };
  };
  trips?: IturanTrip[];
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

function requireCredentials() {
  if (!env.ITURAN_USERNAME || !env.ITURAN_PASSWORD) {
    throw new AppError(
      500,
      'Ituran credentials are not configured. Set ITURAN_USERNAME and ITURAN_PASSWORD in .env',
    );
  }
  return {
    username: env.ITURAN_USERNAME,
    password: env.ITURAN_PASSWORD,
    baseUrl: env.ITURAN_BASE_URL.replace(/\/$/, ''),
  };
}

function isTokenValid() {
  return cachedToken !== null && Date.now() < cachedToken.expiresAt;
}

export async function login(force = false): Promise<string> {
  if (!force && isTokenValid() && cachedToken) {
    return cachedToken.accessToken;
  }

  const { username, password, baseUrl } = requireCredentials();
  const start = Date.now();
  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    code: '',
    code_verifier: '',
    refresh_token: '',
    scope: '',
  });

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await response.text();
  let data: TokenResponse | { error?: string; message?: string };
  try {
    data = JSON.parse(text) as TokenResponse;
  } catch {
    void createLog({
      category: LogCategory.EXTERNAL_CALLBACK,
      method: 'POST',
      path: '/oauth/token',
      statusCode: response.status,
      source: 'ituran',
      errorMessage: `Non-JSON token response: ${text.slice(0, 200)}`,
      durationMs: Date.now() - start,
    });
    throw new AppError(502, `Ituran login failed (${response.status}): invalid JSON response`);
  }

  if (!response.ok || !('access_token' in data) || !data.access_token) {
    const message =
      ('error' in data && data.error) ||
      ('message' in data && data.message) ||
      text.slice(0, 200) ||
      `HTTP ${response.status}`;
    void createLog({
      category: LogCategory.EXTERNAL_CALLBACK,
      method: 'POST',
      path: '/oauth/token',
      statusCode: response.status,
      source: 'ituran',
      errorMessage: String(message),
      durationMs: Date.now() - start,
    });
    throw new AppError(502, `Ituran login failed: ${message}`);
  }

  // OAuth expires_in is seconds. Refresh 60s early.
  const expiresMs = Math.max(60, data.expires_in - 60) * 1000;
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresMs,
  };

  void createLog({
    category: LogCategory.EXTERNAL_CALLBACK,
    method: 'POST',
    path: '/oauth/token',
    statusCode: response.status,
    source: 'ituran',
    responseBody: { token_type: data.token_type, expires_in: data.expires_in },
    durationMs: Date.now() - start,
  });

  return cachedToken.accessToken;
}

async function authorizedFetch(url: string, init?: RequestInit, retried = false): Promise<Response> {
  const token = await login();
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 && !retried) {
    cachedToken = null;
    await login(true);
    return authorizedFetch(url, init, true);
  }

  return response;
}

/** Build from/to window: (date - 1 day) 01:00 → (date + 1 day) 01:00 */
export function buildTripDateWindow(dateInput: string): { from: string; to: string } {
  const parsed = parseExcelDate(dateInput);
  if (!parsed) {
    throw new AppError(400, `Invalid trip date: "${dateInput}"`);
  }

  const from = new Date(parsed);
  from.setDate(from.getDate() - 1);
  from.setHours(1, 0, 0, 0);

  const to = new Date(parsed);
  to.setDate(to.getDate() + 1);
  to.setHours(1, 0, 0, 0);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}:${s}`;
  };

  return { from: format(from), to: format(to) };
}

/** Accepts M/D/YY, M/D/YYYY, YYYY-MM-DD, or Date serial-ish strings. */
export function parseExcelDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed);
  if (us) {
    let year = Number(us[3]);
    if (year < 100) year += 2000;
    return new Date(year, Number(us[1]) - 1, Number(us[2]));
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export async function getVehicleTrips(
  licensePlate: string,
  fromIso: string,
  toIso: string,
): Promise<IturanTrip[]> {
  const plate = licensePlate.trim();
  if (!plate) throw new AppError(400, 'license_plate is required');

  const { baseUrl } = requireCredentials();
  const allTrips: IturanTrip[] = [];
  let page = 1;
  let pageCount = 1;
  const start = Date.now();

  while (page <= pageCount) {
    const url = new URL(`${baseUrl}/vehicles/${encodeURIComponent(plate)}/trips/`);
    url.searchParams.set('from', fromIso);
    url.searchParams.set('to', toIso);
    url.searchParams.set('page_number', String(page));

    const response = await authorizedFetch(url.toString());
    const text = await response.text();
    let data: TripsResponse;
    try {
      data = JSON.parse(text) as TripsResponse;
    } catch {
      void createLog({
        category: LogCategory.EXTERNAL_CALLBACK,
        method: 'GET',
        path: url.pathname,
        statusCode: response.status,
        source: 'ituran',
        externalId: plate,
        errorMessage: `Non-JSON trips response: ${text.slice(0, 200)}`,
        durationMs: Date.now() - start,
      });
      throw new AppError(502, `Ituran trips failed (${response.status}): invalid JSON`);
    }

    if (!response.ok) {
      const message = text.slice(0, 200) || `HTTP ${response.status}`;
      void createLog({
        category: LogCategory.EXTERNAL_CALLBACK,
        method: 'GET',
        path: url.pathname,
        statusCode: response.status,
        source: 'ituran',
        externalId: plate,
        errorMessage: message,
        durationMs: Date.now() - start,
      });
      throw new AppError(502, `Ituran trips failed for plate ${plate}: ${message}`);
    }

    const trips = data.trips ?? [];
    allTrips.push(...trips);

    const pagination = data.meta?.pagination;
    pageCount = pagination?.page_count ?? 1;
    page += 1;

    // Safety: avoid infinite loops if API misreports page_count
    if (page > 50) break;
  }

  void createLog({
    category: LogCategory.EXTERNAL_CALLBACK,
    method: 'GET',
    path: `/vehicles/${plate}/trips/`,
    statusCode: 200,
    source: 'ituran',
    externalId: plate,
    requestBody: { from: fromIso, to: toIso },
    responseBody: { trip_count: allTrips.length },
    durationMs: Date.now() - start,
  });

  return allTrips;
}

export async function getVehicleTripsForDate(
  licensePlate: string,
  dateInput: string,
): Promise<{ from: string; to: string; trips: IturanTrip[] }> {
  const { from, to } = buildTripDateWindow(dateInput);
  const trips = await getVehicleTrips(licensePlate, from, to);
  return { from, to, trips };
}
