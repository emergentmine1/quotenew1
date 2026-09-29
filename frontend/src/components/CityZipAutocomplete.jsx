'use client';

import { useCallback } from 'react';
import { MapPin } from 'lucide-react';
import SearchInput from '@/components/SearchInput';
import { searchCityOrPostalCode } from '@/app/instant-quote/actions';
import { MAX_LENGTH } from '@/lib/field-limits';

// City or postal code lookup. The backend gets the suggestions from Amazon Location Service.
// Typing without picking a suggestion is allowed, so the field still works if the lookup is down.
export default function CityZipAutocomplete({
  value,
  onChange,
  onSelect,
  countryCode,
  placeholder = 'Type city or zip code',
  testId,
  className,
}) {
  const search = useCallback((text) => searchCityOrPostalCode(text, countryCode), [countryCode]);

  return (
    <SearchInput
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      search={search}
      getKey={(place) => place.id}
      getLabel={formatPlace}
      renderItem={(place) => (
        <>
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{formatPlace(place)}</span>
        </>
      )}
      placeholder={placeholder}
      unavailableText="Address lookup is unavailable. You can type the city or zip code."
      testId={testId}
      className={className}
      maxLength={MAX_LENGTH.address}
    />
  );
}

export function formatPlace(place) {
  return [place.city, place.state, place.zipCode, place.country].filter(Boolean).join(', ') || place.label;
}
