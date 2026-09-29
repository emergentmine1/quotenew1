# KWE Instant Quote — PRD / Working Notes

## Problem statement
Existing monorepo (Spring Boot 3.5 / Java 17 backend + Next.js 15 / React 19 frontend) for a
public freight "Instant Quote" form. User asked to scan the project and, given the DB structure,
complete the pending "API integration to the frontend" for **master-data lookups** and
**quote submit + confirmation**. Live pricing is explicitly out of scope ("no pricing until submit").
User runs the code in their own AWS/Postgres (Aurora) environment — code-only, not run here.

## Architecture
- Browser → Next.js server actions (`frontend/src/app/instant-quote/actions.js`) → Spring Boot REST
  (`BACKEND_URL`, server-side only) → jOOQ → PostgreSQL schema `quoteownr`. Browser never calls
  the backend or AWS directly.
- jOOQ classes are generated at build time from the live DB (`pom.xml` codegen, `inputSchema=quoteownr`),
  so the backend requires DB connectivity to compile.

## DB schema (from quote_dev_tables.json — information_schema.columns, structure only)
Tables present: md_airlines, md_airports, md_codedetail, md_codemaster, md_countries, md_currencies,
md_pricingelements, pf_ratebookdetails, pf_ratebookheader, pf_tactrates, tx_quote,
tx_quoteaccessorialservices, tx_quotepricingelements, tx_quoterequest, tx_quoterequestdetails.

## Reconciliation done (2026-06)
Verified every repository/DTO/mapper column against the schema:
- md_codemaster, md_codedetail, md_countries, md_airports — all columns used by the code exist. ✓
- tx_quoterequest (56 cols): all 56 setters map to real columns; every NOT NULL-without-default
  column is populated. ✓
- tx_quoterequestdetails (29 cols): qrdid uses DB sequence default; all other setters valid. ✓
- tx_quoteaccessorialservices (11 cols): (qrid, servicecode) + audit cols. ✓
- Sequences tx_quoterequest_seq / tx_quoterequestdetails_seq exist. ✓
- Frontend↔backend code contracts (quote-codes.js constants RTTPU/RTTTS/PDTPO/PDTDO, form-options
  category map TPM/CGT/RTT/PKT/ACS/PDT) all consistent. ✓
=> No code mismatches. Integration for the two in-scope flows was already implemented and is correct.

## Master-data verified against real rows (2026-06, quote_dev_md_data.json + quote_dev_table_test_data.json)
- md_codemaster: all 15 categories present, incl. the 9 the app needs (TPM,CGT,RTT,PDT,WUM,DUM,VUM,PKT,ACS). ✓
- md_codedetail: all required cdcodes present AND active — TPMA, CGTPNP, RTTPU, RTTTS, PDTPO, PDTDO,
  WUMKG, DUMCM, VUMCBM, PKTBOX, ACSOCC, ACSDCC, ACSINS. Nothing missing. ✓
- => The master-data lookups + submit flows are fully satisfied by existing data. NO code changes needed.
- Still unverified: md_airports / md_countries row counts (data not supplied in these files).

## Deliverables
- `backend-java/db/seed_masterdata.sql` — idempotent seed (confirmed NOT needed for the current DB;
  kept as a safety-net for spinning up fresh environments).
- `backend-java/db/verify_env.sql` — one-shot check: required codes present/active + md_airports /
  md_countries non-empty + ORD default airport resolves. Run this in any env to confirm readiness.

## Out of scope / dead code (left untouched)
- Live pricing/results view: `views/InstantQuoteResults.jsx`, `views/NoRateFound.jsx`,
  `lib/pricing-engine.js`, `lib/pricing-data.js`, `lib/mock-data.js`, `lib/city-zip-suggestions.js`.
  These are not routed by any page. Remove later if desired.

## Env prerequisites for the flows to work in the user's environment
- DB reachable; `md_airports` and `md_countries` populated (bulk reference data).
- Master-data codes present (run seed_masterdata.sql if missing).
- Optional: `LOCATION_API_KEY` (city/zip autocomplete; falls back to free text if absent);
  SPRING_MAIL_* + MAIL_FROM/MAIL_INTERNAL_TO (confirmation + internal emails).

## Not verified here
Could not build/run the Java backend against Postgres/Aurora in this environment (no DB, and the
user opted to run in their own env). Reconciliation is static, against the provided schema.

## Changes made (2026-06)
- Dimension (IN/CM) and Weight (KG/LB) toggles are now data-driven from the backend DUM / WUM
  categories instead of hardcoded arrays:
  - `server/form-options.js`: fetch adds `weightUoms: 'WUM'`, `dimensionUoms: 'DUM'`.
  - `views/InstantQuote.jsx`: `DIM_UNIT_UI` / `WEIGHT_UNIT_UI` allow-lists (cdcode -> symbol),
    `dimUnitOptions` / `weightUnitOptions` memos, and toggle defaults now follow the backend
    default UOM (`defaults.dimensionUom` DUMCM -> CM, `defaults.weightUom` WUMKG -> KG). This
    changed the visible dimension default from IN to CM (matches the DB default).
  - `components/UnitForm.jsx`: `UnitToggle` options come from the new props, no literal arrays.
  - Submit unchanged: values are still normalised to metric and sent with the DB UOM codes.
  - Allow-list keeps only engine-supported units (CM/IN, KG/LB); extra DB codes (FT, M, G, MT, ST,
    CBM-under-WUM) are intentionally not shown since the conversion math does not support them.

## Backlog / next
