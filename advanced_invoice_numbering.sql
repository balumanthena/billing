-- Advanced Invoice Numbering Migration (Hybrid System)

CREATE OR REPLACE FUNCTION generate_invoice_number(p_company_id UUID, p_date DATE, p_master_invoice_id UUID DEFAULT NULL, p_phase_number INT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_fy TEXT;
    v_seq INTEGER;
    v_invoice_number TEXT;
    v_master_number TEXT;
    v_master_suffix TEXT;
BEGIN
    -- Scenario 1: Phase Invoice (Linked to Master Contract)
    IF p_master_invoice_id IS NOT NULL THEN
        -- Fetch Master Contract Number (e.g., MC-25-26-017)
        SELECT master_invoice_number INTO v_master_number
        FROM master_invoices
        WHERE id = p_master_invoice_id;

        -- If Master Number exists and follows valid format
        IF v_master_number IS NOT NULL THEN
            -- Extract Suffix (017 from MC-25-26-017)
            -- Assumes format MC-YY-YY-XXX or similar last part
            v_master_suffix := SPLIT_PART(v_master_number, '-', 3); 
            
            -- Fallback if split fails or format is different (just take last 3 chars?)
            IF v_master_suffix = '' THEN
               v_master_suffix := RIGHT(v_master_number, 3);
            END IF;

            -- Format: INV-017-P1
            -- Ensure p_phase_number is present
            IF p_phase_number IS NULL THEN
                 -- Fallback: Count existing phases + 1? Or require it?
                 -- For now, default to 'X' if missing, but app logic should provide it.
                 v_invoice_number := 'INV-' || v_master_suffix || '-PX';
            ELSE
                 v_invoice_number := 'INV-' || v_master_suffix || '-P' || p_phase_number;
            END IF;
            
            RETURN v_invoice_number;
        END IF;
    END IF;

    -- Scenario 2: Standard Invoice (Global Sequence)
    v_fy := get_financial_year(p_date);
    
    INSERT INTO invoice_sequences (company_id, financial_year, last_sequence)
    VALUES (p_company_id, v_fy, 1)
    ON CONFLICT (company_id, financial_year)
    DO UPDATE SET last_sequence = invoice_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;
    
    -- Format: INV-25-26-0001
    v_invoice_number := 'INV-' || v_fy || '-' || lpad(v_seq::text, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Update Trigger to pass new arguments
CREATE OR REPLACE FUNCTION trigger_set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Logic: If Number is missing OR format is invalid/temp
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' OR NEW.invoice_number NOT LIKE 'INV-%' THEN
        NEW.invoice_number := generate_invoice_number(
            NEW.company_id, 
            NEW.date, 
            NEW.master_invoice_id, 
            NEW.phase_number
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
