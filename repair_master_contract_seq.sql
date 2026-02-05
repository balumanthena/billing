-- COMPLETE REPAIR: Master Contract Numbering
-- This script fixes the "relation does not exist" error and the "duplicate key" error.

-- 1. Create the missing sequence
CREATE SEQUENCE IF NOT EXISTS public.master_contract_seq START 1;

-- 2. Define the Generator Function (Ensures it uses the correct sequence)
CREATE OR REPLACE FUNCTION generate_master_contract_number() 
RETURNS TRIGGER AS $$
DECLARE
    seq_val BIGINT;
    fy_start INT;
    fy_end INT;
    fy_string TEXT;
    new_number TEXT;
BEGIN
    -- Determine Financial Year (April to March)
    IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
        fy_start := EXTRACT(YEAR FROM CURRENT_DATE) % 100;
        fy_end := (fy_start + 1) % 100;
    ELSE
        fy_start := (EXTRACT(YEAR FROM CURRENT_DATE) - 1) % 100;
        fy_end := EXTRACT(YEAR FROM CURRENT_DATE) % 100;
    END IF;

    -- Format FY string (e.g., "25-26")
    fy_string := LPAD(fy_start::TEXT, 2, '0') || '-' || LPAD(fy_end::TEXT, 2, '0');

    -- Get Next Sequence Value
    seq_val := nextval('public.master_contract_seq');

    -- Format: MC-YY-YY-XXX (e.g., MC-25-26-001)
    new_number := 'MC-' || fy_string || '-' || LPAD(seq_val::TEXT, 3, '0');

    -- Assign to NEW row
    NEW.master_invoice_number := new_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Trigger (Runs BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_generate_master_contract_number ON public.master_invoices;
CREATE TRIGGER trg_generate_master_contract_number
BEFORE INSERT ON public.master_invoices
FOR EACH ROW
WHEN (NEW.master_invoice_number IS NULL OR NEW.master_invoice_number = '')
EXECUTE FUNCTION generate_master_contract_number();

-- 4. SYNC Sequence with any existing data (The specific Fix)
DO $$
DECLARE
    v_max_val INTEGER;
    v_current_fy_prefix TEXT;
BEGIN
    -- Determine prefix again for scanning
    IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
        v_current_fy_prefix := 'MC-' || to_char(CURRENT_DATE, 'YY') || '-' || to_char(CURRENT_DATE + INTERVAL '1 year', 'YY') || '-';
    ELSE
        v_current_fy_prefix := 'MC-' || to_char(CURRENT_DATE - INTERVAL '1 year', 'YY') || '-' || to_char(CURRENT_DATE, 'YY') || '-';
    END IF;

    -- Find highest number used in DB
    SELECT COALESCE(MAX(CAST(substring(master_invoice_number from length(v_current_fy_prefix) + 1) AS INTEGER)), 0)
    INTO v_max_val
    FROM master_invoices
    WHERE master_invoice_number LIKE v_current_fy_prefix || '%';

    -- Reset sequence to safely continue from there
    PERFORM setval('public.master_contract_seq', v_max_val + 1);
    
    RAISE NOTICE 'REPAIR COMPLETE. Sequence fixed and synced to start at %', v_max_val + 2;
END;
$$;
