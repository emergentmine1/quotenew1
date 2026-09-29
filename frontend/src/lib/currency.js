// KWE Currency conversion (static FX table for the mock)
// In production these would come from a live FX feed (ECB, Alpha Vantage, etc.).

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$', rate: 1.0 },
  { code: 'EUR', label: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', rate: 1.35 },
  { code: 'GBP', label: 'British Pound', symbol: '£', rate: 0.79 },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', rate: 155.4 },
];

export function convert(amountUsd, targetCode) {
  const c = CURRENCIES.find((x) => x.code === targetCode) || CURRENCIES[0];
  return amountUsd * c.rate;
}

export function symbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || '$';
}

export function formatMoney(amountUsd, targetCode, opts = {}) {
  const c = CURRENCIES.find((x) => x.code === targetCode) || CURRENCIES[0];
  const converted = amountUsd * c.rate;
  const digits = opts.digits ?? 2;
  const rounded = digits === 0 ? Math.round(converted) : converted;
  return `${c.symbol}${Number(rounded).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
