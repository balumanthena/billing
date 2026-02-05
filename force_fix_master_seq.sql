-- Targeted fix for Master Contract Sequence Collision
-- Specifically looks for the current FY pattern to ensure safety.

DO $$
DECLARE
    v_max_val INTEGER;
    v_current_fy_prefix TEXT;
BEGIN
    -- 1. Determine current FY Prefix (e.g., 'MC-25-26-')
    -- Logic matches the trigger: Month < 4 means we are in FY (Year-1)-(Year)
    IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
        v_current_fy_prefix := 'MC-' || to_char(CURRENT_DATE, 'YY') || '-' || to_char(CURRENT_DATE + INTERVAL '1 year', 'YY') || '-';
    ELSE
        v_current_fy_prefix := 'MC-' || to_char(CURRENT_DATE - INTERVAL '1 year', 'YY') || '-' || to_char(CURRENT_DATE, 'YY') || '-';
    END IF;

    RAISE NOTICE 'Scanning for max sequence with prefix: %', v_current_fy_prefix;

    -- 2. Find max sequence for this specific prefix
    SELECT COALESCE(MAX(CAST(substring(master_invoice_number from length(v_current_fy_prefix) + 1) AS INTEGER)), 0)
    INTO v_max_val
    FROM master_invoices
    WHERE master_invoice_number LIKE v_current_fy_prefix || '%';

    RAISE NOTICE 'Found Max Value: %', v_max_val;

    -- 3. Update Sequence
    -- Set to Max + 1 to be safe
    PERFORM setval('public.master_contract_seq', v_max_val + 1);
    
    RAISE NOTICE 'Sequence public.master_contract_seq reset to: %', v_max_val + 1;
END;
$$;
