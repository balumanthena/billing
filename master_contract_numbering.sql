-- Migration: Atomic Master Contract Numbering (MC-YY-YY-XXX)

-- 1. Create Sequence for Master Contracts
CREATE SEQUENCE IF NOT EXISTS public.master_contract_seq START 1;

-- 2. Create Generator Function
CREATE OR REPLACE FUNCTION generate_master_contract_number() 
RETURNS TRIGGER AS $$
DECLARE
    seq_val BIGINT;
    fy_start INT;
    fy_end INT;
    fy_string TEXT;
    new_number TEXT;
BEGIN
    -- Determine Financial Year based on Current Date (April to March)
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

    -- Format: MC-25-26-001
    new_number := 'MC-' || fy_string || '-' || LPAD(seq_val::TEXT, 3, '0');

    -- Assign to NEW row
    NEW.master_invoice_number := new_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_generate_master_contract_number ON public.master_invoices;

CREATE TRIGGER trg_generate_master_contract_number
BEFORE INSERT ON public.master_invoices
FOR EACH ROW
WHEN (NEW.master_invoice_number IS NULL OR NEW.master_invoice_number = '')
EXECUTE FUNCTION generate_master_contract_number();
