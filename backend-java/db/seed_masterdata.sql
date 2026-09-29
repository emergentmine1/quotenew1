-- Master-data seed for the Instant Quote flows (master-data lookups + quote submit).
-- Idempotent: each row is inserted only if its key is not already present, so running
-- this against a DB that already has the data is a no-op. Safe to re-run.
--
-- Scope: only the code categories and cdcodes the public quote form and the submit
-- validator depend on. It does NOT seed md_airports / md_countries (bulk reference
-- data loaded separately) or any pricing tables.
--
-- Usage:
--   psql "$DATABASE_URL" -f backend-java/db/seed_masterdata.sql
-- or in a client connected to the quoteamdev database, schema quoteownr.

SET search_path TO quoteownr;

-- ---------------------------------------------------------------------------
-- Categories (md_codemaster). cmcode/cmdescription plus the NOT NULL audit cols.
-- ---------------------------------------------------------------------------
INSERT INTO md_codemaster (cmcode, cmdescription, cby, cdate, ctz, ctzstd, mby, mdate, mtz, mtzstd)
SELECT v.cmcode, v.cmdescription,
       'dataloader', now(), 'GMT', 'Etc/GMT', 'dataloader', now(), 'GMT', 'Etc/GMT'
FROM (VALUES
    ('TPM', 'Transport Mode'),
    ('CGT', 'Cargo Type'),
    ('RTT', 'Rating Type'),
    ('PDT', 'Pickup / Delivery Type'),
    ('WUM', 'Weight Unit of Measure'),
    ('DUM', 'Dimension Unit of Measure'),
    ('VUM', 'Volume Unit of Measure'),
    ('PKT', 'Package Type'),
    ('ACS', 'Accessorial Service')
) AS v(cmcode, cmdescription)
WHERE NOT EXISTS (SELECT 1 FROM md_codemaster m WHERE m.cmcode = v.cmcode);

-- ---------------------------------------------------------------------------
-- Codes (md_codedetail). cdcode/cmcode/cddescription/sequence plus audit cols.
-- Codes marked (*) are hard-required by the form defaults or the submit validator.
-- ---------------------------------------------------------------------------
INSERT INTO md_codedetail (cdcode, cmcode, cddescription, sequence, cby, cdate, ctz, ctzstd, mby, mdate, mtz, mtzstd)
SELECT v.cdcode, v.cmcode, v.cddescription, v.sequence,
       'dataloader', now(), 'GMT', 'Etc/GMT', 'dataloader', now(), 'GMT', 'Etc/GMT'
FROM (VALUES
    -- Transport mode
    ('TPMA',   'TPM', 'Air Freight',            1),   -- * default mode

    -- Cargo type
    ('CGTPNP', 'CGT', 'Packages and Pallets',   1),   -- * default cargo type

    -- Rating type
    ('RTTPU',  'RTT', 'Per Unit',               1),   -- * default rating type
    ('RTTTS',  'RTT', 'Total Shipment',         2),   -- * used by the "total" toggle

    -- Pickup / delivery type
    ('PDTPO',  'PDT', 'Port',                    1),   -- * default pickup & delivery type
    ('PDTDO',  'PDT', 'Door',                    2),   -- * door option (address becomes required)

    -- Weight UOM (submit always sends KG)
    ('WUMKG',  'WUM', 'Kilograms',               1),   -- * default weight UOM
    ('WUMLB',  'WUM', 'Pounds',                  2),

    -- Dimension UOM (submit always sends CM)
    ('DUMCM',  'DUM', 'Centimetres',             1),   -- * default dimension UOM
    ('DUMIN',  'DUM', 'Inches',                  2),

    -- Volume UOM (submit always sends CBM)
    ('VUMCBM', 'VUM', 'Cubic Metres',            1),   -- * default volume UOM
    ('VUMCFT', 'VUM', 'Cubic Feet',              2),

    -- Package types (form defaults to PKTBOX; the rest fill the dropdown)
    ('PKTBOX', 'PKT', 'Box',                     1),   -- * default package type
    ('PKTPLT', 'PKT', 'Pallet',                  2),
    ('PKTCRT', 'PKT', 'Crate',                   3),
    ('PKTDRM', 'PKT', 'Drum',                    4),
    ('PKTBAG', 'PKT', 'Bag',                     5),

    -- Accessorial services (rendered as the three service cards in step 3)
    ('ACSOCC', 'ACS', 'Customs Clearance at Origin',      1),   -- *
    ('ACSDCC', 'ACS', 'Customs Clearance at Destination', 2),   -- *
    ('ACSINS', 'ACS', 'Cargo Insurance',                  3)    -- *
) AS v(cdcode, cmcode, cddescription, sequence)
WHERE NOT EXISTS (SELECT 1 FROM md_codedetail d WHERE d.cdcode = v.cdcode);
