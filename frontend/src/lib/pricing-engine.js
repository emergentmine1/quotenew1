// KWE Pricing Engine
// Pure, deterministic functions that compute freight cost from Pricing Matrices.
// This module is the single source of truth for freight cost calculation.
// Future AI Freight Cost Estimation modules MUST consume pricing from here.
//
// Public API:
//   calculateQuote(input, { airMatrices, lclMatrices, fclMatrices, surchargeMatrices })
//   findApplicableAirBreak(matrix, weightKg)
//   findApplicableLclBreak(matrix, cbm)
//   listEligibleMatrices(input, matrices)

import {
  airMatrices as defaultAir,
  lclMatrices as defaultLcl,
  fclMatrices as defaultFcl,
  surchargeMatrices as defaultSurcharges,
} from './pricing-data';

const today = () => new Date().toISOString().split('T')[0];

function isMatrixActive(m, dateStr = today()) {
  return m.status === 'active' && m.effectiveDate <= dateStr && m.expiryDate >= dateStr;
}

// ---------- AIR ----------
export function findApplicableAirBreak(matrix, weightKg) {
  if (!matrix?.breaks?.length) return null;
  // Breaks are weight thresholds (e.g. 45/100/300/500/1000 KG).
  // The applicable break is the LARGEST break whose threshold is <= weight,
  // or the smallest break if weight is below the smallest threshold.
  const sorted = [...matrix.breaks].sort((a, b) => a.weight - b.weight);
  let chosen = sorted[0];
  for (const b of sorted) {
    if (weightKg >= b.weight) chosen = b;
    else break;
  }
  return chosen;
}

export function listEligibleAirMatrices(input, matrices = defaultAir) {
  const { destination, carrier, serviceType, asOf = today() } = input;
  return matrices.filter((m) => {
    if (!isMatrixActive(m, asOf)) return false;
    if (destination && m.destination !== destination) return false;
    if (carrier && m.airlineCode !== carrier && m.airlineFlightCode !== carrier) return false;
    if (serviceType && m.serviceType !== serviceType) return false;
    return true;
  });
}

function calcAir(input, matrices, surchargeMatrices) {
  const { weight = 0 } = input;
  const eligible = listEligibleAirMatrices(input, matrices);
  if (!eligible.length) return { error: 'No active air matrix found for this lane', matrix: null };
  // Pick the lowest-effective-rate matrix at this weight
  const evaluated = eligible.map((m) => {
    const br = findApplicableAirBreak(m, weight);
    const freight = br.freight * weight;
    const fuel = br.fuel * weight;
    const security = br.security * weight;
    const other = br.other * weight;
    const baseCost = freight + fuel + security + other;
    return { matrix: m, break: br, freight, fuel, security, other, baseCost };
  });
  evaluated.sort((a, b) => a.baseCost - b.baseCost);
  const best = evaluated[0];

  const surcharges = applySurcharges('air', best.baseCost, surchargeMatrices, input);
  const totalSurcharges = surcharges.reduce((a, s) => a + s.amount, 0);
  const currency = best.matrix.currency;
  const chargeableWt = weight;

  const charges = {
    origin: [],
    freight: [
      { code: 'FRT', name: 'Freight', comment: 'Per Chargeable Wt (kg)', units: chargeableWt, unitPrice: best.break.freight, amount: best.freight, currency },
      { code: 'FSC', name: 'Fuel Surcharge', comment: 'Per kg', units: chargeableWt, unitPrice: best.break.fuel, amount: best.fuel, currency },
      { code: 'SEC', name: 'Security Surcharge', comment: 'Per kg', units: chargeableWt, unitPrice: best.break.security, amount: best.security, currency },
      { code: 'OTH', name: 'Other Airline Charges', comment: 'Per kg', units: chargeableWt, unitPrice: best.break.other, amount: best.other, currency },
      ...surcharges.map((s) => ({
        code: s.surchargeType?.toUpperCase().slice(0, 3) || 'SUR',
        name: s.surchargeName,
        comment: s.calculationType === 'percentage' ? `${s.value}% of base` : 'Flat fee',
        units: 1,
        unitPrice: s.amount,
        amount: s.amount,
        currency: s.currency,
      })),
    ],
    destination: [],
  };

  return {
    matrix: best.matrix,
    appliedBreak: best.break,
    breakdown: [
      { label: 'Freight', amount: best.freight, formula: `${best.break.freight.toFixed(2)} × ${weight} kg` },
      { label: 'Fuel', amount: best.fuel, formula: `${best.break.fuel.toFixed(2)} × ${weight} kg` },
      { label: 'Security', amount: best.security, formula: `${best.break.security.toFixed(2)} × ${weight} kg` },
      { label: 'Other charges', amount: best.other, formula: `${best.break.other.toFixed(2)} × ${weight} kg` },
    ],
    charges,
    baseCost: best.baseCost,
    surcharges,
    totalSurcharges,
    totalCost: best.baseCost + totalSurcharges,
    currency,
    alternatives: evaluated.slice(1, 4).map((e) => ({
      matrixId: e.matrix.id,
      providerName: e.matrix.airlineName,
      baseCost: e.baseCost,
    })),
  };
}

// ---------- OCEAN LCL ----------
export function findApplicableLclBreak(matrix, cbm) {
  if (!matrix?.breaks?.length) return null;
  return matrix.breaks.find((b) => cbm >= b.minCBM && cbm < b.maxCBM) || matrix.breaks[matrix.breaks.length - 1];
}

export function listEligibleLclMatrices(input, matrices = defaultLcl) {
  const { origin, destination, carrier, asOf = today() } = input;
  return matrices.filter((m) => {
    if (!isMatrixActive(m, asOf)) return false;
    if (origin && m.originPort !== origin) return false;
    if (destination && m.destinationPort !== destination) return false;
    if (carrier && m.carrierCode !== carrier) return false;
    return true;
  });
}

function calcLcl(input, matrices, surchargeMatrices) {
  const { cbm = 0 } = input;
  const eligible = listEligibleLclMatrices(input, matrices);
  if (!eligible.length) return { error: 'No active LCL matrix found for this lane', matrix: null };

  const evaluated = eligible.map((m) => {
    const br = findApplicableLclBreak(m, cbm);
    const freight = br.ratePerCbm * cbm;
    const doc = br.documentationFee;
    const thc = br.thc;
    const other = br.other;
    const baseCost = freight + doc + thc + other;
    return { matrix: m, break: br, freight, doc, thc, other, baseCost };
  });
  evaluated.sort((a, b) => a.baseCost - b.baseCost);
  const best = evaluated[0];

  const surcharges = applySurcharges('ocean', best.baseCost, surchargeMatrices, input);
  const totalSurcharges = surcharges.reduce((a, s) => a + s.amount, 0);
  const currency = best.matrix.currency;

  const charges = {
    origin: [
      { code: 'OTHC', name: 'Origin Terminal Handling', comment: 'Flat fee', units: 1, unitPrice: best.thc, amount: best.thc, currency },
      { code: 'DOC', name: 'Documentation Fee', comment: 'Flat fee', units: 1, unitPrice: best.doc, amount: best.doc, currency },
    ],
    freight: [
      { code: 'FRT', name: 'Freight', comment: 'Per CBM (port-to-port)', units: parseFloat(cbm.toFixed(2)), unitPrice: best.break.ratePerCbm, amount: best.freight, currency },
      ...surcharges.map((s) => ({
        code: s.surchargeType?.toUpperCase().slice(0, 3) || 'SUR',
        name: s.surchargeName,
        comment: s.calculationType === 'percentage' ? `${s.value}% of base` : 'Flat fee',
        units: 1,
        unitPrice: s.amount,
        amount: s.amount,
        currency: s.currency,
      })),
    ],
    destination: [
      { code: 'OTH', name: 'Destination Charges', comment: 'Flat fee', units: 1, unitPrice: best.other, amount: best.other, currency },
    ],
  };

  return {
    matrix: best.matrix,
    appliedBreak: best.break,
    breakdown: [
      { label: 'Freight', amount: best.freight, formula: `$${best.break.ratePerCbm}/CBM × ${cbm} CBM` },
      { label: 'Documentation', amount: best.doc, formula: 'Flat fee' },
      { label: 'THC', amount: best.thc, formula: 'Flat fee' },
      { label: 'Other charges', amount: best.other, formula: 'Flat fee' },
    ],
    charges,
    baseCost: best.baseCost,
    surcharges,
    totalSurcharges,
    totalCost: best.baseCost + totalSurcharges,
    currency,
    alternatives: evaluated.slice(1, 4).map((e) => ({
      matrixId: e.matrix.id,
      providerName: e.matrix.carrierName,
      baseCost: e.baseCost,
    })),
  };
}

// ---------- OCEAN FCL ----------
export function listEligibleFclMatrices(input, matrices = defaultFcl) {
  const { origin, destination, carrier, asOf = today() } = input;
  return matrices.filter((m) => {
    if (!isMatrixActive(m, asOf)) return false;
    if (origin && m.originPort !== origin) return false;
    if (destination && m.destinationPort !== destination) return false;
    if (carrier && m.carrierCode !== carrier) return false;
    return true;
  });
}

function calcFcl(input, matrices, surchargeMatrices) {
  const { containerType = '40GP', containerCount = 1, containers } = input;
  // If a multi-container payload is supplied, sum across all container lines.
  const lines = Array.isArray(containers) && containers.length
    ? containers.filter((c) => c && c.type && c.count > 0)
    : [{ type: containerType, count: containerCount }];

  const eligible = listEligibleFclMatrices(input, matrices);
  if (!eligible.length) return { error: 'No active FCL matrix found for this lane', matrix: null };

  const evaluated = eligible
    .map((m) => {
      const lineCosts = [];
      let freightTotal = 0;
      let unitCount = 0;
      for (const line of lines) {
        const rate = m.containerRates?.[line.type];
        if (rate == null) return null;
        const freight = rate * line.count;
        freightTotal += freight;
        unitCount += line.count;
        lineCosts.push({ type: line.type, count: line.count, rate, freight });
      }
      const thc = (m.surcharges?.thc || 0) * unitCount;
      const doc = m.surcharges?.documentationFee || 0;
      const seal = (m.surcharges?.sealFee || 0) * unitCount;
      const baseCost = freightTotal + thc + doc + seal;
      return { matrix: m, lineCosts, freight: freightTotal, thc, doc, seal, unitCount, baseCost };
    })
    .filter(Boolean);

  if (!evaluated.length) {
    const requested = lines.map((l) => l.type).join(', ');
    return { error: `No matrix offers ${requested} for this lane`, matrix: null };
  }
  evaluated.sort((a, b) => a.baseCost - b.baseCost);
  const best = evaluated[0];

  const surcharges = applySurcharges('ocean', best.baseCost, surchargeMatrices, input);
  const totalSurcharges = surcharges.reduce((a, s) => a + s.amount, 0);
  const currency = best.matrix.currency;

  const freightFormula = best.lineCosts
    .map((l) => `$${l.rate} × ${l.count} ${l.type}`)
    .join(' + ');

  const charges = {
    origin: [
      { code: 'OTHC', name: 'Origin Terminal Handling', comment: `$${best.matrix.surcharges?.thc || 0} × ${best.unitCount} container${best.unitCount !== 1 ? 's' : ''}`, units: best.unitCount, unitPrice: best.matrix.surcharges?.thc || 0, amount: best.thc, currency },
      { code: 'DOC', name: 'Documentation Fee', comment: 'Flat fee', units: 1, unitPrice: best.doc, amount: best.doc, currency },
      { code: 'SEAL', name: 'Container Seal Fee', comment: `Per container`, units: best.unitCount, unitPrice: best.matrix.surcharges?.sealFee || 0, amount: best.seal, currency },
    ],
    freight: [
      ...best.lineCosts.map((l) => ({
        code: 'FRT', name: 'Freight', comment: `${l.type} · port-to-port`, units: l.count, unitPrice: l.rate, amount: l.freight, currency,
      })),
      ...surcharges.map((s) => ({
        code: s.surchargeType?.toUpperCase().slice(0, 3) || 'SUR',
        name: s.surchargeName,
        comment: s.calculationType === 'percentage' ? `${s.value}% of base` : 'Flat fee',
        units: 1,
        unitPrice: s.amount,
        amount: s.amount,
        currency: s.currency,
      })),
    ],
    destination: [],
  };

  return {
    matrix: best.matrix,
    appliedBreak: {
      containerType: best.lineCosts.map((l) => `${l.count}×${l.type}`).join(' + '),
      lines: best.lineCosts,
    },
    breakdown: [
      { label: 'Freight', amount: best.freight, formula: freightFormula },
      { label: 'THC', amount: best.thc, formula: `$${best.matrix.surcharges?.thc || 0} × ${best.unitCount}` },
      { label: 'Documentation', amount: best.doc, formula: 'Flat fee' },
      { label: 'Seal fee', amount: best.seal, formula: `$${best.matrix.surcharges?.sealFee || 0} × ${best.unitCount}` },
    ],
    charges,
    baseCost: best.baseCost,
    surcharges,
    totalSurcharges,
    totalCost: best.baseCost + totalSurcharges,
    currency,
    alternatives: evaluated.slice(1, 4).map((e) => ({
      matrixId: e.matrix.id,
      providerName: e.matrix.carrierName,
      baseCost: e.baseCost,
    })),
  };
}

// ---------- SURCHARGES ----------
function applySurcharges(modeFamily, baseCost, matrices = defaultSurcharges, input = {}) {
  const today_ = today();
  const applicable = matrices.filter((s) => {
    if (s.status !== 'active') return false;
    if (s.effectiveDate > today_ || s.expiryDate < today_) return false;
    if (s.appliesTo !== 'all' && s.appliesTo !== modeFamily) return false;
    if (s.appliedToCarriers !== 'all' && input.carrier && s.appliedToCarriers !== input.carrier) return false;
    return true;
  });

  return applicable.map((s) => {
    const amount = s.calculationType === 'percentage' ? (baseCost * s.value) / 100 : s.value;
    return {
      id: s.id,
      surchargeName: s.surchargeName,
      surchargeType: s.surchargeType,
      calculationType: s.calculationType,
      value: s.value,
      amount,
      currency: s.currency,
    };
  });
}

// ---------- PUBLIC ENTRY ----------
export function calculateQuote(input, sources = {}) {
  const {
    airMatrices = defaultAir,
    lclMatrices = defaultLcl,
    fclMatrices = defaultFcl,
    surchargeMatrices = defaultSurcharges,
  } = sources;

  const mode = (input.mode || '').toLowerCase();
  if (mode === 'air') return { mode, ...calcAir(input, airMatrices, surchargeMatrices) };
  if (mode === 'lcl' || mode === 'ocean-lcl') return { mode: 'lcl', ...calcLcl(input, lclMatrices, surchargeMatrices) };
  if (mode === 'fcl' || mode === 'ocean-fcl') return { mode: 'fcl', ...calcFcl(input, fclMatrices, surchargeMatrices) };
  return { error: `Unknown mode: ${input.mode}` };
}

// ---------- VALIDATION HELPERS ----------
export function validateAirBreaks(breaks = []) {
  const errors = [];
  for (let i = 1; i < breaks.length; i++) {
    if (breaks[i].weight <= breaks[i - 1].weight) {
      errors.push(`Weight break ${i + 1} must be greater than break ${i}`);
    }
  }
  return errors;
}

export function validateLclBreaks(breaks = []) {
  const errors = [];
  for (let i = 1; i < breaks.length; i++) {
    if (breaks[i].minCBM < breaks[i - 1].maxCBM) {
      errors.push(`CBM break ${i + 1} overlaps with break ${i}`);
    }
    if (breaks[i].minCBM >= breaks[i].maxCBM) {
      errors.push(`Break ${i + 1}: min CBM must be less than max CBM`);
    }
  }
  return errors;
}

export function validateNoOverlap(matrices, candidate) {
  // No overlapping validity for same carrier + route
  return matrices.filter((m) => {
    if (m.id === candidate.id) return false;
    if (m.status !== 'active') return false;
    const sameLane = candidate.type === 'air'
      ? m.airlineCode === candidate.airlineCode && m.destination === candidate.destination && m.serviceType === candidate.serviceType
      : m.carrierCode === candidate.carrierCode && m.originPort === candidate.originPort && m.destinationPort === candidate.destinationPort;
    if (!sameLane) return false;
    return !(m.expiryDate < candidate.effectiveDate || m.effectiveDate > candidate.expiryDate);
  });
}
