-- Resync master_contract_seq with max existing value
-- Resolves "duplicate key value violates unique constraint" on Master Invoices

DO $$
DECLARE
    v_max_val BIGINT;
BEGIN
    -- 1. Find the maximum sequence number used in 'MC-%' style invoices
    -- We assume format is MC-YY-YY-XXX, so we extract the last 3 digits
    -- We cast to INTEGER to sort correctly
    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(master_invoice_number, '.*-(\d+)$', '\1'), master_invoice_number) AS INTEGER)), 0)
    INTO v_max_val
    FROM master_invoices
    WHERE master_invoice_number LIKE 'MC-%';

    -- 2. Update the sequence to start AFTER this value
    -- We use GREATEST to ensure we don't go backwards if table is empty
    IF v_max_val > 0 THEN
        PERFORM setval('public.master_contract_seq', v_max_val);
        RAISE NOTICE 'Updated master_contract_seq to %', v_max_val;
    ELSE
        RAISE NOTICE 'No existing MC- numbers found, sequence left as is.';
    END IF;
END;
$$;
