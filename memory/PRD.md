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

## Deliverable
- `backend-java/db/seed_masterdata.sql` — idempotent seed for the md_codemaster/md_codedetail rows
  the form defaults + submit validator hard-depend on (categories TPM,CGT,RTT,PDT,WUM,DUM,VUM,PKT,ACS
  and their required cdcodes). This is the real functional prerequisite; the dump had no row data so
  it can't be confirmed present in the user's DB.

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

## Backlog / next
- P1: Wire live pricing (tx_quote, tx_quotepricingelements, pf_ratebook*, pf_tactrates, md_pricingelements,
  md_currencies) and replace the mock results view.
- P2: Remove dead pricing/mock frontend files.
- P2: Optional local docker Postgres harness to run the stack end-to-end.
