'use client';

import { useCallback } from 'react';
import Flag from '@/components/Flag';
import SearchInput from '@/components/SearchInput';
import { searchAirports } from '@/app/instant-quote/actions';

// Airport search backed by the backend's md_airports table.
// `countryCode` limits results to one country. `excludeCode` is applied here because
// the backend search has no "not in" filter.
export default function AirportPicker({
  value,
  onChange,
  onSelect,
  countryCode,
  excludeCode,
  placeholder,
  testId,
  committedValue,
}) {
  const search = useCallback(
    async (text) => {
      const result = await searchAirports(text, countryCode);
      const items = result.items.filter((airport) => airport.iataCode !== excludeCode);
      return { ok: result.ok, items };
    },
    [countryCode, excludeCode]
  );

  return (
    <SearchInput
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      search={search}
      committedValue={committedValue}
      getKey={(airport) => airport.iataCode}
      getLabel={formatAirport}
      renderItem={(airport) => (
        <>
          <Flag code={airport.isoCountry} size={18} />
          <span>{formatAirport(airport)}</span>
        </>
      )}
      placeholder={placeholder}
      unavailableText="Airport search is unavailable right now. Please try again shortly."
      testId={testId}
    />
  );
}

export function formatAirport(airport) {
  return `${airport.iataCode} - ${airport.municipality || airport.name || ''}`.trim();
}
