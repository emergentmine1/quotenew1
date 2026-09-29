export const CITY_ZIP_SUGGESTIONS = [
  { city: 'Taipei', state: 'Taipei City', zipCode: '100', country: 'Taiwan', countryCode: 'TW' },
  { city: 'Kaohsiung', state: 'Kaohsiung', zipCode: '800', country: 'Taiwan', countryCode: 'TW' },
  { city: 'Taichung', state: 'Taichung', zipCode: '400', country: 'Taiwan', countryCode: 'TW' },
  { city: 'Bangkok', state: 'Bangkok', zipCode: '10110', country: 'Thailand', countryCode: 'TH' },
  { city: 'Tokyo', state: 'Tokyo', zipCode: '100-0001', country: 'Japan', countryCode: 'JP' },
  { city: 'Seoul', state: 'Seoul', zipCode: '04524', country: 'South Korea', countryCode: 'KR' },
  { city: 'Singapore', state: 'Central', zipCode: '018989', country: 'Singapore', countryCode: 'SG' },
  { city: 'Hong Kong', state: 'Central', zipCode: '999077', country: 'Hong Kong', countryCode: 'HK' },
  { city: 'Frankfurt', state: 'Hesse', zipCode: '60311', country: 'Germany', countryCode: 'DE' },
  { city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'USA', countryCode: 'US' },
  { city: 'Fort Worth', state: 'TX', zipCode: '76102', country: 'USA', countryCode: 'US' },
  { city: 'Fort Lauderdale', state: 'FL', zipCode: '33301', country: 'USA', countryCode: 'US' },
  { city: 'Fort Myers', state: 'FL', zipCode: '33901', country: 'USA', countryCode: 'US' },
  { city: 'Chicago', state: 'IL', zipCode: '60601', country: 'USA', countryCode: 'US' },
  { city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'USA', countryCode: 'US' },
  { city: 'New York', state: 'NY', zipCode: '10001', country: 'USA', countryCode: 'US' },
  { city: 'Houston', state: 'TX', zipCode: '77002', country: 'USA', countryCode: 'US' },
  { city: 'Dallas', state: 'TX', zipCode: '75201', country: 'USA', countryCode: 'US' },
  { city: 'San Francisco', state: 'CA', zipCode: '94103', country: 'USA', countryCode: 'US' },
  { city: 'Seattle', state: 'WA', zipCode: '98101', country: 'USA', countryCode: 'US' },
  { city: 'Miami', state: 'FL', zipCode: '33101', country: 'USA', countryCode: 'US' },
  { city: 'Atlanta', state: 'GA', zipCode: '30303', country: 'USA', countryCode: 'US' },
  { city: 'Boston', state: 'MA', zipCode: '02108', country: 'USA', countryCode: 'US' },
  { city: 'Denver', state: 'CO', zipCode: '80202', country: 'USA', countryCode: 'US' },
  { city: 'Phoenix', state: 'AZ', zipCode: '85004', country: 'USA', countryCode: 'US' },
  { city: 'Minneapolis', state: 'MN', zipCode: '55401', country: 'USA', countryCode: 'US' },
  { city: 'Portland', state: 'OR', zipCode: '97204', country: 'USA', countryCode: 'US' },
  { city: 'San Diego', state: 'CA', zipCode: '92101', country: 'USA', countryCode: 'US' },
  { city: 'Charlotte', state: 'NC', zipCode: '28202', country: 'USA', countryCode: 'US' },
  { city: 'Nashville', state: 'TN', zipCode: '37201', country: 'USA', countryCode: 'US' },
];

export function formatCityZipSuggestion(item) {
  return `${item.city}, ${item.state}, ${item.zipCode}, ${item.country}`;
}

