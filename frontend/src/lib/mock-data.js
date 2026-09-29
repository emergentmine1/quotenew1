// KWE reference data used by the public Instant Quote flow.
// Origin/destination dropdowns and carrier branding read from here.
// NOTE: airport/country lookups can later be sourced from the backend
// (GET /api/v1/masterdata/airports, /countries) once the async search UI is added.

const PROVIDERS = [
  { id: 'p_dhl', name: 'DHL Global Forwarding', code: 'DHL', reliability: 4.8, color: '#FFCC00', textColor: '#0F172A' },
  { id: 'p_kn', name: 'Kuehne+Nagel', code: 'K+N', reliability: 4.7, color: '#005A9C', textColor: '#FFFFFF' },
  { id: 'p_dsv', name: 'DSV Air & Sea', code: 'DSV', reliability: 4.5, color: '#0066B3', textColor: '#FFFFFF' },
  { id: 'p_dbs', name: 'DB Schenker', code: 'DBS', reliability: 4.6, color: '#E2001A', textColor: '#FFFFFF' },
  { id: 'p_maersk', name: 'Maersk Logistics', code: 'MSK', reliability: 4.9, color: '#42B0D5', textColor: '#FFFFFF' },
  { id: 'p_yusen', name: 'Yusen Logistics', code: 'YSL', reliability: 4.7, color: '#003366', textColor: '#FFFFFF' },
  { id: 'p_expeditors', name: 'Expeditors International', code: 'EXP', reliability: 4.6, color: '#1F3A93', textColor: '#FFFFFF' },
  { id: 'p_chrobinson', name: 'C.H. Robinson', code: 'CHR', reliability: 4.4, color: '#003B71', textColor: '#FFFFFF' },
  { id: 'p_geodis', name: 'Geodis', code: 'GDS', reliability: 4.5, color: '#0033A0', textColor: '#FFFFFF' },
  { id: 'p_cma', name: 'CMA CGM Group', code: 'CMA', reliability: 4.6, color: '#E30613', textColor: '#FFFFFF' },
];

const PORTS = [
  { code: 'SGSIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG', region: 'APAC' },
  { code: 'CNSHA', city: 'Shanghai', country: 'China', countryCode: 'CN', region: 'APAC' },
  { code: 'HKHKG', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', region: 'APAC' },
  { code: 'JPTYO', city: 'Tokyo', country: 'Japan', countryCode: 'JP', region: 'APAC' },
  { code: 'KRPUS', city: 'Busan', country: 'South Korea', countryCode: 'KR', region: 'APAC' },
  { code: 'USLAX', city: 'Los Angeles', country: 'USA', countryCode: 'US', region: 'AMER' },
  { code: 'USNYC', city: 'New York', country: 'USA', countryCode: 'US', region: 'AMER' },
  { code: 'USORD', city: 'Chicago', country: 'USA', countryCode: 'US', region: 'AMER' },
  { code: 'DEHAM', city: 'Hamburg', country: 'Germany', countryCode: 'DE', region: 'EMEA' },
  { code: 'NLRTM', city: 'Rotterdam', country: 'Netherlands', countryCode: 'NL', region: 'EMEA' },
  { code: 'GBLON', city: 'London', country: 'UK', countryCode: 'GB', region: 'EMEA' },
  { code: 'AEDXB', city: 'Dubai', country: 'UAE', countryCode: 'AE', region: 'EMEA' },
  { code: 'INBOM', city: 'Mumbai', country: 'India', countryCode: 'IN', region: 'APAC' },
  { code: 'INMAA', city: 'Chennai', country: 'India', countryCode: 'IN', region: 'APAC' },
  { code: 'AUSYD', city: 'Sydney', country: 'Australia', countryCode: 'AU', region: 'APAC' },
];

const AIRPORTS = [
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', countryCode: 'HK', name: 'Chek Lap Kok' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', countryCode: 'SG', name: 'Changi Airport' },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', countryCode: 'JP', name: 'Narita International' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', countryCode: 'TH', name: 'Suvarnabhumi' },
  { code: 'TPE', city: 'Taipei', country: 'Taiwan', countryCode: 'TW', name: 'Taiwan Taoyuan' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', countryCode: 'KR', name: 'Incheon International' },
  { code: 'PVG', city: 'Shanghai', country: 'China', countryCode: 'CN', name: 'Pudong International' },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', countryCode: 'US', name: 'Los Angeles Intl' },
  { code: 'JFK', city: 'New York', country: 'USA', countryCode: 'US', name: 'John F. Kennedy Intl' },
  { code: 'ORD', city: 'Chicago', country: 'USA', countryCode: 'US', name: "O'Hare International" },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', countryCode: 'DE', name: 'Frankfurt am Main' },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', name: 'Schiphol' },
  { code: 'LHR', city: 'London', country: 'UK', countryCode: 'GB', name: 'Heathrow' },
  { code: 'DXB', city: 'Dubai', country: 'UAE', countryCode: 'AE', name: 'Dubai International' },
  { code: 'BOM', city: 'Mumbai', country: 'India', countryCode: 'IN', name: 'Chhatrapati Shivaji' },
  { code: 'MAA', city: 'Chennai', country: 'India', countryCode: 'IN', name: 'Chennai International' },
  { code: 'SYD', city: 'Sydney', country: 'Australia', countryCode: 'AU', name: 'Kingsford Smith' },
];

export const providers = PROVIDERS;
export const ports = PORTS;
export const airports = AIRPORTS;
