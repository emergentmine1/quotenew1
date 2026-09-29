-- One-shot env check for the Instant Quote flows (master-data lookups + submit).
-- Run in the quoteamdev DB. Every row should report OK; any MISSING/EMPTY blocks a flow.
--   psql "$DATABASE_URL" -f backend-java/db/verify_env.sql
SET search_path TO quoteownr;

-- 1) Required code categories + cdcodes (form defaults & submit validator depend on these).
WITH required(cmcode, cdcode) AS (VALUES
    ('TPM','TPMA'), ('CGT','CGTPNP'),
    ('RTT','RTTPU'), ('RTT','RTTTS'),
    ('PDT','PDTPO'), ('PDT','PDTDO'),
    ('WUM','WUMKG'), ('DUM','DUMCM'), ('VUM','VUMCBM'),
    ('PKT','PKTBOX'),
    ('ACS','ACSOCC'), ('ACS','ACSDCC'), ('ACS','ACSINS')
)
SELECT 'code' AS kind, r.cmcode, r.cdcode,
       CASE WHEN d.cdcode IS NULL THEN 'MISSING'
            WHEN NOT d.isactive THEN 'INACTIVE'
            ELSE 'OK' END AS status
FROM required r
LEFT JOIN md_codedetail d ON d.cdcode = r.cdcode
ORDER BY r.cmcode, r.cdcode;

-- 2) Reference tables must hold rows (airport/destination search, country dropdown).
SELECT 'md_airports'  AS table_name,
       count(*) FILTER (WHERE isactive) AS active_rows,
       CASE WHEN count(*) FILTER (WHERE isactive) > 0 THEN 'OK' ELSE 'EMPTY' END AS status
FROM md_airports
UNION ALL
SELECT 'md_countries',
       count(*) FILTER (WHERE isactive),
       CASE WHEN count(*) FILTER (WHERE isactive) > 0 THEN 'OK' ELSE 'EMPTY' END
FROM md_countries;

-- 3) Default origin airport used by the form (ORD) should resolve.
SELECT 'origin_default' AS check_name, iatacode,
       CASE WHEN isactive THEN 'OK' ELSE 'INACTIVE' END AS status
FROM md_airports WHERE iatacode = 'ORD';
