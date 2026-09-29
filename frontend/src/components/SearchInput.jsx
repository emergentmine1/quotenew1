'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * A text box that searches as the user types and lists the matches below it.
 * `search(text)` must return `{ ok, items }`. Only the answer for the latest text is shown.
 */
export default function SearchInput({
  value,
  onChange,
  onSelect,
  search,
  getKey,
  getLabel,
  renderItem = getLabel,
  placeholder,
  unavailableText = 'Search is unavailable right now.',
  testId,
  className,
  maxLength,
  committedValue = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  // `query` records which text these results belong to, so older answers are never shown.
  const [result, setResult] = useState({ query: '', items: [], failed: false });
  const query = (value || '').trim();
  // When the box still shows a previously chosen item's label (e.g. "ORD - Chicago"), that label
  // is not a search term, so we must not search it or show a "No matches" message for it.
  const showsCommitted = query.length >= MIN_QUERY_LENGTH && query === String(committedValue || '').trim();

  useEffect(() => {
    if (!isOpen || query.length < MIN_QUERY_LENGTH || showsCommitted) return undefined;

    let isLatest = true;
    const timer = setTimeout(async () => {
      const { ok, items } = await search(query).catch(() => ({ ok: false, items: [] }));
      if (isLatest) setResult({ query, items, failed: !ok });
    }, DEBOUNCE_MS);

    return () => {
      isLatest = false;
      clearTimeout(timer);
    };
  }, [isOpen, query, search, showsCommitted]);

  const isLoading = result.query !== query;
  const items = isLoading ? [] : result.items;

  const choose = (item) => {
    onChange?.(getLabel(item));
    onSelect?.(item);
    setIsOpen(false);
  };

  const showList = isOpen && query.length >= MIN_QUERY_LENGTH && !showsCommitted;

  return (
    <div className={cn('relative', className)}>
      <Input
        data-testid={testId}
        value={value || ''}
        onChange={(event) => {
          onChange?.(event.target.value);
          setIsOpen(true);
        }}
        // Select the chosen label on focus so the first keystroke replaces it and a new search starts.
        onFocus={(event) => {
          setIsOpen(true);
          if (showsCommitted) event.target.select();
        }}
        // Close after a short delay so a click on a suggestion still registers.
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={maxLength}
        className="h-12 rounded-xl border-slate-200"
      />

      {showList && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {items.map((item) => (
            <button
              key={getKey(item)}
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              onMouseDown={(event) => {
                event.preventDefault();
                choose(item);
              }}
            >
              {renderItem(item)}
            </button>
          ))}
          {items.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">
              {isLoading ? 'Searching...' : result.failed ? unavailableText : 'No matches found.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
