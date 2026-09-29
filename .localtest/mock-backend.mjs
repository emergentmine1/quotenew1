// Throwaway mock of the Spring Boot API, seeded from the user's JSON dumps.
// Used only to run the Next.js frontend locally for UI testing. Not part of the app.
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

const DIR = '/app/.localtest';
const airportRows = JSON.parse(readFileSync(`${DIR}/airports.json`, 'utf8')).md_airports;
const countryRows = JSON.parse(readFileSync(`${DIR}/countries.json`, 'utf8')).md_countries;
const codeRows = JSON.parse(readFileSync(`${DIR}/test_data.json`, 'utf8'))[
  Object.keys(JSON.parse(readFileSync(`${DIR}/test_data.json`, 'utf8')))[0]
];

const DEFAULTS = {
  version: 1, mode: 'TPMA', cargoType: 'CGTPNP', ratingType: 'RTTPU',
  pickupType: 'PDTPO', deliveryType: 'PDTPO',
  weightUom: 'WUMKG', dimensionUom: 'DUMCM', volumeUom: 'VUMCBM',
};

function codes(requested) {
  const wanted = requested ? new Set(requested.split(',').map((s) => s.trim().toUpperCase())) : null;
  const byCat = new Map();
  for (const r of codeRows) {
    if (wanted && !wanted.has(r.cmcode)) continue;
    if (!byCat.has(r.cmcode)) byCat.set(r.cmcode, { cmcode: r.cmcode, description: r.cmdescription, codes: [] });
    byCat.get(r.cmcode).codes.push({ cdcode: r.cdcode, description: r.cddescription, sequence: r.sequence });
  }
  for (const c of byCat.values()) c.codes.sort((a, b) => (a.sequence ?? 1e9) - (b.sequence ?? 1e9) || a.cdcode.localeCompare(b.cdcode));
  return { items: [...byCat.values()].sort((a, b) => a.cmcode.localeCompare(b.cmcode)) };
}

function airports(query, countryCode, limit) {
  const q = (query || '').trim().toLowerCase();
  const cc = (countryCode || '').trim().toUpperCase();
  let rows = airportRows.filter((a) => a.isactive);
  if (cc) rows = rows.filter((a) => (a.isocountry || '').toUpperCase() === cc);
  if (q) {
    rows = rows.filter((a) =>
      (a.iatacode || '').toLowerCase().startsWith(q) ||
      (a.municipality || '').toLowerCase().includes(q) ||
      (a.name || '').toLowerCase().includes(q));
    const rank = (a) => {
      const iata = (a.iatacode || '').toLowerCase();
      const mun = (a.municipality || '').toLowerCase();
      if (iata === q) return 0;
      if (iata.startsWith(q)) return 1;
      if (mun.startsWith(q)) return 2;
      return 3;
    };
    const size = (a) => ({ APTLRG: 0, APTMED: 1, APTSML: 2 }[a.type] ?? 3);
    rows.sort((a, b) => rank(a) - rank(b) || size(a) - size(b) || (a.iatacode || '').localeCompare(b.iatacode || ''));
  }
  rows = rows.slice(0, Math.min(limit ? Number(limit) : 20, 100));
  return {
    items: rows.map((a) => ({
      iataCode: a.iatacode, icaoCode: a.icaocode, name: a.name, municipality: a.municipality,
      isoRegion: a.isoregion, isoCountry: a.isocountry, latitude: a.latitude, longitude: a.longitude,
    })),
  };
}

function countries() {
  return {
    items: countryRows
      .filter((c) => c.isactive)
      .sort((a, b) => a.countryname.localeCompare(b.countryname))
      .map((c) => ({ countryCode: c.countrycode, countryName: c.countryname, region: c.region })),
  };
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const send = (obj, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
  };
  const p = u.pathname;
  if (p === '/ping') return send({ status: 'UP' });
  if (p === '/api/v1/profiledata/defaults') return send(DEFAULTS);
  if (p === '/api/v1/masterdata/codes') return send(codes(u.searchParams.get('cmcode')));
  if (p === '/api/v1/masterdata/airports')
    return send(airports(u.searchParams.get('query'), u.searchParams.get('countryCode'), u.searchParams.get('limit')));
  if (p === '/api/v1/masterdata/countries') return send(countries());
  if (p === '/api/v1/places/suggestions') return send({ items: [] });
  if (p === '/api/v1/quote-requests' && req.method === 'POST')
    return send({ qrid: 1045, qrref: 'QR-2026-001045', status: 'RQSNEW' }, 201);
  send({ title: 'Not found', status: 404, detail: `No mock for ${req.method} ${p}` }, 404);
});

server.listen(8080, '0.0.0.0', () => console.log('mock backend on :8080'));
