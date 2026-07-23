/**
 * MoD / Masha 2026 price list (from client Excel).
 * Lines are matched to trip descriptions via Hebrew/English aliases.
 */

export type ModKmHourRate = {
  vehicleLabel: string;
  /** Engine vehicle_type used for PRICE_BY_KM_AND_HOURS */
  engineVehicle: 'Bus' | 'Minibus' | 'Van';
  pricePerKm: number;
  pricePerHour: number;
  saturdaySupplement?: number;
  stoneProtectionSupplement?: number;
};

export type ModLineRate = {
  lineName: string;
  vehicleLabel: string;
  /** Approximate engine vehicle for catalog lookup */
  engineVehicle: 'Bus' | 'Minibus' | 'Van';
  linePrice: number;
  /** null = "No km" */
  additionalKmRate: number | null;
  /** Hebrew / English tokens that identify this line in trip descriptions */
  aliases: string[];
};

export const MOD_HIGHWAY_6_FEE = 42.86;

export const MOD_KM_HOUR_RATES: ModKmHourRate[] = [
  {
    vehicleLabel: 'Bus',
    engineVehicle: 'Bus',
    pricePerKm: 4.1,
    pricePerHour: 149.11,
    saturdaySupplement: 432.28,
  },
  {
    vehicleLabel: 'Stone-Protected Bus',
    engineVehicle: 'Bus',
    pricePerKm: 4.1,
    pricePerHour: 149.11,
    saturdaySupplement: 432.28,
    stoneProtectionSupplement: 338.95,
  },
  {
    vehicleLabel: 'Midibus',
    engineVehicle: 'Van',
    pricePerKm: 3.75,
    pricePerHour: 133.94,
  },
  {
    vehicleLabel: 'Minibus 19',
    engineVehicle: 'Minibus',
    pricePerKm: 3.17,
    pricePerHour: 120.93,
    saturdaySupplement: 430,
  },
];

export const MOD_LINE_RATES: ModLineRate[] = [
  {
    lineName: 'Bat Yam Line',
    vehicleLabel: 'Minibus 16',
    engineVehicle: 'Minibus',
    linePrice: 218,
    additionalKmRate: null,
    aliases: ['בת ים', 'bat yam'],
  },
  {
    lineName: 'Nordia Line',
    vehicleLabel: 'Small Bus 16',
    engineVehicle: 'Bus',
    linePrice: 238,
    additionalKmRate: 2.99,
    aliases: ['נורדיה', 'nordia'],
  },
  {
    lineName: 'Beit Yitzhak',
    vehicleLabel: 'Small Bus 10',
    engineVehicle: 'Bus',
    linePrice: 228,
    additionalKmRate: 2.37,
    aliases: ['בית יצחק', 'beit yitzhak', 'beit yitzchak'],
  },
  {
    lineName: 'Netanya',
    vehicleLabel: 'Small Bus 10',
    engineVehicle: 'Bus',
    linePrice: 228,
    additionalKmRate: 2.37,
    aliases: ['נתניה', 'netanya'],
  },
  {
    lineName: 'Bat Hefer',
    vehicleLabel: 'Small Bus 10',
    engineVehicle: 'Bus',
    linePrice: 228,
    additionalKmRate: 2.37,
    aliases: ['בת חפר', 'bat hefer'],
  },
  {
    lineName: 'Ramla',
    vehicleLabel: 'Small Bus 14',
    engineVehicle: 'Bus',
    linePrice: 178,
    additionalKmRate: null,
    aliases: ['רמלה', 'ramla', 'ramle'],
  },
  {
    lineName: 'Kfar Yabetz - Masha',
    vehicleLabel: 'Small Bus 10',
    engineVehicle: 'Bus',
    linePrice: 228,
    additionalKmRate: 2.37,
    aliases: ['כפר יעבץ', 'יעבץ', 'kfar yabetz', 'kfar yaabetz'],
  },
  {
    lineName: 'Kfar Yabetz - Rishon LeZion',
    vehicleLabel: 'Small Bus 10',
    engineVehicle: 'Bus',
    linePrice: 228,
    additionalKmRate: 2.37,
    aliases: ['יעבץ', 'ראשון', 'rishon'],
  },
  {
    lineName: 'Kfar Saba',
    vehicleLabel: 'Small Bus 10',
    engineVehicle: 'Bus',
    linePrice: 228,
    additionalKmRate: 2.37,
    aliases: ['כפר סבא', 'כ"ס', 'כ״ס', 'kfar saba', 'kfar sava'],
  },
  {
    lineName: 'Tzofim Camp Qalqilya',
    vehicleLabel: 'Small Bus 16',
    engineVehicle: 'Bus',
    linePrice: 238,
    additionalKmRate: 2.99,
    aliases: ['צופים', 'קלקיליה', 'tzofim', 'qalqilya'],
  },
  {
    lineName: 'Netanya (Small Bus 16)',
    vehicleLabel: 'Small Bus 16',
    engineVehicle: 'Bus',
    linePrice: 238,
    additionalKmRate: 2.99,
    aliases: ['נתניה', 'netanya'],
  },
  {
    lineName: 'Holon Tel Nof',
    vehicleLabel: 'Small Bus 16',
    engineVehicle: 'Bus',
    linePrice: 218,
    additionalKmRate: 2.99,
    aliases: ['חולון', 'תל נוף', 'holon', 'tel nof'],
  },
];

export function normalizeMatchText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/["'`״׳]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Find MoD line rates whose aliases appear in the trip description. */
export function matchModLines(description: string): ModLineRate[] {
  const text = normalizeMatchText(description);
  if (!text) return [];

  const hits = MOD_LINE_RATES.filter((line) =>
    line.aliases.some((alias) => text.includes(normalizeMatchText(alias))),
  );

  // Prefer longer / more specific alias hits: score by longest matching alias length
  return [...hits].sort((a, b) => {
    const score = (line: ModLineRate) =>
      Math.max(
        0,
        ...line.aliases
          .filter((alias) => text.includes(normalizeMatchText(alias)))
          .map((alias) => normalizeMatchText(alias).length),
      );
    return score(b) - score(a);
  });
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export type ModPriceCandidate = {
  formula: string;
  lineName: string;
  vehicleLabel: string;
  price: number;
};

/** Candidate prices from a matched line + optional Ituran distance. */
export function linePriceCandidates(
  line: ModLineRate,
  distanceKm: number | null,
): ModPriceCandidate[] {
  const out: ModPriceCandidate[] = [
    {
      formula: 'line_price',
      lineName: line.lineName,
      vehicleLabel: line.vehicleLabel,
      price: line.linePrice,
    },
    {
      formula: 'line_price + highway6',
      lineName: line.lineName,
      vehicleLabel: line.vehicleLabel,
      price: roundMoney(line.linePrice + MOD_HIGHWAY_6_FEE),
    },
  ];

  if (line.additionalKmRate != null && distanceKm != null && distanceKm > 0) {
    out.push({
      formula: 'line_price + add_km × distance',
      lineName: line.lineName,
      vehicleLabel: line.vehicleLabel,
      price: roundMoney(line.linePrice + line.additionalKmRate * distanceKm),
    });
  }

  return out;
}
