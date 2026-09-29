// KWE Pricing Data Layer
// Single source of truth for freight pricing matrices.
// All data is deterministic (seeded RNG) so the UI is consistent across reloads.

let seed = 71;
function rng() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function rngInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
function rngFloat(min, max, decimals = 2) {
  const v = rng() * (max - min) + min;
  return parseFloat(v.toFixed(decimals));
}
function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function fmtDate(d) { return d.toISOString().split('T')[0]; }

// --- AIRLINES ---
export const AIRLINES = [
  { code: 'KE', flightCode: 'KE-180', name: 'Korean Air', country: 'South Korea', countryCode: 'KR' },
  { code: 'NH', flightCode: 'NH-205', name: 'ANA - All Nippon Airways', country: 'Japan', countryCode: 'JP' },
  { code: 'CI', flightCode: 'CI-297', name: 'China Airlines', country: 'Taiwan', countryCode: 'TW' },
  { code: 'JL', flightCode: 'JL-131', name: 'Japan Airlines', country: 'Japan', countryCode: 'JP' },
  { code: 'AA', flightCode: 'AA-001', name: 'American Airlines', country: 'USA', countryCode: 'US' },
  { code: 'BR', flightCode: 'BR-695', name: 'EVA Air', country: 'Taiwan', countryCode: 'TW' },
  { code: 'SQ', flightCode: 'SQ-321', name: 'Singapore Airlines', country: 'Singapore', countryCode: 'SG' },
  { code: 'CX', flightCode: 'CX-840', name: 'Cathay Pacific', country: 'Hong Kong', countryCode: 'HK' },
];

// --- AIR DESTINATIONS ---
export const AIR_DESTINATIONS = [
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK' },  // Add HKG
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', countryCode: 'TH' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan', countryCode: 'TW' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', countryCode: 'KR' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  { code: 'PVG', city: 'Shanghai', country: 'China', countryCode: 'CN' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', countryCode: 'US' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', countryCode: 'DE' },
];

// --- OCEAN PORTS ---
export const OCEAN_PORTS = [
  { code: 'CNSHA', city: 'Shanghai', country: 'China', countryCode: 'CN' },
  { code: 'SGSIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG' },
  { code: 'NLRTM', city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL' },
  { code: 'USLAX', city: 'Los Angeles', country: 'USA', countryCode: 'US' },
  { code: 'INMAA', city: 'Chennai', country: 'India', countryCode: 'IN' },
  { code: 'DEHAM', city: 'Hamburg', country: 'Germany', countryCode: 'DE' },
  { code: 'HKHKG', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK' },
  { code: 'USNYC', city: 'New York', country: 'USA', countryCode: 'US' },
];

// --- OCEAN CARRIERS ---
export const OCEAN_CARRIERS = [
  { code: 'MSK', name: 'Maersk Logistics' },
  { code: 'KN', name: 'Kuehne+Nagel' },
  { code: 'DSV', name: 'DSV Air & Sea' },
  { code: 'DBS', name: 'DB Schenker' },
  { code: 'YSL', name: 'Yusen Logistics' },
  { code: 'CMA', name: 'CMA CGM' },
  { code: 'DHL', name: 'DHL Global Forwarding' },
  { code: 'GDS', name: 'Geodis' },
];

export const SERVICE_TYPES = ['Regular', 'Express', 'Charter', 'Consolidated'];
export const CONTAINER_TYPES = ['20GP', '40GP', '40HQ', '45HQ', 'Special'];
export const CURRENCIES = ['USD', 'EUR', 'SGD', 'JPY'];
const AIR_ORIGINS = ['ORD', 'JFK', 'LAX'];

// Surcharge taxonomy
export const SURCHARGE_TYPES = [
  { key: 'fuel', name: 'Fuel Surcharge' },
  { key: 'baf', name: 'BAF — Bunker Adjustment Factor' },
  { key: 'caf', name: 'CAF — Currency Adjustment Factor' },
  { key: 'thc', name: 'THC — Terminal Handling Charge' },
  { key: 'doc', name: 'Documentation Fee' },
  { key: 'security', name: 'Security Fee' },
  { key: 'customs', name: 'Customs Fee' },
  { key: 'peak', name: 'Peak Season Surcharge' },
  { key: 'emergency', name: 'Emergency Surcharge' },
  { key: 'other', name: 'Other Charges' },
];

// ---------------------------------------------------------------
// AIR MATRICES
// ---------------------------------------------------------------
function genAirMatrix(i) {
  const airline = AIRLINES[i % AIRLINES.length];
  const dest = pick(AIR_DESTINATIONS);
  const serviceType = pick(SERVICE_TYPES);
  const origin = AIR_ORIGINS[i % AIR_ORIGINS.length];
  const currency = pick(['USD', 'USD', 'USD', 'EUR']); // USD heavy
  const effective = addDays(new Date(), -rngInt(0, 60));
  const expiry = addDays(effective, rngInt(120, 365));
  const status = expiry < new Date() ? 'expired' : rngInt(0, 10) > 1 ? 'active' : 'draft';

  // Generate weight breaks ascending with descending rates
  const baseFreight = rngFloat(1.0, 2.5, 2);
  const baseFuel = rngFloat(0.5, 1.0, 2);
  const breakPoints = [45, 100, 300, 500, 1000];
  const breaks = breakPoints.map((w, idx) => ({
    weight: w,
    freight: parseFloat((baseFreight * Math.pow(0.78, idx)).toFixed(2)),
    fuel: parseFloat((baseFuel * Math.pow(0.7, idx)).toFixed(2)),
    security: parseFloat((0.12 * Math.pow(0.85, idx)).toFixed(2)),
    other: parseFloat((0.06 * Math.pow(0.85, idx)).toFixed(2)),
  }));

  const version = rngInt(1, 5);
  return {
    id: `PM-AIR-${String(1000 + i).padStart(5, '0')}`,
    type: 'air',
    name: `${airline.flightCode} → ${dest.code} · ${serviceType}`,
    airlineCode: airline.code,
    airlineFlightCode: airline.flightCode,
    airlineName: airline.name,
    airlineCountryCode: airline.countryCode,
    destination: dest.code,
    destinationCity: dest.city,
    destinationCountry: dest.country,
    destinationCountryCode: dest.countryCode,
    origin,
    serviceType,
    currency,
    effectiveDate: fmtDate(effective),
    expiryDate: fmtDate(expiry),
    status,
    remarks: rngInt(0, 2) === 0 ? 'Validated by procurement; subject to fuel review.' : '',
    breaks,
    version,
    createdAt: fmtDate(addDays(effective, -rngInt(5, 30))),
    updatedAt: fmtDate(addDays(effective, rngInt(0, 10))),
    createdBy: pick(['M. Tanaka', 'A. Chen', 'S. Patel', 'L. Wong']),
  };
}

// Guaranteed air routes for all destinations
// Ensures every instant quote destination has at least one active air matrix
function genGuaranteedAirRoute(destCode, airline, i) {
  const dest = AIR_DESTINATIONS.find(d => d.code === destCode);
  if (!dest) return null;

  const baseFreight = 1.5 + (i * 0.2);
  const baseFuel = 0.7 - (i * 0.05);
  const breakPoints = [45, 100, 300, 500, 1000];
  const breaks = breakPoints.map((w, idx) => ({
    weight: w,
    freight: parseFloat((baseFreight * Math.pow(0.78, idx)).toFixed(2)),
    fuel: parseFloat(Math.max(0.1, baseFuel * Math.pow(0.7, idx)).toFixed(2)),
    security: parseFloat((0.12 * Math.pow(0.85, idx)).toFixed(2)),
    other: parseFloat((0.06 * Math.pow(0.85, idx)).toFixed(2)),
  }));

  const today = new Date();
  const origin = AIR_ORIGINS[i % AIR_ORIGINS.length];
  return {
    id: `PM-AIR-GTRD-${destCode}-${i}`,
    type: 'air',
    name: `${airline.flightCode} → ${dest.code} · Regular`,
    airlineCode: airline.code,
    airlineFlightCode: airline.flightCode,
    airlineName: airline.name,
    airlineCountryCode: airline.countryCode,
    destination: dest.code,
    destinationCity: dest.city,
    destinationCountry: dest.country,
    destinationCountryCode: dest.countryCode,
    origin,
    serviceType: 'Regular',
    currency: 'USD',
    effectiveDate: fmtDate(addDays(today, -30)),
    expiryDate: fmtDate(addDays(today, 335)),
    status: 'active',
    remarks: 'Guaranteed route for instant quote',
    breaks,
    version: 1,
    createdAt: fmtDate(addDays(today, -30)),
    updatedAt: fmtDate(today),
    createdBy: 'System',
  };
}

const guaranteedRoutes = AIR_DESTINATIONS.flatMap((dest, destIdx) =>
  AIRLINES.slice(0, 2).map((airline, airIdx) =>
    genGuaranteedAirRoute(dest.code, airline, destIdx * 2 + airIdx)
  ).filter(Boolean)
);

export const airMatrices = [
  ...Array.from({ length: 50 }, (_, i) => genAirMatrix(i)),
  ...guaranteedRoutes,
];

// ---------------------------------------------------------------
// OCEAN LCL MATRICES
// ---------------------------------------------------------------
function genLclMatrix(i) {
  const origin = pick(OCEAN_PORTS);
  let destination = pick(OCEAN_PORTS);
  while (destination.code === origin.code) destination = pick(OCEAN_PORTS);
  const carrier = OCEAN_CARRIERS[i % OCEAN_CARRIERS.length];
  const currency = pick(['USD', 'USD', 'EUR']);
  const effective = addDays(new Date(), -rngInt(0, 60));
  const expiry = addDays(effective, rngInt(120, 365));
  const status = expiry < new Date() ? 'expired' : rngInt(0, 10) > 1 ? 'active' : 'draft';

  const base = rngFloat(35, 60);
  const breaks = [
    { minCBM: 0, maxCBM: 5, ratePerCbm: parseFloat((base + 5).toFixed(2)), documentationFee: 35, thc: 28, other: 12 },
    { minCBM: 5, maxCBM: 10, ratePerCbm: parseFloat(base.toFixed(2)), documentationFee: 35, thc: 28, other: 12 },
    { minCBM: 10, maxCBM: 20, ratePerCbm: parseFloat((base - 5).toFixed(2)), documentationFee: 35, thc: 28, other: 10 },
    { minCBM: 20, maxCBM: 9999, ratePerCbm: parseFloat((base - 10).toFixed(2)), documentationFee: 35, thc: 28, other: 8 },
  ];

  return {
    id: `PM-LCL-${String(2000 + i).padStart(5, '0')}`,
    type: 'lcl',
    name: `${origin.code} → ${destination.code} · ${carrier.code}`,
    carrierCode: carrier.code,
    carrierName: carrier.name,
    originPort: origin.code,
    originCity: origin.city,
    originCountry: origin.country,
    originCountryCode: origin.countryCode,
    destinationPort: destination.code,
    destinationCity: destination.city,
    destinationCountry: destination.country,
    destinationCountryCode: destination.countryCode,
    currency,
    effectiveDate: fmtDate(effective),
    expiryDate: fmtDate(expiry),
    status,
    remarks: '',
    breaks,
    version: rngInt(1, 4),
    createdAt: fmtDate(addDays(effective, -rngInt(5, 30))),
    updatedAt: fmtDate(addDays(effective, rngInt(0, 10))),
    createdBy: pick(['M. Tanaka', 'A. Chen', 'S. Patel', 'L. Wong']),
  };
}

// Deterministic LCL lanes for the most common trade routes.
// These guarantee that the default InstantQuote origin/destination pairs
// always return live ocean options.
const COMMON_LCL_LANES = [
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[3], base: 55 }, // CNSHA → USLAX
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[7], base: 62 }, // CNSHA → USNYC
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[2], base: 48 }, // CNSHA → NLRTM
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[5], base: 50 }, // CNSHA → DEHAM
  { o: OCEAN_PORTS[6], d: OCEAN_PORTS[3], base: 52 }, // HKHKG → USLAX
  { o: OCEAN_PORTS[6], d: OCEAN_PORTS[2], base: 46 }, // HKHKG → NLRTM
  { o: OCEAN_PORTS[1], d: OCEAN_PORTS[3], base: 58 }, // SGSIN → USLAX
  { o: OCEAN_PORTS[1], d: OCEAN_PORTS[2], base: 44 }, // SGSIN → NLRTM
  { o: OCEAN_PORTS[4], d: OCEAN_PORTS[2], base: 42 }, // INMAA → NLRTM
  { o: OCEAN_PORTS[4], d: OCEAN_PORTS[3], base: 60 }, // INMAA → USLAX
];

function genLclLane(origin, destination, base, carrier, i) {
  const currency = 'USD';
  const effective = addDays(new Date(), -rngInt(0, 45));
  const expiry = addDays(effective, rngInt(180, 365));
  const breaks = [
    { minCBM: 0, maxCBM: 3, ratePerCbm: parseFloat((base + 8).toFixed(2)), documentationFee: 40, thc: 30, other: 15 },
    { minCBM: 3, maxCBM: 8, ratePerCbm: parseFloat((base + 3).toFixed(2)), documentationFee: 40, thc: 30, other: 12 },
    { minCBM: 8, maxCBM: 15, ratePerCbm: parseFloat(base.toFixed(2)), documentationFee: 40, thc: 30, other: 10 },
    { minCBM: 15, maxCBM: 9999, ratePerCbm: parseFloat((base - 6).toFixed(2)), documentationFee: 40, thc: 30, other: 8 },
  ];
  return {
    id: `PM-LCL-${String(1000 + i).padStart(5, '0')}`,
    type: 'lcl',
    name: `${origin.code} → ${destination.code} · ${carrier.code}`,
    carrierCode: carrier.code,
    carrierName: carrier.name,
    originPort: origin.code,
    originCity: origin.city,
    originCountry: origin.country,
    originCountryCode: origin.countryCode,
    destinationPort: destination.code,
    destinationCity: destination.city,
    destinationCountry: destination.country,
    destinationCountryCode: destination.countryCode,
    currency,
    effectiveDate: fmtDate(effective),
    expiryDate: fmtDate(expiry),
    status: 'active',
    remarks: 'Trunk lane · guaranteed weekly sailings.',
    breaks,
    version: rngInt(1, 3),
    createdAt: fmtDate(addDays(effective, -rngInt(5, 30))),
    updatedAt: fmtDate(addDays(effective, rngInt(0, 10))),
    createdBy: pick(['M. Tanaka', 'A. Chen', 'S. Patel', 'L. Wong']),
  };
}

const commonLclMatrices = COMMON_LCL_LANES.flatMap((lane, i) =>
  // 3 competing carriers per lane so the results screen has variety.
  [OCEAN_CARRIERS[0], OCEAN_CARRIERS[1], OCEAN_CARRIERS[4]].map((carrier, j) =>
    genLclLane(lane.o, lane.d, lane.base + j * 2, carrier, i * 3 + j)
  )
);

export const lclMatrices = [
  ...commonLclMatrices,
  ...Array.from({ length: 30 }, (_, i) => genLclMatrix(i + 100)),
];

// ---------------------------------------------------------------
// OCEAN FCL MATRICES
// ---------------------------------------------------------------
function genFclMatrix(i) {
  const origin = pick(OCEAN_PORTS);
  let destination = pick(OCEAN_PORTS);
  while (destination.code === origin.code) destination = pick(OCEAN_PORTS);
  const carrier = OCEAN_CARRIERS[i % OCEAN_CARRIERS.length];
  const currency = pick(['USD', 'USD', 'EUR']);
  const effective = addDays(new Date(), -rngInt(0, 60));
  const expiry = addDays(effective, rngInt(120, 365));
  const status = expiry < new Date() ? 'expired' : rngInt(0, 10) > 1 ? 'active' : 'draft';

  const base20 = rngInt(1500, 2400);
  const containerRates = {
    '20GP': base20,
    '40GP': Math.round(base20 * 1.55),
    '40HQ': Math.round(base20 * 1.7),
    '45HQ': Math.round(base20 * 1.95),
    'Special': rngInt(0, 1) ? Math.round(base20 * 2.4) : null,
  };

  return {
    id: `PM-FCL-${String(3000 + i).padStart(5, '0')}`,
    type: 'fcl',
    name: `${origin.code} → ${destination.code} · ${carrier.code}`,
    carrierCode: carrier.code,
    carrierName: carrier.name,
    originPort: origin.code,
    originCity: origin.city,
    originCountry: origin.country,
    originCountryCode: origin.countryCode,
    destinationPort: destination.code,
    destinationCity: destination.city,
    destinationCountry: destination.country,
    destinationCountryCode: destination.countryCode,
    currency,
    effectiveDate: fmtDate(effective),
    expiryDate: fmtDate(expiry),
    status,
    remarks: '',
    containerRates,
    surcharges: {
      thc: rngInt(180, 320),
      documentationFee: 45,
      sealFee: 8,
    },
    version: rngInt(1, 4),
    createdAt: fmtDate(addDays(effective, -rngInt(5, 30))),
    updatedAt: fmtDate(addDays(effective, rngInt(0, 10))),
    createdBy: pick(['M. Tanaka', 'A. Chen', 'S. Patel', 'L. Wong']),
  };
}

// Deterministic FCL lanes for the most common trade routes.
const COMMON_FCL_LANES = [
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[3], base: 2100 }, // CNSHA → USLAX
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[7], base: 2600 }, // CNSHA → USNYC
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[2], base: 1900 }, // CNSHA → NLRTM
  { o: OCEAN_PORTS[0], d: OCEAN_PORTS[5], base: 1950 }, // CNSHA → DEHAM
  { o: OCEAN_PORTS[6], d: OCEAN_PORTS[3], base: 2050 }, // HKHKG → USLAX
  { o: OCEAN_PORTS[6], d: OCEAN_PORTS[2], base: 1850 }, // HKHKG → NLRTM
  { o: OCEAN_PORTS[1], d: OCEAN_PORTS[3], base: 2200 }, // SGSIN → USLAX
  { o: OCEAN_PORTS[1], d: OCEAN_PORTS[2], base: 1750 }, // SGSIN → NLRTM
  { o: OCEAN_PORTS[4], d: OCEAN_PORTS[2], base: 1650 }, // INMAA → NLRTM
  { o: OCEAN_PORTS[4], d: OCEAN_PORTS[3], base: 2300 }, // INMAA → USLAX
];

function genFclLane(origin, destination, base20, carrier, i) {
  const currency = 'USD';
  const effective = addDays(new Date(), -rngInt(0, 45));
  const expiry = addDays(effective, rngInt(180, 365));
  const containerRates = {
    '20GP': base20,
    '40GP': Math.round(base20 * 1.55),
    '40HQ': Math.round(base20 * 1.7),
    '45HQ': Math.round(base20 * 1.95),
    'Special': Math.round(base20 * 2.4),
  };
  return {
    id: `PM-FCL-${String(1000 + i).padStart(5, '0')}`,
    type: 'fcl',
    name: `${origin.code} → ${destination.code} · ${carrier.code}`,
    carrierCode: carrier.code,
    carrierName: carrier.name,
    originPort: origin.code,
    originCity: origin.city,
    originCountry: origin.country,
    originCountryCode: origin.countryCode,
    destinationPort: destination.code,
    destinationCity: destination.city,
    destinationCountry: destination.country,
    destinationCountryCode: destination.countryCode,
    currency,
    effectiveDate: fmtDate(effective),
    expiryDate: fmtDate(expiry),
    status: 'active',
    remarks: 'Trunk lane · guaranteed weekly sailings.',
    containerRates,
    surcharges: {
      thc: rngInt(180, 280),
      documentationFee: 45,
      sealFee: 8,
    },
    version: rngInt(1, 3),
    createdAt: fmtDate(addDays(effective, -rngInt(5, 30))),
    updatedAt: fmtDate(addDays(effective, rngInt(0, 10))),
    createdBy: pick(['M. Tanaka', 'A. Chen', 'S. Patel', 'L. Wong']),
  };
}

const commonFclMatrices = COMMON_FCL_LANES.flatMap((lane, i) =>
  [OCEAN_CARRIERS[0], OCEAN_CARRIERS[1], OCEAN_CARRIERS[4], OCEAN_CARRIERS[5]].map((carrier, j) =>
    genFclLane(lane.o, lane.d, lane.base + j * 60, carrier, i * 4 + j)
  )
);

export const fclMatrices = [
  ...commonFclMatrices,
  ...Array.from({ length: 30 }, (_, i) => genFclMatrix(i + 100)),
];

// ---------------------------------------------------------------
// SURCHARGE MATRIX
// ---------------------------------------------------------------
function genSurcharge(i) {
  const t = SURCHARGE_TYPES[i % SURCHARGE_TYPES.length];
  const appliesTo = pick(['air', 'ocean', 'all']);
  const isPct = ['fuel', 'baf', 'caf', 'peak', 'emergency'].includes(t.key);
  return {
    id: `PM-SUR-${String(4000 + i).padStart(5, '0')}`,
    type: 'surcharge',
    name: `${t.name} · ${appliesTo === 'all' ? 'All modes' : appliesTo === 'air' ? 'Air freight' : 'Ocean freight'}`,
    surchargeType: t.key,
    surchargeName: t.name,
    appliesTo,
    calculationType: isPct ? 'percentage' : 'flat',
    value: isPct ? rngFloat(4, 22) : rngInt(15, 350),
    currency: 'USD',
    effectiveDate: fmtDate(addDays(new Date(), -rngInt(0, 30))),
    expiryDate: fmtDate(addDays(new Date(), rngInt(60, 365))),
    status: rngInt(0, 10) > 1 ? 'active' : 'draft',
    appliedToCarriers: rngInt(0, 1) ? 'all' : pick(OCEAN_CARRIERS).code,
    remarks: '',
    version: rngInt(1, 3),
  };
}

export const surchargeMatrices = Array.from({ length: 20 }, (_, i) => genSurcharge(i));

// ---------------------------------------------------------------
// COMBINED VIEW
// ---------------------------------------------------------------
export const allMatrices = [...airMatrices, ...lclMatrices, ...fclMatrices, ...surchargeMatrices];

// ---------------------------------------------------------------
// VERSION HISTORY / AUDIT
// ---------------------------------------------------------------
function genHistory() {
  const actions = ['created', 'updated', 'cloned', 'deactivated', 'activated', 'rate-adjusted'];
  const users = ['M. Tanaka', 'A. Chen', 'S. Patel', 'L. Wong', 'API Sync'];
  return Array.from({ length: 80 }, (_, i) => {
    const m = pick(allMatrices);
    const action = pick(actions);
    return {
      id: `H-${String(i).padStart(5, '0')}`,
      matrixId: m.id,
      matrixName: m.name,
      matrixType: m.type,
      action,
      version: rngInt(1, 5),
      user: pick(users),
      timestamp: fmtDate(addDays(new Date(), -rngInt(0, 60))),
      summary: action === 'rate-adjusted'
        ? `Adjusted ${rngInt(2, 6)} break rates by ${rngInt(-15, 15)}%`
        : action === 'cloned'
          ? `Cloned from previous version`
          : action === 'updated'
            ? `Updated ${rngInt(1, 4)} field${rngInt(1, 4) > 1 ? 's' : ''}`
            : action === 'created'
              ? 'Initial matrix created'
              : action === 'deactivated' ? 'Matrix taken offline' : 'Matrix reactivated',
      ip: `10.20.${rngInt(0, 255)}.${rngInt(0, 255)}`,
    };
  });
}

export const matrixHistory = genHistory();
