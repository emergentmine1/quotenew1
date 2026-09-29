// Option lists and default values for the quote form, loaded from the backend.
// They change rarely, so they are cached on the server for 10 minutes.

import { callBackend } from './backend';

const CACHE_TTL_MS = 10 * 60 * 1000;
const CATEGORIES = {
  modes: 'TPM',
  cargoTypes: 'CGT',
  ratingTypes: 'RTT',
  packageTypes: 'PKT',
  services: 'ACS',
  locationTypes: 'PDT',
};

let cached = null;
let cachedAt = 0;

export async function loadFormOptions() {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const [defaults, master, countries] = await Promise.all([
    callBackend('/api/v1/profiledata/defaults'),
    callBackend(`/api/v1/masterdata/codes?cmcode=${Object.values(CATEGORIES).join(',')}`),
    callBackend('/api/v1/masterdata/countries'),
  ]);

  const options = { defaults };
  for (const [key, cmcode] of Object.entries(CATEGORIES)) {
    const category = (master.items || []).find((item) => item.cmcode === cmcode);
    options[key] = (category?.codes || []).map((code) => ({ code: code.cdcode, name: code.description }));
  }
  options.countries = (countries.items || []).map((country) => ({ code: country.countryCode, name: country.countryName }));

  cached = options;
  cachedAt = Date.now();
  return cached;
}
