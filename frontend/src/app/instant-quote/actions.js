'use server';

// Server actions for the quote form. The browser never talks to the backend directly, and only
// the backend talks to AWS.
// Each action returns a plain result object instead of throwing, because Next.js hides
// thrown error messages from the browser in production.

import { BackendError, callBackend } from '@/server/backend';
import { loadFormOptions } from '@/server/form-options';
import { logError } from '@/server/log';
import { toQuoteRequestPayload } from '@/server/quote-request-mapper';

const MIN_QUERY_LENGTH = 2;
const AIRPORT_RESULT_LIMIT = 20;

export async function submitQuoteRequest(form) {
  try {
    const options = await loadFormOptions();
    const created = await callBackend('/api/v1/quote-requests', {
      method: 'POST',
      body: toQuoteRequestPayload(form, options),
    });
    return { ok: true, reference: created.qrref };
  } catch (error) {
    logError('Quote request submit failed', error);
    if (error instanceof BackendError && error.status === 400) {
      return { ok: false, message: 'Some details were not accepted. Please check the form and try again.' };
    }
    return { ok: false, message: 'We could not send your request right now. Please try again in a few minutes.' };
  }
}

export async function searchAirports(query, countryCode) {
  const text = String(query || '').trim();
  if (text.length < MIN_QUERY_LENGTH) {
    return { ok: true, items: [] };
  }

  const params = new URLSearchParams({ query: text, limit: String(AIRPORT_RESULT_LIMIT) });
  if (countryCode) params.set('countryCode', countryCode);

  try {
    const result = await callBackend(`/api/v1/masterdata/airports?${params}`);
    return { ok: true, items: result.items || [] };
  } catch (error) {
    logError('Airport search failed', error);
    return { ok: false, items: [] };
  }
}

export async function searchCityOrPostalCode(query, countryCode) {
  const text = String(query || '').trim();
  if (text.length < MIN_QUERY_LENGTH) {
    return { ok: true, items: [] };
  }

  const params = new URLSearchParams({ query: text });
  if (countryCode) params.set('countryCode', countryCode);

  try {
    // The backend calls Amazon Location Service, so the API key never reaches this server.
    const result = await callBackend(`/api/v1/places/suggestions?${params}`);
    return { ok: true, items: result.items || [] };
  } catch (error) {
    logError('City and postal code search failed', error);
    return { ok: false, items: [] };
  }
}
